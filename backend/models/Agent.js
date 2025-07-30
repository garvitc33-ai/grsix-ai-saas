import db from "../sqlite.js";

// Create agents table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    knowledge_base_id INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    script TEXT NOT NULL,
    type TEXT NOT NULL,  -- real-time or scheduled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Save a new agent (Promise Style)
export function saveAgent({ knowledge_base_id, purpose, script, type }) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO agents (knowledge_base_id, purpose, script, type)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(knowledge_base_id, purpose, script, type, function (err) {
      if (err) reject(err);
      else resolve(this?.lastID);
    });
    stmt.finalize();
  });
}

// Get all agents with optional companyName from knowledge_bases (Promise style)
export function getAllAgents() {
  const query = `
    SELECT 
      agents.id,
      agents.knowledge_base_id,
      agents.purpose,
      agents.script,
      agents.type,
      agents.created_at,
      knowledge_bases.name AS companyName
    FROM agents
    LEFT JOIN knowledge_bases 
      ON agents.knowledge_base_id = knowledge_bases.id
    ORDER BY agents.created_at DESC
  `;
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) {
        console.error("❌ Error in getAllAgents:", err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Get agent by ID (Promise version)
export function getAgentById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM agents WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Delete agent by ID (Promise version)
export function deleteAgentById(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM agents WHERE id = ?", [id], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}
