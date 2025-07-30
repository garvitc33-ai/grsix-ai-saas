import React, { useEffect, useState } from "react";

// Colors for statuses
const statusColors = {
  pending: "#fbbf24",
  "in-progress": "#3b82f6",
  completed: "#22c55e",
};
const statusBg = {
  pending: "rgba(251,191,36,0.12)",
  "in-progress": "rgba(59,130,246,0.11)",
  completed: "rgba(34,197,94,0.12)"
};
const statusLabel = {
  pending: "Pending",
  "in-progress": "Ongoing",
  completed: "Completed"
};

// Helper: show "Today", "Tomorrow", "in X days" for scheduled time
function relativeTime(dt) {
  if (!dt) return "-";
  const date = new Date(dt);
  const now = new Date();
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const diff = Math.floor((istDate - istNow) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  if (diff === -1) return "Yesterday";
  if (diff < -1) return `${-diff} days ago`;
  return "";
}

function CampaignStatusBoard({ onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("http://localhost:3010/api/campaigns")
      .then(res => res.json())
      .then(data => setCampaigns(Array.isArray(data) ? data : []));
  }, []);

  const filteredCampaigns =
    filter === "all"
      ? campaigns
      : campaigns.filter(c => (c.status || "").toLowerCase() === filter);

  return (
    <div style={{
      maxWidth: "1020px",
      margin: "36px auto 0 auto",
      padding: "0 12px",
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        background: "#f5f7fa",
        borderRadius: 18,
        boxShadow: "0 4px 24px #0002",
        padding: 32
      }}>
        {/* ← Back to Dashboard button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginBottom: 24,
              background: "#f3f4f6",
              color: "#6366f1",
              border: "none",
              borderRadius: "7px",
              padding: "8px 16px",
              fontWeight: 600,
              fontSize: 15.5,
              cursor: "pointer",
              boxShadow: "0 1px 4px #0002",
              marginRight: 8,
            }}
          >
            ← Back to Dashboard
          </button>
        )}

        <h2 style={{
          fontSize: 32,
          letterSpacing: -1,
          fontWeight: 700,
          marginBottom: 24,
          color: "#1e293b"
        }}>
          📋 Campaign Status Board
        </h2>
        <div style={{
          marginBottom: 32,
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}>
          <span style={{
            fontWeight: 500, color: "#4b5563", marginRight: 10
          }}>
            Filter by status:
          </span>
          {["all", "pending", "in-progress", "completed"].map(stat => (
            <button
              key={stat}
              onClick={() => setFilter(stat)}
              style={{
                padding: "6px 18px",
                fontWeight: filter === stat ? 700 : 500,
                background: filter === stat ? (statusBg[stat] || "#e0e7ef") : "#f3f4f6",
                color: filter === stat ? "#111" : "#444",
                border: filter === stat ? `1.5px solid ${statusColors[stat] || "#d1d5db"}` : "1px solid #f3f4f6",
                borderRadius: 16,
                transition: "all 0.16s",
                boxShadow: filter === stat ? "0 1px 4px #0001" : "none",
                letterSpacing: 0.7,
                fontSize: 15,
                cursor: "pointer"
              }}
            >
              {/* Use human label */}
              {stat === "all" ? "All" : statusLabel[stat]}
            </button>
          ))}
        </div>
        <div style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 1px 8px #ececec",
          overflow: "hidden"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 15
          }}>
            <thead>
              <tr style={{
                background: "#f1f5f9",
                fontWeight: 700,
                color: "#334155"
              }}>
                <th style={{ padding: "14px 8px" }}>#</th>
                <th style={{ padding: "12px 8px" }}>Name</th>
                <th style={{ padding: "12px 8px" }}>Scheduled Time</th>
                <th style={{ padding: "12px 8px" }}>IST (relative)</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px" }}>Calls Done</th>
                <th style={{ padding: "12px 8px" }}>Total Leads</th>
                <th style={{ padding: "12px 8px" }}>Progress</th>
                {/* Future: <th>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8}
                    style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 17 }}>
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c, idx) => (
                  <tr key={c.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      background: idx % 2 ? "#fcfcfd" : "#fff"
                    }}>
                    <td style={{ textAlign: "center", padding: "12px 6px", fontWeight: 600, color: "#666" }}>{idx + 1}</td>
                    <td style={{
                      fontWeight: 550, padding: "10px 8px",
                      color: "#17181c",
                      maxWidth: 160, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"
                    }}>{c.name}</td>
                    <td style={{ padding: "10px 8px", fontFamily: "monospace", color: "#374151" }}>
                      {c.scheduled_time
                        ? new Date(c.scheduled_time).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata"
                          })
                        : "-"}
                    </td>
                    <td style={{ padding: "10px 8px", color: "#6366f1", fontWeight: 600 }}>
                        {relativeTime(c.scheduled_time)}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{
                        background: statusBg[(c.status || "").toLowerCase()] || "#f3f4f6",
                        color: statusColors[(c.status || "").toLowerCase()] || "#555",
                        padding: "3px 15px",
                        fontWeight: 700,
                        borderRadius: 16,
                        fontSize: 14,
                        boxShadow: "0 1px 4px #0001"
                      }}>
                        {statusLabel[(c.status || "").toLowerCase()] || c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 8px", fontWeight: 600, color: "#334155" }}>{c.calls_done ?? 0}</td>
                    <td style={{ textAlign: "center", padding: "10px 8px", fontWeight: 600, color: "#334155" }}>{c.total_leads ?? 0}</td>
                    <td style={{ padding: "10px 8px", minWidth: 130 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          background: "#e5e7eb",
                          borderRadius: 7,
                          width: 80,
                          height: 8,
                          position: "relative",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            background: statusColors[(c.status || "").toLowerCase()] || "#bbb",
                            width: `${c.progress ?? 0}%`,
                            height: "100%",
                            transition: "width 0.34s cubic-bezier(0.65,0,0.35,1)"
                          }} />
                        </div>
                        <span style={{
                          fontWeight: 700, fontFamily: "monospace",
                          color: "#3b82f6"
                        }}>
                          {c.progress || 0}%
                        </span>
                      </div>
                    </td>
                    {/* <td> <button style={{...}}> View </button> </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CampaignStatusBoard;
