// src/pages/AgentDashboard.jsx
import React, { useEffect, useState } from "react";

const AgentDashboard = ({ onBack }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // 🔥 FIX: Correct endpoint path
      const res = await fetch("/api/agent/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setMessage("❌ Failed to fetch agents.");
      setAgents([]);
      setLoading(false);
      console.error("Failed to fetch agents:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this agent?");
    if (!confirmDelete) return;
    try {
      await fetch(`/api/agent/${id}`, { method: "DELETE" });
      setMessage("✅ Agent deleted successfully.");
      fetchAgents();
    } catch (err) {
      console.error("Delete failed:", err);
      setMessage("❌ Failed to delete agent.");
    }
  };

  const handleTriggerCall = async (agentId) => {
    try {
      const response = await fetch(`http://localhost:3010/api/agent/${agentId}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "+919509917357" // Your Twilio verified test number
        }),
      });
      const data = await response.json();
      alert(data.message || "Call failed");
    } catch (err) {
      alert("Failed to trigger call.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* ← Back to Dashboard button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginBottom: 28,
            background: "#f3f4f6",
            color: "#6366f1",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 1px 4px #0001"
          }}
        >
          ← Back to Dashboard
        </button>
      )}

      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        🧑‍💻 AI Agent Management
      </h1>

      {message && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "12px 16px",
            borderRadius: "8px",
            color: "#15803d",
            marginBottom: "20px",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : agents.length === 0 ? (
        <p>No AI agents found.</p>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {agents.map((agent) => (
            <div key={agent.id} className="card">
              <div style={{ marginBottom: "8px", fontSize: "16px" }}>
                <strong>Company:</strong> {agent.companyName || "N/A"}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Purpose:</strong> {agent.purpose || "N/A"}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Type:</strong>{" "}
                {agent.type === "real-time" ? "📞 Real-Time Call" : "📅 Scheduled Call"}
              </div>
              <div style={{ marginBottom: "12px" }}>
                <strong>Script Preview:</strong>
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    marginTop: "6px",
                    maxHeight: "160px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {(agent.script || "").slice(0, 500)}
                  {(agent.script && agent.script.length > 500) && "..."}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  className="button"
                  style={{ backgroundColor: "#061debff", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}
                  onClick={() => handleTriggerCall(agent.id)}
                >
                  📞 Trigger Call
                </button>
                <button
                  className="button"
                  style={{ backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}
                  onClick={() => handleDelete(agent.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
