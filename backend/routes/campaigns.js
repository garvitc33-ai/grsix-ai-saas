import express from "express";
import db from "../sqlite.js";
const router = express.Router();

// --- Helpers (unchanged, but can be refactored for clarity) ---

// For WHERE clauses with optional date range filters
function sqlDateRange(where = "called_at", from, to) {
  if (!from && !to) return "";
  let clause = "";
  if (from) clause += ` AND ${where} >= '${from}'`;
  if (to) clause += ` AND ${where} <= '${to}'`;
  return clause;
}

// Attempt to extract a phone number-like field from a lead object
function extractPhone(lead) {
  const phoneKeys = [
    "phone", "Phone", "number", "Number", "PhoneNumber", "phonenumber"
  ];
  for (let key of phoneKeys) {
    if (lead[key]) return lead[key];
  }
  for (let key in lead) {
    if (/phone|number/i.test(key) && lead[key]) return lead[key];
  }
  return '';
}

async function getCurrentCampaignStats(query = {}) {
  const { campaignId, agentId, from, to } = query;
  let filter = "WHERE 1=1";
  if (campaignId) filter += " AND campaign_id = " + Number(campaignId);
  if (agentId) filter += " AND agent_id = " + Number(agentId);
  filter += sqlDateRange("called_at", from, to);

  try {
    const rows = await db.allAsync(
      `SELECT status, COUNT(*) as count FROM scheduled_calls ${filter} GROUP BY status`
    );
    const summary = { pending: 0, completed: 0, failed: 0, waiting: 0 };
    rows.forEach((r) => { summary[r.status] = r.count; });
    const row2 = await db.getAsync(
      `SELECT COUNT(*) as total FROM scheduled_calls ${filter}`
    );
    summary.total = row2?.total || 0;
    return summary;
  } catch (err) {
    throw err;
  }
}

// Patch db to support Promises natively (if not already)
if (!db.allAsync) {
  db.allAsync = (...args) =>
    new Promise((resolve, reject) => {
      db.all(...args, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  db.getAsync = (...args) =>
    new Promise((resolve, reject) => {
      db.get(...args, (err, row) => (err ? reject(err) : resolve(row)));
    });
  db.runAsync = (...args) =>
    new Promise((resolve, reject) => {
      db.run(...args, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
}

// === GET all campaigns
router.get("/", async (req, res) => {
  try {
    const rows = await db.allAsync("SELECT * FROM campaigns");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === GET campaign stats (filtered/aggregated)
router.get("/stats", async (req, res) => {
  try {
    const stats = await getCurrentCampaignStats(req.query || {});
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === GET recent calls for table
router.get("/calls/recent", async (req, res) => {
  const { campaignId, agentId, limit = 20 } = req.query;
  let filter = "WHERE 1=1";
  if (campaignId) filter += " AND campaign_id = " + Number(campaignId);
  if (agentId) filter += " AND agent_id = " + Number(agentId);
  try {
    const rows = await db.allAsync(
      `SELECT id, customer_name, phone_number, status, called_at, duration, agent_id, campaign_id, outcome
       FROM scheduled_calls
       ${filter}
       ORDER BY called_at DESC
       LIMIT ?`,
      [Number(limit)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats/trend", async (req, res) => {
  const { campaignId, interval = "hourly", from, to } = req.query;
  let filter = "WHERE 1=1";
  if (campaignId) filter += " AND campaign_id = " + Number(campaignId);
  filter += sqlDateRange("called_at", from, to);
  let groupBy = interval === "daily"
    ? `strftime('%Y-%m-%d', called_at)`
    : `strftime('%Y-%m-%d %H', called_at)`;
  try {
    const rows = await db.allAsync(
      `SELECT ${groupBy} as bucket, COUNT(*) as count
       FROM scheduled_calls
       ${filter}
       GROUP BY bucket
       ORDER BY bucket ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/leaderboard", async (req, res) => {
  const { type = "completed", period, from, to } = req.query;
  let filter = "WHERE 1=1";
  if (period === "last7days") filter += ` AND called_at >= date('now', '-7 day')`;
  if (period === "today") filter += ` AND called_at >= date('now')`;
  filter += sqlDateRange("called_at", from, to);
  try {
    const rows = await db.allAsync(
      `SELECT agent_id, COUNT(*) as total_calls,
       SUM(status='completed') as completed_calls,
       SUM(CAST(duration as INTEGER)) as total_duration
       FROM scheduled_calls
       ${filter}
       GROUP BY agent_id
       ORDER BY ${type === "duration" ? "total_duration" : "completed_calls"} DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Main campaign creation: link scheduled_calls to campaign ---
router.post("/start-campaign", async (req, res) => {
  let { agentId, leads, scheduledAt } = req.body;
  if (!agentId || !leads || leads.length === 0 || !scheduledAt) {
    return res.status(400).json({ message: "Missing fields!" });
  }
  try {
    const agentRow = await db.getAsync("SELECT * FROM agents WHERE id = ?", [agentId]);
    if (!agentRow) return res.status(404).json({ message: "Agent not found." });
    // Insert new campaign
    const campaignInsert = await db.runAsync(
      `INSERT INTO campaigns (name, agent_id, scheduled_time, status)
       VALUES (?, ?, ?, ?)`,
      [
        `Campaign_${new Date().toISOString()}`,
        agentId,
        scheduledAt,
        "pending"
      ]
    );
    const campaignId = campaignInsert.lastID;
    for (let idx = 0; idx < leads.length; idx++) {
      let lead = leads[idx];
      let phoneRaw = extractPhone(lead) ?? '';
      phoneRaw = phoneRaw.toString().trim().replace(/\.0$/, "");
      if (!phoneRaw || phoneRaw === "+91" || phoneRaw === "") {
        console.error("❌ No phone number for lead:", lead);
        continue;
      }
      let cleaned = phoneRaw.replace(/[^+\d]/g, "");
      if (!cleaned.startsWith("+")) {
        if (cleaned.length === 10) cleaned = "+91" + cleaned;
        else if (cleaned.length > 10 && cleaned.startsWith("91")) cleaned = "+" + cleaned;
        else console.warn("⚠️ Unusual phone format:", cleaned);
      }
      const targetPhone = cleaned;
      const leadName = lead.name || lead.Name || "Lead";
      let aiScript = agentRow.script;
      if (aiScript && aiScript.includes("{name}")) aiScript = aiScript.replace("{name}", leadName);
      await db.runAsync(
        `INSERT INTO scheduled_calls (
          customer_name, phone_number, scheduled_time, script, status, agent_id, campaign_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          leadName,
          targetPhone,
          idx === 0 ? scheduledAt : null,
          aiScript,
          idx === 0 ? "pending" : "waiting",
          agentRow.id,
          campaignId
        ]
      );
    }
    res.json({ message: "Campaign and sequential calls scheduled for all provided lead numbers!" });
  } catch (err) {
    console.error("❌ Error starting campaign:", err.message);
    res.status(500).json({ message: "Failed to start campaign." });
  }
});

// === GET a specific campaign by ID (for demo/debug) ===
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const row = await db.getAsync("SELECT * FROM campaigns WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ message: "Not found." });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

