import React, { useEffect, useState } from "react";
import {
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  UserCog,
  BarChart2,
  Book,
} from "lucide-react";

const StatusBadge = ({ status }) => {
  const map = {
    pending: { label: "Pending", bg: "#fef9c3", fg: "#b45309" },
    "in-progress": { label: "Ongoing", bg: "#dbeafe", fg: "#1e40af" },
    completed: { label: "Completed", bg: "#dcfce7", fg: "#166534" }
  };
  const s = map[status] || { label: status, bg: "#f1f5f9", fg: "#888" };
  return (
    <span style={{
      background: s.bg,
      color: s.fg,
      fontWeight: 600,
      fontSize: 13,
      padding: "3.5px 13px",
      borderRadius: 15,
      marginLeft: 4,
      display: "inline-block"
    }}>
      {s.label}
    </span>
  );
};

const Widget = ({ title, value, icon }) => (
  <div style={{
    flex: 1,
    minWidth: 140,
    background: "#fff",
    borderRadius: 13,
    boxShadow: "0 2px 12px #e7eaf8",
    padding: "17px 15px 14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "0 0 22px 0"
  }}>
    <span style={{ display: "inline-flex", alignItems: "center", marginRight: 9 }}>
      <span style={{ display: "inline-block", verticalAlign: "middle" }}>
        {React.createElement(icon, { size: 28, strokeWidth: 2 })}
      </span>
    </span>
    <div style={{ lineHeight: 1.12 }}>
      <div style={{ fontSize: 23, fontWeight: 550, letterSpacing: -1, marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#4b5563", textTransform: "uppercase", fontWeight: 560, letterSpacing: 0.35 }}>
        {title}
      </div>
    </div>
  </div>
);

const Dashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, waiting: 0, failed: 0 });
  const [campaigns, setCampaigns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3010/api/stats").then(res => res.json()).then(setStats);
    fetch("http://localhost:3010/api/campaigns").then(res => res.json()).then(data => setCampaigns(Array.isArray(data) ? data.slice(0, 3) : []));
    fetch("http://localhost:3010/api/agent/agents").then(res => res.json()).then(setAgents);
    fetch("http://localhost:3010/api/calls/recent?limit=5").then(res => res.json()).then(setRecentCalls);
  }, []);

  function goTo(page) { if (onNavigate) onNavigate(page); }

  function renderAnalyticsCard() {
    const total = Number(stats.total) || 0;
    const completed = Number(stats.completed) || 0;
    const failed = Number(stats.failed) || 0;
    const rate = total ? Math.round(100 * completed / total) : 0;
    return (
      <div style={{
        background: "#fff",
        borderRadius: 13,
        boxShadow: "0 2px 12px #e8eafd",
        flex: 1,
        minWidth: 240,
        maxWidth: 370,
        marginBottom: 26,
        padding: "20px 20px 16px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}>
        <div style={{
          display: "flex", alignItems: "center", fontWeight: 600, fontSize: 16, marginBottom: 10, color: "#061debff"
        }}>
          <BarChart2 size={26} style={{ marginRight: 8 }} />
          Analytics
          <button
            onClick={() => goTo("Analytics Dashboard")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6366f1",
              fontWeight: 520,
              fontSize: 14,
              padding: "2px 7px",
              borderRadius: 7
            }}
          >View all</button>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 19, color: "#6366f1", marginBottom: 6 }}>
            {rate}% <span style={{ color: "#222", fontWeight: 500, fontSize: 15 }}>Completed</span>
          </div>
          <div style={{ fontSize: 13.5, color: "#64748b" }}>
            <span style={{ color: "#00a83eff", fontWeight: 600 }}>{completed}</span> done &nbsp; | &nbsp; <span style={{ color: "#ef4444", fontWeight: 600 }}>{failed}</span> failed &nbsp; | &nbsp; <span style={{ color: "#6366f1", fontWeight: 600 }}>{total}</span> total
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingTop: 32 }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 22px" }}>
        <h1 style={{
          fontSize: 30,
          fontWeight: 550,
          color: "#061debff",
          marginBottom: 22,
          letterSpacing: -1,
          textShadow: "0 1px 4px #f6f6f8"
        }}>
          General Dashboard
        </h1>

        {/* Widget row */}
        <div style={{
          display: "flex",
          gap: 21,
          flexWrap: "wrap",
          marginBottom: 34,
          justifyContent: "space-between"
        }}>
          <Widget title="Total Calls" value={stats.total} icon={Phone} />
          <Widget title="Completed" value={stats.completed} icon={CheckCircle} />
          <Widget title="Pending" value={stats.pending} icon={Clock} />
          <Widget title="Failed" value={stats.failed} icon={XCircle} />
          <Widget title="Campaigns" value={campaigns.length} icon={Book} />
          <Widget title="Agents" value={agents.length} icon={UserCog} />
        </div>

        {/* Main card row */}
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Campaigns */}
          <div style={{
            background: "#fff",
            borderRadius: 13,
            boxShadow: "0 2px 12px #e8e8f6",
            flex: 2,
            minWidth: 340,
            padding: "22px 19px 16px 18px",
            marginBottom: 26
          }}>
            <div style={{
              display: "flex", alignItems: "center", fontWeight: 680, color: "#061debff",
              fontSize: 16, marginBottom: 12, letterSpacing: -.13
            }}>
              <Book size={25} style={{ marginRight: 9 }} />
              Campaigns
              <button
                onClick={() => goTo("Campaign Board")}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6366f1",
                  fontWeight: 510,
                  fontSize: 14,
                  padding: "2px 7px",
                  borderRadius: 7
                }}
              >View all</button>
            </div>
            <table style={{ width: "100%", fontSize: 14, marginTop: 3, background: "#fff" }}>
              <thead>
                <tr style={{ color: "#64748b", fontWeight: 590 }}>
                  <td>Name</td>
                  <td>Status</td>
                  <td>Time</td>
                  <td>Progress</td>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0
                  ? <tr><td colSpan={4} style={{ color: "#aaa", textAlign: "center" }}>No campaigns yet.</td></tr>
                  : campaigns.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f7" }}>
                      <td style={{ fontWeight: 580 }}>{c.name}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.scheduled_time
                        ? new Date(c.scheduled_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                        : "-"}</td>
                      <td>
                        <div style={{
                          background: "#f1f5f9",
                          borderRadius: 6,
                          width: 68,
                          height: 7,
                          display: "inline-block",
                          marginRight: 7
                        }}>
                          <div style={{
                            background: "#6366f1",
                            width: `${c.progress ?? 0}%`,
                            height: "100%",
                            borderRadius: 6
                          }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.progress || 0}%</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Agents */}
          <div style={{
            background: "#fff",
            borderRadius: 13,
            boxShadow: "0 2px 12px #e5eaf7",
            flex: 1,
            minWidth: 220,
            padding: "22px 15px 17px 18px",
            marginBottom: 26,
            maxWidth: 290
          }}>
            <div style={{
              display: "flex", alignItems: "center", fontWeight: 600,
              color: "#061debff", fontSize: 16, marginBottom: 10
            }}>
              <UserCog size={24} style={{ marginRight: 7 }} />
              Top AI Agents
              <button
                onClick={() => goTo("Agent Dashboard")}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6366f1",
                  fontWeight: 510,
                  fontSize: 14,
                  padding: "1px 7px",
                  borderRadius: 7
                }}
              >View all</button>
            </div>
            <ul style={{ margin: 0, padding: "2px 0 0 0", listStyle: "none", fontSize: 15 }}>
              {agents.length === 0
                ? <li style={{ color: "#bbb" }}>No agents</li>
                : agents.slice(0, 4).map(a => <li key={a.id} style={{ fontWeight: 540, marginBottom: 3 }}>{a.companyName || a.name}</li>)
              }
            </ul>
          </div>
          {/* Analytics Dashboard Card */}
          {renderAnalyticsCard()}
        </div>

        {/* Recent Calls */}
        <div style={{
          background: "#fff",
          borderRadius: 13,
          boxShadow: "0 1.5px 9px #e8e9fd",
          padding: "22px 18px 12px",
          margin: "0 0 32px 0"
        }}>
          <div style={{ color: "#061debff", fontWeight: 650, fontSize: 17, marginBottom: 10 }}>
            Recent Calls
          </div>
          {recentCalls.length === 0
            ? <div style={{ color: "#888", padding: 12, textAlign: "center", fontSize: 15 }}>No recent calls.</div>
            : <table style={{ width: "100%", fontSize: 13.5 }}>
              <thead>
                <tr style={{ color: "#888" }}>
                  <td>ID</td>
                  <td>Lead</td>
                  <td>Phone</td>
                  <td>Status</td>
                  <td>Time</td>
                  <td>Agent</td>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map(call =>
                  <tr key={call.id} style={{ borderBottom: "1px solid #f3f4f7" }}>
                    <td>{call.id}</td>
                    <td>{call.customer_name}</td>
                    <td>{call.phone_number}</td>
                    <td><StatusBadge status={call.status} /></td>
                    <td>{call.called_at ? new Date(call.called_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}</td>
                    <td>{call.agent_id}</td>
                  </tr>
                )}
              </tbody>
            </table>} 
            <style>
{`
  body, .dashboard-root, .dashboard-widget, .dashboard-card, .dashboard-table, .dashboard-card-title, .dashboard-widgets-row,
  .dashboard-row, .dashboard h1, h1, h2, h3, button, input, select, textarea {
    font-family: 'Inter', Arial, Helvetica, sans-serif !important;
    letter-spacing: 0.01em;
  }
`}
</style>



        </div>
      </div>
    </div>
    
  );
};

export default Dashboard;
