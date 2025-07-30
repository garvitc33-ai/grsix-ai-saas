// models/KnowledgeBase.js

import db from "../sqlite.js";

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS knowledge_bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source_type TEXT DEFAULT 'manual',
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Save a new knowledge base (Promise style)
export function saveKnowledgeBase({ name, source_type = "manual", content }) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO knowledge_bases (name, source_type, content)
      VALUES (?, ?, ?)
    `);
    stmt.run(name, source_type, content, function (err) {
      if (err) {
        console.error("❌ Error in saveKnowledgeBase:", err.message);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

// Get all saved knowledge bases (Promise style)
export function getAllKnowledgeBases() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM knowledge_bases ORDER BY created_at DESC", (err, rows) => {
      if (err) {
        console.error("❌ Error in getAllKnowledgeBases:", err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Get a single KB by name (Promise style)
export function getKnowledgeBaseByName(name) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM knowledge_bases WHERE name = ?", [name], (err, row) => {
      if (err) {
        console.error("❌ Error in getKnowledgeBaseByName:", err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Get KB by ID (Promise style)
export function getKnowledgeBaseById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM knowledge_bases WHERE id = ?", [id], (err, row) => {
      if (err) {
        console.error("❌ Error in getKnowledgeBaseById:", err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Update a KB by name (Promise style)
export function updateKnowledgeBaseByName(name, content) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE knowledge_bases SET content = ? WHERE name = ?",
      [content, name],
      function (err) {
        if (err) {
          console.error("❌ Error in updateKnowledgeBaseByName:", err.message);
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}
