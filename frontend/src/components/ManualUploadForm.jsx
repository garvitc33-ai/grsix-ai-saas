// src/components/ManualUploadForm.jsx
import React, { useState } from "react";
import { uploadKnowledgeBase } from "../services/knowledgeBaseService";

const ManualUploadForm = () => {
  const [companyName, setCompanyName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName || !file) {
      setMessage("❌ Please enter company name and select a file.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await uploadKnowledgeBase(companyName, file);
      setMessage("✅ Knowledge base uploaded successfully!");
      setCompanyName("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {/* Company Name */}
      <div className="form-group">
        <label className="form-label">Company Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Example Corp"
          className="form-input"
        />
      </div>

      {/* Upload File */}
      <div className="form-group">
        <label className="form-label">Upload Document</label>
        <input
          type="file"
          accept=".doc,.docx,.pdf,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="form-input"
        />
        <p className="form-hint">Accepted formats: .doc, .docx, .pdf, .txt</p>
      </div>

      {/* Submit Button */}
      <button type="submit" className="button" disabled={loading}>
        {loading ? "Uploading..." : "📤 Upload Knowledge Base"}
      </button>

      {/* Result Message */}
      {message && (
        <p style={{ marginTop: "10px", color: "#374151", fontSize: "14px" }}>
          {message}
        </p>
      )}
    </form>
  );
};

export default ManualUploadForm;
