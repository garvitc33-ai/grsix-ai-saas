import React, { useState } from "react";

const VoiceAgent = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleTestCall = async () => {
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://localhost:3010/call", {
        method: "GET",
      });

      const text = await res.text();
      setResponse(text);
    } catch (err) {
      console.error("Error starting call:", err);
      setResponse("❌ Failed to start the call.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        background: "#f9fafb",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        maxWidth: "700px",
        margin: "40px auto",
      }}
    >
      <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px", color: "#111827" }}>
        🎙️ Voice AI Calling Assistant
      </h2>

      <p style={{ color: "#4B5563", marginBottom: "30px", lineHeight: "1.6" }}>
        Use this tool to test our AI voice agent powered by Twilio and Groq.
        It will place a real call to your number, and respond like a human agent.
      </p>

      <button
        onClick={handleTestCall}
        disabled={loading}
        style={{
          backgroundColor: "#6366f1",
          color: "#fff",
          padding: "14px 24px",
          fontSize: "16px",
          borderRadius: "8px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Calling..." : "📞 Start AI Call"}
      </button>

      {response && (
        <div
          style={{
            marginTop: "30px",
            padding: "16px",
            backgroundColor: "#e0f2fe",
            color: "#0369a1",
            borderRadius: "8px",
            fontWeight: "500",
          }}
        >
          {response}
        </div>
      )}
    </div>
  );
};

export default VoiceAgent;
