// models/knowledgeBase.js
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

// Save a new knowledge base
export function saveKnowledgeBase({ name, source_type = "manual", content }) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO knowledge_bases (name, source_type, content)
      VALUES (?, ?, ?)
    `);
    stmt.run(name, source_type, content, function (err) {
      if (err) {
        console.error("Error saving knowledge base:", err.message);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

// Get all knowledge bases
export function getAllKnowledgeBases() {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM knowledge_bases ORDER BY created_at DESC",
      (err, rows) => {
        if (err) {
          console.error("Error fetching knowledge bases:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Get a knowledge base by name
export function getKnowledgeBaseByName(name) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM knowledge_bases WHERE name = ?",
      [name],
      (err, row) => {
        if (err) {
          console.error("Error fetching knowledge base by name:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

// Get a knowledge base by ID
export function getKnowledgeBaseById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM knowledge_bases WHERE id = ?",
      [id],
      (err, row) => {
        if (err) {
          console.error("Error fetching knowledge base by ID:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

// Update knowledge base content by name
export function updateKnowledgeBaseByName(name, content) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE knowledge_bases SET content = ? WHERE name = ?",
      [content, name],
      function (err) {
        if (err) {
          console.error("Error updating knowledge base:", err.message);
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}
