import React, { useState } from "react";
import {
  Home,
  Mail,
  Users,
  Settings,
  Phone,
  Brain,
  BookOpen,
  LayoutDashboard,
  BarChart2,
} from "lucide-react";

const sidebarStyle = {
  width: "240px",
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e5e7eb",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  position: "fixed",
  top: 0,
  bottom: 0,
  left: 0,
  height: "100vh",
  overflowY: "auto",
  zIndex: 1000,
};

const navItemStyle = {
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  marginBottom: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: 500,
  transition: "all 0.2s ease",
};

const blue = "#2057fe"; // or "#061debff"
const blueBg = "#eef3fe"; // subtle blue highlight for active background

const Sidebar = ({ onSelect, selectedPage }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const items = [
    { label: "Dashboard", icon: Home },
    { label: "Send Cold Email", icon: Mail },
    { label: "Voice AI", icon: Phone },
    { label: "Knowledge Base", icon: BookOpen },
    { label: "Create Agent", icon: Brain },
    { label: "Agent Dashboard", icon: LayoutDashboard },
    { label: "Create Campaign", icon: LayoutDashboard },
    { label: "Campaign Board", icon: BarChart2 },
    { label: "Analytics Dashboard", icon: BarChart2 },
    { label: "Settings", icon: Settings },
  ];

  return (
    <aside style={sidebarStyle}>
      {/* Logo Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
        <img
          src="https://iili.io/Fcjo6zP.png"
          alt="GRSIX Logo"
          style={{
            height: "48px",
            width: "48px",
            objectFit: "contain",
            marginRight: "10px",
          }}
        />
        <span style={{ fontSize: "22px", fontWeight: 600, color: "#111827" }}>
          Autofollow
        </span>
      </div>

      {/* Navigation */}
      <nav>
        {items.map((item, index) => {
          const isActive = selectedPage === item.label;
          const isHovered = hoveredIndex === index;
          const IconComponent = item.icon;

          // Highlight active item in blue, hover blueish if not active
          let backgroundColor = "transparent";
          let color = "#1f2937";
          let iconColor = "#1f2937";
          if (isActive) {
            backgroundColor = blueBg;
            color = blue;
            iconColor = blue;
          } else if (isHovered) {
            backgroundColor = "#f5f7fd";
            color = blue;
            iconColor = blue;
          }

          return (
            <div
              key={index}
              style={{
                ...navItemStyle,
                backgroundColor,
                color,
                fontWeight: isActive ? 500 : 300,
                boxShadow: isActive ? "0 1px 5px #e2eaff" : undefined,
              }}
              onClick={() => onSelect(item.label)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <IconComponent
                size={20}
                style={{ marginRight: "12px" }}
                color={iconColor}
              />
              {item.label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
