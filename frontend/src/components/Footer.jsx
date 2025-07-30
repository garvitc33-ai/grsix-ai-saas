const Footer = () => {
  return (
    <footer
      style={{
        marginTop: "40px",
        padding: "20px 0",
        textAlign: "center",
        fontSize: "13px",
        color: "#6b7280",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      © {new Date().getFullYear()} GRSIX AI — AutoFollow CRM. All rights reserved.
    </footer>
  );
};

export default Footer;
