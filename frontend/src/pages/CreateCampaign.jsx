import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

// 💡 Helper: Always create an ISO string for IST, regardless of user timezone
function toISTISOString(dateStr, timeStr) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
  const local = new Date(`${dateStr}T${timeStr}:00`);
  const IST_OFFSET = 5.5 * 60; // in minutes
  // IST = UTC+5:30, so adjust by IST minus system offset
  const istTime = new Date(local.getTime() - (local.getTimezoneOffset() - IST_OFFSET) * 60000);
  istTime.setSeconds(0,0);
  return istTime.toISOString();
}

const CreateCampaign = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [leads, setLeads] = useState([]);
  const [preview, setPreview] = useState([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("http://localhost:3010/api/agent/agents");
        const data = await res.json();
        setAgents(data);
      } catch (err) {
        console.error("Error fetching agents:", err);
      }
    };
    fetchAgents();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setLeads(data);
      setPreview(data.slice(0, 5));
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!selectedAgentId || leads.length === 0 || !scheduleDate || !scheduleTime) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    // ⭐️ Always send IST time, not local/UTC time!
    const scheduledAt = toISTISOString(scheduleDate, scheduleTime);

    const payload = {
      agentId: selectedAgentId,
      leads,
      scheduledAt,
    };

    try {
      const res = await fetch("http://localhost:3010/api/start-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Campaign scheduled successfully!");
        // Optionally reset form here
      } else {
        alert("Failed to schedule campaign.");
      }
    } catch (err) {
      console.error("Error scheduling campaign:", err);
    }
  };

  return (
    <div style={{ maxWidth: "800px", padding: "20px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "24px" }}>
        📞 Create AI Calling Campaign
      </h2>

      {/* Step 1: Select Agent */}
      <div style={{ marginBottom: "24px" }}>
        <label htmlFor="agentSelect" style={{ fontWeight: "500", display: "block", marginBottom: "8px" }}>
          Select AI Agent:
        </label>
        <select
          id="agentSelect"
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          style={{
            padding: "10px",
            width: "100%",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
        >
          <option value="">-- Select Agent --</option>
          {Array.isArray(agents) &&
            agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.companyName || agent.name}
              </option>
            ))}
        </select>
      </div>

      {/* Step 2: Upload CSV/XLSX */}
      <div style={{ marginBottom: "24px" }}>
        <label htmlFor="fileInput" style={{ fontWeight: "500", display: "block", marginBottom: "8px" }}>
          Upload Lead List (.csv or .xlsx):
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileUpload}
          style={{
            fontSize: "16px",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            width: "100%",
          }}
        />
      </div>

      {/* Step 3: Schedule */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ fontWeight: "500", display: "block", marginBottom: "8px" }}>Select Schedule:</label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            style={{
              flex: 1,
              fontSize: "16px",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            style={{
              flex: 1,
              fontSize: "16px",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
            }}
          />
        </div>
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>👀 Preview (First 5 Leads)</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  {Object.keys(preview[0]).map((key) => (
                    <th
                      key={key}
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "10px",
                        textAlign: "left",
                        fontWeight: "600",
                      }}
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((lead, index) => (
                  <tr key={index}>
                    {Object.values(lead).map((val, i) => (
                      <td
                        key={i}
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "10px",
                        }}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{
          padding: "12px 24px",
          backgroundColor: "#061debff",
          color: "#fff",
          fontSize: "16px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🚀 Start Campaign
      </button>
    </div>
  );
};

export default CreateCampaign;
