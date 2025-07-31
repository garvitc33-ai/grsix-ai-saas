import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const router = express.Router();

// Use same database setup as in other files
const dbPromise = open({
  filename: "./sqlite.db",
  driver: sqlite3.Database,
});

// ✅ Health check route for Render
router.get("/test", (req, res) => {
  res.status(200).json({ works: true });
});

// ✅ Get all campaigns, ordered by most recent scheduled_time
router.get("/", async (req, res) => {
  try {
    const db = await dbPromise;
    const campaigns = await db.all(
      "SELECT * FROM campaigns ORDER BY scheduled_time DESC"
    );
    res.status(200).json(campaigns);
  } catch (error) {
    console.error("❌ Failed to fetch campaigns:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
