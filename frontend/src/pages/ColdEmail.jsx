import React, { useState } from "react";

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#374151",
};

const previewStyle = {
  backgroundColor: "#f1f1f1",
  padding: "16px",
  borderRadius: "8px",
  marginTop: "20px",
  whiteSpace: "pre-wrap",
  fontSize: "14px",
  color: "#111827",
};

function ColdEmail() {
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSent(false);
    try {
      const res = await fetch("http://localhost:3010/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website }),
      });

      const data = await res.json();

      if (res.ok) {
        setGeneratedEmail(data.email);
      } else {
        setError(data.message || "Failed to generate email");
      }
    } catch (err) {
      setError("Something went wrong while generating email.");
    }
    setLoading(false);
  };

  const handleSend = async () => {
    setError("");
    setSent(false);
    try {
      const res = await fetch("http://localhost:3010/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website, to: email }),
      });

      const data = await res.json();

      if (res.ok && data.message) {
        setSent(true);
      } else {
        setError(data.message || "Failed to send email");
      }
    } catch (err) {
      setError("Something went wrong while sending email.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2
        style={{
          fontSize: "28px",
          marginBottom: "24px",
          fontWeight: 600,
          color: "#333",
          transform: "translateY(0)",
          opacity: 1,
          transition: "all 0.6s ease",
        }}
      >
        📧 Send Cold Email
      </h2>

      <div className="card" style={{ maxWidth: "600px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Company Website URL</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Recipient Email (optional)</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button className="button" onClick={handleGenerate} style={{backgroundColor:"#061debff", color:"#f9fafb"}}>
            {loading ? "Generating..." : "Generate Email"}
          </button>

          {error && <p style={{ color: "red" }}>❌ {error}</p>}
        </div>

        {generatedEmail && (
  <div
    style={{
      backgroundColor: "#f9fafb",
      padding: "16px",
      borderRadius: "10px",
      border: "1px solid #e5e7eb",
      marginTop: "24px",
    }}
  >
    <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#374151" }}>
      Email Preview
    </h4>

    <pre
      style={{
        fontSize: "14px",
        lineHeight: "1.6",
        color: "#111827",
        whiteSpace: "pre-wrap",
        fontFamily: "Menlo, monospace",
        marginBottom: "16px",
      }}
    >
      {generatedEmail}
    </pre>

    <button
      className="button"
      style={{ backgroundColor: "#4CAF50", marginTop: "4px" }}
      onClick={handleSend}
    >
      Send Email
    </button>
  </div>
)}


        {sent && (
          <p style={{ color: "green", marginTop: "10px" }}>
            ✅ Email Sent Successfully!
          </p>
        )}
      </div>
    </div>
  );
}

export default ColdEmail;
