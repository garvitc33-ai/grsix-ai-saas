import db from "../sqlite.js";

// ✅ Create the email_leads table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS email_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    time TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview TEXT,
    content TEXT,
    follow_up_status TEXT,
    category TEXT
  )
`);

// ✅ Save a new email lead
export function saveEmailLead(lead) {
  const { email, time, subject, preview, content, follow_up_status, category } = lead;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO email_leads (email, time, subject, preview, content, follow_up_status, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, time, subject, preview, content, follow_up_status, category],
      function (err) {
        if (err) {
          console.error("❌ Error in saveEmailLead:", err.message);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// ✅ Get all email leads
export function getAllEmailLeads() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM email_leads`, (err, rows) => {
      if (err) {
        console.error("❌ Error in getAllEmailLeads:", err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
