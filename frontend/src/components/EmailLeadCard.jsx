// src/components/EmailLeadCard.jsx
import React from "react";

const EmailLeadCard = ({ lead }) => {
  const {
    email,
    time,
    subject,
    preview,
    content,
    category,
    follow_up_status
  } = lead;

  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: "12px",
      padding: "1rem",
      width: "100%",
      maxWidth: "500px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      background: "#fff"
    }}>
      <h2 style={{ marginBottom: "0.5rem" }}>{email}</h2>
      <p><strong>🕒 Sent:</strong> {time}</p>
      <p><strong>📊 Category:</strong> {category?.toUpperCase() || "N/A"}</p>
      <p><strong>🔁 Follow-up:</strong> {follow_up_status || "N/A"}</p>

      <div style={{ marginTop: "1rem" }}>
        <p><strong>✉️ Subject:</strong> {subject}</p>
        <p><strong>📋 Preview:</strong> <em>{preview}</em></p>
        <div style={{ marginTop: "1rem", background: "#f9f9f9", padding: "0.75rem", borderRadius: "8px" }}>
          <strong>📄 Email Content:</strong>
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
};

export default EmailLeadCard;
