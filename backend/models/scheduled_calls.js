// backend/models/scheduled_calls.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const dbPromise = open({
  filename: "./sqlite.db",
  driver: sqlite3.Database
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
  const db = await dbPromise;
  // Only calls scheduled up to now, and still pending
  return db.all(
    'SELECT * FROM scheduled_calls WHERE status = "pending" AND scheduled_time <= ?',
    [nowIST_ISO]
  );
}

export async function markCallCompleted(id) {
  try {
    const db = await dbPromise;
    const result = await db.run('UPDATE scheduled_calls SET status = "completed" WHERE id = ?', [id]);
    return result.changes;
  } catch (err) {
    console.error("❌ Error in markCallCompleted:", err.message);
    throw err;
  }
}

// Optionally: get all scheduled calls for admin view
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
