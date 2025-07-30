import React, { useState } from "react";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import ColdEmail from "./pages/ColdEmail";
import VoiceAgent from "./pages/VoiceAgent";
import Settings from "./pages/Settings";
import KnowledgeBase from "./pages/KnowledgeBase";
import CreateAgent from "./pages/CreateAgent";
import AgentDashboard from "./pages/AgentDashboard";
import CreateCampaign from "./pages/CreateCampaign";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";
import CampaignStatusBoard from "./pages/CampaignStatusBoard";

// Modern chatbot widget import
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
  const [selectedPage, setSelectedPage] = useState("Dashboard");

  const renderPage = () => {
    switch (selectedPage) {
      case "Dashboard":
        return <Dashboard onNavigate={setSelectedPage} />;
      case "Send Cold Email":
        return <ColdEmail />;
      case "Voice AI":
        return <VoiceAgent />;
      case "Settings":
        return <Settings />;
      case "Knowledge Base":
        return <KnowledgeBase />;
      case "Create Agent":
        return <CreateAgent />;
      case "Agent Dashboard":
        return <AgentDashboard onBack={() => setSelectedPage("Dashboard")} />;
      case "Create Campaign":
        return <CreateCampaign />;
      case "Analytics Dashboard":
        return <AnalyticsDashboard onBack={() => setSelectedPage("Dashboard")} />;
      case "Campaign Board":
        return <CampaignStatusBoard onBack={() => setSelectedPage("Dashboard")} />;
      default:
        return <Dashboard onNavigate={setSelectedPage} />;
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar onSelect={setSelectedPage} selectedPage={selectedPage} />
      <main style={{ marginLeft: "240px", padding: "24px", flexGrow: 1 }}>
        {renderPage()}
      </main>
      {/* Chatbot Widget - auto-closes on navigation changes */}
      <ChatbotWidget closeOnNavKey={selectedPage} />
    </div>
  );
}

export default App;
