const OverviewCards = () => {
  const cards = [
    { title: "Total Leads", value: 128 },
    { title: "Cold Emails Sent", value: 92 },
    { title: "Follow-Ups Scheduled", value: 34 },
    { title: "Responses", value: 18 },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
        marginBottom: "30px",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
            transition: "transform 0.2s ease",
          }}
        >
          <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "6px" }}>
            {card.title}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "600",
              color: "#000", // black theme
            }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;
