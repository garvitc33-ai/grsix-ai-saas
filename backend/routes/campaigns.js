import express from "express";
import db from "../sqlite.js";

const router = express.Router();

// === Patch db methods for Promises (Render-safe) ===
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

// === Helpers ===
function sqlDateRange(column = "called_at", from, to) {
  if (!from && !to) return "";
  let clause = "";
  if (from) clause += ` AND ${column} >= '${from}'`;
  if (to) clause += ` AND ${column} <= '${to}'`;
  return clause;
}

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
  return "";
}

// === Routes ===

// 1️⃣ Get all campaigns
router.get("/", async (req, res) => {
  try {
    const rows = await db.allAsync("SELECT * FROM campaigns ORDER BY scheduled_time DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Campaign stats
router.get("/stats", async (req, res) => {
  const { campaignId, agentId, from, to } = req.query;
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
    const totalRow = await db.getAsync(`SELECT COUNT(*) as total FROM scheduled_calls ${filter}`);
    summary.total = totalRow?.total || 0;
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Trend chart data
router.get("/stats/trend", async (req, res) => {
  const { campaignId, interval = "hourly", from, to } = req.query;
  let filter = "WHERE 1=1";
  if (campaignId) filter += " AND campaign_id = " + Number(campaignId);
  filter += sqlDateRange("called_at", from, to);
  const groupBy = interval === "daily"
    ? `strftime('%Y-%m-%d', called_at)`
    : `strftime('%Y-%m-%d %H', called_at)`;

  try {
    const rows = await db.allAsync(
      `SELECT ${groupBy} as bucket, COUNT(*) as count
       FROM scheduled_calls ${filter}
       GROUP BY bucket
       ORDER BY bucket ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 4️⃣ Leaderboard
router.get("/leaderboard", async (req, res) => {
  const { type = "completed", period, from, to } = req.query;
  let filter = "WHERE 1=1";
  if (period === "last7days") filter += ` AND called_at >= date('now', '-7 day')`;
  if (period === "today") filter += ` AND called_at >= date('now')`;
  filter += sqlDateRange("called_at", from, to);

  try {
    const rows = await db.allAsync(
      `SELECT agent_id, COUNT(*) as total_calls,
       SUM(status = 'completed') as completed_calls,
       SUM(CAST(duration as INTEGER)) as total_duration
       FROM scheduled_calls
       ${filter}
       GROUP BY agent_id
       ORDER BY ${type === "duration" ? "total_duration" : "completed_calls"} DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 5️⃣ Recent calls
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 6️⃣ Start a campaign
router.post("/start-campaign", async (req, res) => {
  const { agentId, leads, scheduledAt } = req.body;
  if (!agentId || !leads?.length || !scheduledAt) {
    return res.status(400).json({ message: "Missing fields!" });
  }

  try {
    const agentRow = await db.getAsync("SELECT * FROM agents WHERE id = ?", [agentId]);
    if (!agentRow) return res.status(404).json({ message: "Agent not found." });

    const result = await db.runAsync(
      `INSERT INTO campaigns (name, agent_id, scheduled_time, status)
       VALUES (?, ?, ?, ?)`,
      [`Campaign_${new Date().toISOString()}`, agentId, scheduledAt, "pending"]
    );
    const campaignId = result.lastID;

    for (let i = 0; i < leads.length; i++) {
      let lead = leads[i];
      let raw = extractPhone(lead) || "";
      raw = raw.toString().trim().replace(/\.0$/, "").replace(/[^+\d]/g, "");

      if (!raw || raw === "+91") continue;
      if (!raw.startsWith("+")) {
        if (raw.length === 10) raw = "+91" + raw;
        else if (raw.length > 10 && raw.startsWith("91")) raw = "+" + raw;
      }

      let script = agentRow.script || "";
      const leadName = lead.name || lead.Name || "Lead";
      if (script.includes("{name}")) script = script.replace("{name}", leadName);

      await db.runAsync(
        `INSERT INTO scheduled_calls (
          customer_name, phone_number, scheduled_time, script, status, agent_id, campaign_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          leadName,
          raw,
          i === 0 ? scheduledAt : null,
          script,
          i === 0 ? "pending" : "waiting",
          agentRow.id,
          campaignId,
        ]
      );
    }

    res.json({ message: "✅ Campaign created and leads scheduled!" });
  } catch (err) {
    console.error("❌ Error creating campaign:", err);
    res.status(500).json({ message: "Failed to start campaign." });
  }
});

// 7️⃣ Get campaign by ID
router.get("/:id", async (req, res) => {
  try {
    const row = await db.getAsync("SELECT * FROM campaigns WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ message: "Not found." });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
