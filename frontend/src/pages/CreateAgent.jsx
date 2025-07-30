import React, { useState, useEffect } from "react";
import { fetchAllKnowledgeBases } from "../services/knowledgeBaseService";

const CreateAgent = () => {
  const [step, setStep] = useState(1);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [selectedKB, setSelectedKB] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [script, setScript] = useState("");
  const [agentType, setAgentType] = useState("");

  useEffect(() => {
    const loadKBs = async () => {
      try {
        const data = await fetchAllKnowledgeBases();
        setKnowledgeBases(data);
      } catch (err) {
        console.error("Failed to fetch KBs:", err);
      }
    };
    loadKBs();
  }, []);

  const handleNext = () => {
    if (step === 1 && !selectedKB) return alert("Please select a company");
    if (step === 2 && !purpose) return alert("Please enter agent purpose");
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleGenerateScript = async () => {
    try {
      const res = await fetch("http://localhost:3010/api/agent/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledgeBaseId: selectedKB.id, purpose }),
      });
      const data = await res.json();
      setScript(data.script || "");
    } catch (err) {
      console.error("Script generation failed:", err);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const res = await fetch("http://localhost:3010/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledgeBaseId: selectedKB.id,
          purpose,
          script,
          type: agentType,
        }),
      });
      await res.json();
      alert("✅ Agent created successfully!");
    } catch (err) {
      console.error("Failed to create agent:", err);
    }
  };

  return (
    <div className="card" style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "24px" }}>
        Create AI Agent
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
        <span style={{ fontWeight: 600, color: step === 1 ? "#061debff" : "#6b7280" }}>
          1. Select Knowledge Base
        </span>
        <span style={{ fontWeight: 600, color: step === 2 ? "#061debff" : "#6b7280" }}>
          2. Define Purpose
        </span>
        <span style={{ fontWeight: 600, color: step === 3 ? "#061debff" : "#6b7280" }}>
          3. Agent Type
        </span>
      </div>

      {step === 1 && (
        <div className="form-group">
          <label className="form-label">Company Knowledge Base</label>
          <select
            value={selectedKB?.id || ""}
            onChange={(e) =>
              setSelectedKB(knowledgeBases.find((kb) => kb.id == e.target.value))
            }
            className="form-input"
          >
            <option value="">-- Select a Company --</option>
            {knowledgeBases.map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {step === 2 && (
        <div className="form-group">
          <label className="form-label">Agent Purpose</label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Sales agent for XYZ"
            className="form-input"
          />

          <button
            onClick={handleGenerateScript}
            className="button"
            style={{ marginTop: "16px", backgroundColor: "#059669" }}
          >
            Generate Script
          </button>

          {script && (
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={10}
              className="form-input"
              style={{ marginTop: "16px" }}
            />
          )}
        </div>
      )}

      {step === 3 && (
        <div className="form-group">
          <label className="form-label">Agent Call Behavior</label>
          <select
            value={agentType}
            onChange={(e) => setAgentType(e.target.value)}
            className="form-input"
          >
            <option value="">-- Choose --</option>
            <option value="real-time">📞 Real-Time Call</option>
            <option value="scheduled">📅 Scheduled Call</option>
          </select>

          <button
            onClick={handleFinalSubmit}
            className="button"
            style={{ marginTop: "16px", backgroundColor: "#061debff" }}
          >
            Create Agent
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
        {step > 1 && (
          <button
            onClick={handleBack}
            className="button"
            style={{ backgroundColor: "#e5e7eb", color: "#111827" }}
          >
            ⬅ Back
          </button>
        )}
        {step < 3 && (
          <button onClick={handleNext} className="button" style={{backgroundColor:"#061debff", color:"#e5e7eb"}}>
            Next ➡
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateAgent;
