import express from "express";
import { saveEmailLead, getAllEmailLeads } from "../models/emailLead.js";
import db from "../sqlite.js";

const router = express.Router();

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

// ✅ Root test route for leads
router.get("/", (req, res) => {
  res.json({ message: "Leads API is working!" });
});

// === ✅ Email Leads ===

// Save an email lead
router.post("/email", async (req, res) => {
  try {
    const id = await saveEmailLead(req.body);
    res.status(200).json({ success: true, id });
  } catch (err) {
    console.error("❌ Error saving email lead:", err);
    res.status(500).json({ error: "Failed to save email lead" });
  }
});

// Get all email leads
router.get("/email", async (req, res) => {
  try {
    const leads = await getAllEmailLeads();
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an email lead by ID
router.delete("/email/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.runAsync("DELETE FROM email_leads WHERE id = ?", [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.status(200).json({ message: "Lead deleted successfully", deletedId: id });
  } catch (err) {
    console.error("❌ Error deleting email lead:", err.message);
    res.status(500).json({ message: "Failed to delete lead" });
  }
});

// === ✅ Campaign Call Leads ===

router.post("/", async (req, res) => {
  try {
    const { name, phone, scheduled_time, campaign_id } = req.body;
    if (!name || !phone || !scheduled_time || !campaign_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    await db.runAsync(
      `INSERT INTO campaign_leads (name, phone, scheduled_time, status, campaign_id)
       VALUES (?, ?, ?, 'pending', ?)`,
      [name, phone, scheduled_time, campaign_id]
    );
    res.status(200).json({ message: "Campaign lead scheduled successfully" });
  } catch (err) {
    console.error("❌ Error inserting campaign lead:", err);
    res.status(500).json({ error: "Failed to insert campaign lead" });
  }
});

export default router;
