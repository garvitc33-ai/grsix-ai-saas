import React, { useState } from "react";

const Settings = () => {
  const [name, setName] = useState("Garvit Choudhary");
  const [email, setEmail] = useState("garvit@example.com");
  const [notifications, setNotifications] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    alert("✅ Settings saved!");
  };

  return (
    <div>
      <h1 style={{ fontSize: "26px", fontWeight: "bold", marginBottom: "20px" }}>
        Settings
      </h1>

      <form onSubmit={handleSave} style={{ maxWidth: "500px" }}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            value={email}
            disabled
            style={{ ...inputStyle, backgroundColor: "#f9fafb" }}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Notifications</label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />
            Enable email alerts
          </label>
        </div>

        <button type="submit" style={buttonStyle}>
          Save Settings
        </button>
      </form>
    </div>
  );
};

const formGroupStyle = {
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontWeight: "500",
  marginBottom: "6px",
  color: "#333",
};

const inputStyle = {
  padding: "10px",
  fontSize: "15px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const buttonStyle = {
  backgroundColor: "#6366f1",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  fontWeight: "500",
  cursor: "pointer",
};

export default Settings;
