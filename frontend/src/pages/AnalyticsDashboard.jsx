import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

const socket = io("http://localhost:3010", { transports: ["websocket"] });

const defaultStats = {
  pending: 0,
  waiting: 0,
  completed: 0,
  failed: 0,
  total: 0,
};

function AnalyticsDashboard({ onBack }) {
  const [stats, setStats] = useState(defaultStats);
  const [campaigns, setCampaigns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [recentCalls, setRecentCalls] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Defensive fetch utility
  function fetchJson(url, fallback) {
    return fetch(url)
      .then(res => res.ok ? res.json() : fallback)
      .catch(() => fallback);
  }

  useEffect(() => {
    fetchJson("http://localhost:3010/api/agent/agents", []).then(data =>
      setAgents(Array.isArray(data) ? data : []));
    fetchJson("http://localhost:3010/api", []).then(data =>
      setCampaigns(Array.isArray(data) ? data : []));
  }, []);

  function buildQs() {
    let params = [];
    if (selectedCampaign) params.push(`campaignId=${selectedCampaign}`);
    if (selectedAgent) params.push(`agentId=${selectedAgent}`);
    return params.length ? "?" + params.join("&") : "";
  }

  useEffect(() => {
    const qs = buildQs();

    fetchJson(`http://localhost:3010/api/stats${qs}`, defaultStats).then(setStats);
    fetchJson(`http://localhost:3010/api/calls/recent?limit=20${qs && qs !== "?" ? "&" + qs.slice(1) : ""}`, []).then(data =>
      setRecentCalls(Array.isArray(data) ? data : []));
    fetchJson(`http://localhost:3010/api/stats/trend?interval=daily${qs && qs !== "?" ? "&" + qs.slice(1) : ""}`, []).then(data =>
      setTrendData(Array.isArray(data) ? data : []));
    fetchJson(`http://localhost:3010/api/leaderboard${qs && qs !== "?" ? "&" + qs.slice(1) : ""}`, []).then(data =>
      setLeaderboard(Array.isArray(data) ? data : []));
  }, [selectedCampaign, selectedAgent]);

  useEffect(() => {
    const handler = data => setStats((s) => ({ ...s, ...data }));
    socket.on("campaign-stats", handler);
    return () => { socket.off("campaign-stats", handler); };
  }, []);

  const pieData = {
    labels: ["Completed", "Failed", "Pending", "Waiting"],
    datasets: [
      {
        data: [
          stats.completed || 0,
          stats.failed || 0,
          stats.pending || 0,
          stats.waiting || 0,
        ],
        backgroundColor: ["#34d399", "#f87171", "#a5b4fc", "#fbbf24"],
      },
    ],
  };
  const barData = {
    labels: ["Completed", "Failed", "Pending", "Waiting"],
    datasets: [
      {
        label: "Calls",
        data: [
          stats.completed || 0,
          stats.failed || 0,
          stats.pending || 0,
          stats.waiting || 0,
        ],
        backgroundColor: ["#34d399", "#f87171", "#a5b4fc", "#fbbf24"],
      },
    ],
  };
  const lineData = {
    labels: Array.isArray(trendData) ? trendData.map((d) => d.bucket) : [],
    datasets: [
      {
        label: "Calls (Daily)",
        data: Array.isArray(trendData) ? trendData.map((d) => d.count) : [],
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
      },
    ],
  };

  return (
    <div style={{
      padding: 40, maxWidth: 1100, margin: "0 auto",
      background: "#f8fafc", borderRadius: 16, minHeight: "95vh"
    }}>
      {/* Go Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginBottom: 30,
            background: "#f3f4f6",
            color: "#6366f1",
            border: "none",
            borderRadius: "7px",
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: 15.5,
            cursor: "pointer",
            boxShadow: "0 1px 4px #0002",
          }}
        >
          ← Back to Dashboard
        </button>
      )}

      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 25, letterSpacing: -1, color: "#26245c" }}>
        📊 Analytics Dashboard
      </h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 30, alignItems: "center", marginBottom: 20 }}>
        <label>
          <span style={{ fontWeight: 500 }}>Campaign: </span>
          <select
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 16,
              marginLeft: 6
            }}
          >
            <option value="">All</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span style={{ fontWeight: 500 }}>Agent: </span>
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 16,
              marginLeft: 6
            }}
          >
            <option value="">All</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.companyName || a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: 44, margin: "32px 0" }}>
        <div style={{ width: 260, height: 260, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #f2f2f5", padding: 16 }}>
          <Pie data={pieData} />
        </div>
        <div style={{ width: 260, height: 260, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #f2f2f5", padding: 16 }}>
          <Bar data={barData} />
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #f2f2f5", padding: 16 }}>
          <Line data={lineData} />
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{
        background: "#fff", padding: 20, borderRadius: 12, marginTop: 24, boxShadow: "0 1px 8px #ebeef7"
      }}>
        <h3 style={{ fontSize: 19, marginBottom: 10, color: "#111827" }}>🏆 Leaderboard (Top Agents/Campaigns)</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={{ padding: 10 }}>Agent ID</th>
              <th>Total Calls</th>
              <th>Calls Completed</th>
              <th>Total Duration (s)</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(leaderboard) || leaderboard.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "#888" }}>No data</td></tr>
            ) : leaderboard.map((row, i) => (
              <tr key={row.agent_id || i}>
                <td>{row.agent_id}</td>
                <td>{row.total_calls}</td>
                <td>{row.completed_calls}</td>
                <td>{row.total_duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Calls Table */}
      <div style={{
        background: "#fff", padding: 20, borderRadius: 12, marginTop: 32, boxShadow: "0 1px 8px #ebeef7"
      }}>
        <h3 style={{ fontSize: 19, marginBottom: 10, color: "#111827" }}>📝 Recent Calls</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th>ID</th>
              <th>Lead</th>
              <th>Number</th>
              <th>Status</th>
              <th>Time</th>
              <th>Duration (s)</th>
              <th>Outcome</th>
              <th>Agent</th>
              <th>Campaign</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(recentCalls) || recentCalls.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "#888" }}>No recent calls found.</td>
              </tr>
            ) : recentCalls.map((call) => (
              <tr key={call.id}>
                <td>{call.id}</td>
                <td>{call.customer_name}</td>
                <td>{call.phone_number}</td>
                <td>{call.status}</td>
                <td>{call.called_at ? new Date(call.called_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}</td>
                <td>{call.duration}</td>
                <td>{call.outcome}</td>
                <td>{call.agent_id}</td>
                <td>{call.campaign_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 17.5, marginTop: 30, fontWeight: 700 }}>
        Total: {stats.total} | Completed: {stats.completed} | Pending: {stats.pending} | Waiting: {stats.waiting} | Failed: {stats.failed}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
