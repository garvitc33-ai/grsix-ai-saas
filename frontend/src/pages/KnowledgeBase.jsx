// src/pages/KnowledgeBase.jsx
import React, { useState } from "react";
import ManualUploadForm from "../components/ManualUploadForm";
import GenerateAIForm from "../components/GenerateAIForm";

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState("manual");

  return (
    <div className="card" style={{ maxWidth: "600px", margin: "40px auto" }}>
      {/* Heading */}
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>
        📘 Knowledge Base
      </h2>
      <p style={{ marginBottom: "24px", color: "#4B5563" }}>
        Manage company data for your AI agents.
      </p>

      {/* Tab Switch */}
      <div style={{ display: "flex", marginBottom: "20px", gap: "12px" }}>
        <button
          onClick={() => setActiveTab("manual")}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            fontWeight: 500,
            fontSize: "14px",
            backgroundColor: activeTab === "manual" ? "#061debff" : "#e5e7eb",
            color: activeTab === "manual" ? "#ffffff" : "#1f2937",
            cursor: "pointer",
          }}
        >
          Manual Upload
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            fontWeight: 500,
            fontSize: "14px",
            backgroundColor: activeTab === "ai" ? "#061debff" : "#e5e7eb",
            color: activeTab === "ai" ? "#ffffff" : "#1f2937",
            cursor: "pointer",
          }}
        >
          Generate via AI
        </button>
      </div>

      {/* Render Form */}
      {activeTab === "manual" ? <ManualUploadForm /> : <GenerateAIForm />}
    </div>
  );
};

export default KnowledgeBase;
