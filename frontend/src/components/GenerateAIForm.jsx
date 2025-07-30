import React, { useState } from "react";
import { createKnowledgeBase } from "../services/knowledgeBaseService";
import axios from "axios";

const GenerateAIForm = () => {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerate = async () => {
    if (!companyName || !website) {
      setMessage("⚠️ Please enter both company name and website.");
      return;
    }

    setLoading(true);
    setMessage("⏳ Generating knowledge base from website...");

    try {
      const res = await axios.post("http://localhost:3010/api/knowledgebase/generate", {
        companyName,
        website,
      });
      setContent(res.data.content);
      setMessage("✅ Content generated! You can now review and save it.");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content || !companyName) {
      setMessage("⚠️ Content and company name are required.");
      return;
    }

    try {
      await createKnowledgeBase({ companyName, content });
      setMessage("✅ Knowledge base saved successfully!");
      setCompanyName("");
      setWebsite("");
      setContent("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save knowledge base.");
    }
  };

  return (
  <div className="card" style={{ maxWidth: "720px", margin: "0 auto" }}>
    <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "20px" }}>
      🧠 Generate Knowledge Base via Website
    </h2>

    <div style={{ marginBottom: "16px" }}>
      <label>Company Name</label>
      <input
        type="text"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Enter company name"
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "6px",
        }}
      />
    </div>

    <div style={{ marginBottom: "16px" }}>
      <label>Company Website</label>
      <input
        type="url"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://example.com"
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginTop: "6px",
        }}
      />
    </div>

    <button
      onClick={handleGenerate}
      className="button"
      style={{ width: "100%", marginBottom: "16px", backgroundColor: "#6366f1" }}
    >
      {loading ? "Generating..." : "🚀 Generate via AI"}
    </button>

    {content && (
      <div style={{ marginTop: "20px" }}>
        <label style={{ fontWeight: "500", marginBottom: "8px", display: "block" }}>
          ✍️ Review & Edit Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontFamily: "inherit",
          }}
        />

        <button
          onClick={handleSave}
          className="button"
          style={{
            width: "100%",
            marginTop: "16px",
            backgroundColor: "#2563eb",
          }}
        >
          💾 Save Knowledge Base
        </button>
      </div>
    )}

    {message && (
      <p
        style={{
          backgroundColor: "#f3f4f6",
          padding: "12px",
          borderRadius: "8px",
          marginTop: "20px",
          fontSize: "14px",
          border: "1px solid #e5e7eb",
        }}
      >
        {message}
      </p>
    )}
  </div>
);

};

export default GenerateAIForm;
