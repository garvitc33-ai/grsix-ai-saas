import express from "express";
import db from "../sqlite.js";

const router = express.Router();

router.get("/test", (req, res) => res.json({ works: true }));

router.get("/", async (req, res) => {
  try {
    const campaigns = await db.allAsync(
      `SELECT * FROM campaigns ORDER BY scheduled_time DESC`
    );
    res.json(campaigns); // Test: just output array for now
  } catch (err) {
    console.error("ERROR in /api/campaigns:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
