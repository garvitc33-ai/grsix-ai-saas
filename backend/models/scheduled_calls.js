// backend/models/scheduled_calls.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

// Ensure __dirname is defined in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to avoid Render-related issues
const dbPath = path.join(__dirname, "../../sqlite.db");

const dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database,
});

// Helper for scheduled time: always use minute-rounded ISO/IST everywhere
function roundToMinuteISO(dtString) {
  const dt = new Date(dtString);
  dt.setSeconds(0, 0);
  return dt.toISOString();
}

// Save a new scheduled call (scheduledTime should be "YYYY-MM-DDTHH:mm" in IST)
export async function addScheduledCall({ customerName, phoneNumber, scheduledTime, script }) {
  try {
    const db = await dbPromise;
    const safeTime = roundToMinuteISO(scheduledTime);
    const res = await db.run(
      "INSERT INTO scheduled_calls (customer_name, phone_number, scheduled_time, script, status) VALUES (?, ?, ?, ?, ?)",
      [customerName, phoneNumber, safeTime, script, "pending"]
    );
    return res.lastID;
  } catch (err) {
    console.error("❌ Error in addScheduledCall:", err.message);
    throw err;
  }
}

// Get all due scheduled calls as of now IST, up to minute-precision
export async function getDueCalls(nowIST_ISO) {
  try {
    const db = await dbPromise;
    return db.all(
      'SELECT * FROM scheduled_calls WHERE status = "pending" AND scheduled_time <= ?',
      [nowIST_ISO]
    );
  } catch (err) {
    console.error("❌ Error in getDueCalls:", err.message);
    throw err;
  }
}

export async function markCallCompleted(id) {
  try {
    const db = await dbPromise;
    const result = await db.run(
      'UPDATE scheduled_calls SET status = "completed" WHERE id = ?',
      [id]
    );
    return result.changes;
  } catch (err) {
    console.error("❌ Error in markCallCompleted:", err.message);
    throw err;
  }
}

// Get all scheduled calls (for admin or dashboard)
export async function getAllScheduledCalls() {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM scheduled_calls ORDER BY scheduled_time DESC');
    return rows;
  } catch (err) {
    console.error("❌ Error in getAllScheduledCalls:", err.message);
    throw err;
  }
}
