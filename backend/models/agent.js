// backend/models/agent.js

import db from "../sqlite.js";

// ❗ NO need to create table here; handled globally in sqlite.js

// Save a new agent
export function saveAgent({ knowledge_base_id, name, company_name, purpose, script, type }) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO agents (knowledge_base_id, name, company_name, purpose, script, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([knowledge_base_id, name, company_name, purpose, script, type], function (err) {
      if (err) {
        console.error("❌ Error saving agent:", err.message);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

// Get all agents with knowledge base/company name
export function getAllAgents() {
  const query = `
    SELECT 
      agents.id,
      agents.knowledge_base_id,
      agents.name,
      agents.company_name,
      agents.purpose,
      agents.script,
      agents.type,
      agents.created_at,
      knowledge_bases.name AS knowledgeBaseName
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

// Get single agent by ID
export function getAgentById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM agents WHERE id = ?", [id], (err, row) => {
      if (err) {
        console.error("❌ Error in getAgentById:", err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Delete agent by ID
export function deleteAgentById(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM agents WHERE id = ?", [id], function (err) {
      if (err) {
        console.error("❌ Error in deleteAgentById:", err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
