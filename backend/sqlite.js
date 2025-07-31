import sqlite3 from "sqlite3";
import { promisify } from "util";

const db = new sqlite3.Database("sqlite.db", (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    return;
  }
  console.log("✅ Connected to SQLite database (sqlite.db)");

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON");

  // knowledge_bases
  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source_type TEXT DEFAULT 'manual',
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error("❌ Error creating knowledge_bases table:", err.message);
    else console.log("✅ knowledge_bases table ready.");
  });

  // agents
  db.run(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      knowledge_base_id INTEGER NOT NULL,
      name TEXT,
      company_name TEXT,
      purpose TEXT,
      script TEXT NOT NULL,
      type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id)
    )
  `, (err) => {
    if (err) console.error("❌ Error creating agents table:", err.message);
    else console.log("✅ agents table ready.");
  });

  // campaigns
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      agent_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      scheduled_time TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `, (err) => {
    if (err) console.error("❌ Error creating campaigns table:", err.message);
    else console.log("✅ campaigns table ready.");
  });

  // scheduled_calls
  db.run(`
    CREATE TABLE IF NOT EXISTS scheduled_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      phone_number TEXT,
      scheduled_time TEXT,
      script TEXT,
      status TEXT DEFAULT 'pending',
      agent_id INTEGER,
      campaign_id INTEGER,
      called_at TEXT,
      duration INTEGER,
      outcome TEXT,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `, (err) => {
    if (err) console.error("❌ Error creating scheduled_calls table:", err.message);
    else console.log("✅ scheduled_calls table ready.");
  });

  // email_leads
  db.run(`
    CREATE TABLE IF NOT EXISTS email_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      subject TEXT,
      preview TEXT,
      content TEXT,
      category TEXT,
      follow_up_status TEXT,
      time TEXT
    )
  `, (err) => {
    if (err) console.error("❌ Error creating email_leads table:", err.message);
    else console.log("✅ email_leads table ready.");
  });
});

// Promisify `db.all`, `db.get`, and `db.run` for async/await usage
db.allAsync = promisify(db.all).bind(db);
db.getAsync = promisify(db.get).bind(db);
db.runAsync = promisify(db.run).bind(db);

export default db;
