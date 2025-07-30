const AIControls = () => {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.03)",
        marginBottom: "30px",
        maxWidth: "600px",
      }}
    >
      <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
        🤖 AI Assistant Controls
      </h3>

      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
        Use the AI to auto-analyze lead pages, generate emails, and schedule follow-ups.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button className="button" style={buttonStyle}>
          Analyze Website
        </button>
        <button className="button" style={buttonStyle}>
          Generate Follow-up
        </button>
        <button className="button" style={buttonStyle}>
          Schedule AI Call
        </button>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: "10px 18px",
  fontSize: "14px",
  borderRadius: "8px",
  backgroundColor: "#5a5afc",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  transition: "background 0.3s",
};

export default AIControls;
