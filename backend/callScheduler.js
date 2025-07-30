import cron from "node-cron";
import { getDueCalls, markCallCompleted } from "./models/scheduled_calls.js";
import { callWithAgent } from "./twilio/twilioClient.js";
import db from "./sqlite.js";
import app from "./index.js";

console.log("🔥 callScheduler.js loaded!");

// --- TIMEZONE HELPER --- //
function getNowInISTISOMinute() {
  const IST_OFFSET = 5.5 * 60;
  const now = new Date();
  const istTime = new Date(now.getTime() + (IST_OFFSET - now.getTimezoneOffset()) * 60000);
  istTime.setSeconds(0, 0);
  return istTime.toISOString();
}

// Patch db with Promise methods (no change)
if (!db.allAsync) {
  db.allAsync = (...args) =>
    new Promise((resolve, reject) => db.all(...args, (err, rows) => err ? reject(err) : resolve(rows)));
  db.getAsync = (...args) =>
    new Promise((resolve, reject) => db.get(...args, (err, row) => err ? reject(err) : resolve(row)));
  db.runAsync = (...args) =>
    new Promise((resolve, reject) => db.run(...args, function (err) { err ? reject(err) : resolve(this); }));
}

// --- Campaign stats for live analytics --- //
async function getCurrentCampaignStats() {
  try {
    const rows = await db.allAsync(
      "SELECT status, COUNT(*) as count FROM scheduled_calls GROUP BY status"
    );
    const summary = { pending: 0, completed: 0, failed: 0, waiting: 0 };
    rows.forEach(r => { summary[r.status] = r.count; });
    const row2 = await db.getAsync("SELECT COUNT(*) as total FROM scheduled_calls");
    summary.total = row2?.total || 0;
    return summary;
  } catch (err) {
    console.error("❌ Error fetching campaign stats:", err.message);
    return { error: err.message };
  }
}

// --- Update campaign status if all calls are finished --- //
async function updateCampaignStatusIfDone(campaign_id) {
  try {
    const row = await db.getAsync(
      "SELECT COUNT(*) AS pending FROM scheduled_calls WHERE campaign_id = ? AND status IN ('pending', 'waiting')",
      [campaign_id]
    );
    if (row) {
      if (row.pending === 0) {
        await db.runAsync("UPDATE campaigns SET status = 'completed' WHERE id = ?", [campaign_id]);
        console.log(`✅ Campaign ${campaign_id} marked as completed`);
      } else {
        await db.runAsync("UPDATE campaigns SET status = 'in-progress' WHERE id = ? AND status != 'in-progress'", [campaign_id]);
      }
    }
  } catch (err) {
    console.error("❌ Error in updateCampaignStatusIfDone:", err.message);
  }
}

// --- Main Cron Scheduler --- //
cron.schedule("* * * * *", async () => {
  console.log("🕑 [callScheduler] Cron triggered!", new Date().toISOString());
  const nowIST = getNowInISTISOMinute();

  try {
    const dueCalls = await getDueCalls(nowIST);
    for (const call of dueCalls) {
      try {
        await callWithAgent(call.agent_id, call.phone_number);
        await markCallCompleted(call.id);
        console.log("✅ Call placed to", call.phone_number);

        if (call.campaign_id) {
          await updateCampaignStatusIfDone(call.campaign_id);
        }

        const io = app.get("io");
        if (io) {
          const stats = await getCurrentCampaignStats();
          io.emit("campaign-stats", stats);
        }

        // Sequential: schedule next "waiting" lead
        const nextLead = await db.getAsync(
          "SELECT * FROM scheduled_calls WHERE status = 'waiting' ORDER BY id ASC LIMIT 1"
        );
        if (nextLead) {
          const newTimeIST = getNowInISTISOMinute();
          await db.runAsync(
            "UPDATE scheduled_calls SET status = 'pending', scheduled_time = ? WHERE id = ?",
            [newTimeIST, nextLead.id]
          );
          console.log("➡️ Next lead scheduled:", nextLead.customer_name);
          if (io) {
            const stats2 = await getCurrentCampaignStats();
            io.emit("campaign-stats", stats2);
          }
        }
      } catch (err) {
        console.error("❌ Failed to call", call.phone_number, err.message);
        const io = app.get("io");
        if (io) {
          const stats = await getCurrentCampaignStats();
          io.emit("campaign-stats", stats);
        }
        if (call.campaign_id) {
          await updateCampaignStatusIfDone(call.campaign_id);
        }
      }
    }
  } catch (err) {
    console.error("❌ Scheduler error:", err.message);
  }
});
