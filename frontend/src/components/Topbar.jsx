import React from "react";

const Topbar = () => {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "16px 24px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#111827" }}>
        Dashboard
      </h1>

      <div
        style={{
          width: "36px",
          height: "36px",
          backgroundColor: "#e0e7ff",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          color: "#4f46e5",
        }}
      >
        G
      </div>
    </div>
  );
};

export default Topbar;
