import React, { useState, useRef, useEffect } from "react";

function renderHtml(msg) {
  let clean = msg.replace(/\[\[DONE_BUTTON\]\]/g, "");
  clean = clean.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  clean = clean.replace(/^- /gm, "<li>• ");
  clean = clean.replace(/\n/g, "<br/>");
  clean = clean.replace(/(<li>• .+?)(?=<br\/>|$)/g, "$1</li>");
  return clean;
}

export default function ChatbotWidget({ closeOnNavKey }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! I’m your GRSIX AI Assistant. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

  // Always autoscroll on new message or (re)open
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(e.target) &&
        e.target.id !== "chatbot-opener"
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Auto-close on page navigation/section change
  useEffect(() => {
    if (open && closeOnNavKey !== undefined) {
      setOpen(false);
    }
    // eslint-disable-next-line
  }, [closeOnNavKey]);

  const lastMsg = messages[messages.length - 1];
  const showDone = lastMsg && lastMsg.from === "bot" && lastMsg.text.includes("[[DONE_BUTTON]]");

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(msgs => [...msgs, { from: "user", text: trimmed }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed })
      });
      const data = await res.json();
      setMessages(msgs => [
        ...msgs,
        { from: "bot", text: data.error ? "Bot error: " + data.error : (data.answer || "Sorry, I didn't get that.") }
      ]);
    } catch (e) {
      setMessages(msgs => [...msgs, { from: "bot", text: "Bot error: " + (e.message || "Could not reach server") }]);
    }
    setInput("");
    setLoading(false);
  }

  function handleDone() {
    setMessages([
      { from: "bot", text: "Hello! I’m your GRSIX AI Assistant. How can I help you?" }
    ]);
    setInput("");
  }

  function handleInputKey(e) {
    if (e.key === "Enter" && input.trim() && !loading) sendMessage();
  }

  return (
    <>
      <button
        id="chatbot-opener"
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 1000,
          padding: "12px 20px", background: "#444cfc", color: "#fff",
          borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 22
        }}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chatbot" : "Open chatbot"}
      >💬</button>
      {open && (
        <div
          ref={widgetRef}
          style={{
            position: "fixed", bottom: 70, right: 20, zIndex: 1001, width: 340,
            maxWidth: "calc(100vw - 32px)", minWidth: 260,
            background: "#fff", border: "1px solid #ccc", borderRadius: 12,
            boxShadow: "0 4px 22px rgba(0,0,0,0.13)", display: "flex",
            flexDirection: "column", maxHeight: 500,
            overflow: "hidden"
          }}>
          <div style={{ padding: 12, flex: 1, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                textAlign: m.from === "user" ? "right" : "left", margin: "6px 0"
              }}>
                <span
                  style={{
                    display: "inline-block", padding: "8px 14px",
                    background: m.from === "user" ? "#d3e2ff" : "#f5f5f5",
                    borderRadius: 16, maxWidth: "85%", wordBreak: "break-word"
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderHtml(m.text)
                  }}
                />
              </div>
            ))}
            {loading && (
              <div style={{ color: "#888" }}>Bot is replying...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Perfect input/action bar */}
          <div style={{
            padding: 8,
            borderTop: "1px solid #eee",
            background: "#f9f9fe",
            display: "flex",
            alignItems: "center",
            gap: 4,
            minHeight: 52
          }}>
            <input
              type="text"
              value={input}
              disabled={loading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleInputKey}
              placeholder="Type your question..."
              style={{
                flex: 1, padding: 8, borderRadius: 8,
                border: "1px solid #eee", fontSize: "1em",
                minWidth: 0 // ensures doesn't overflow in flex
              }}
              aria-label="Ask the chatbot"
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: "8px 16px", background: "#444cfc", color: "#fff",
                border: "none", borderRadius: 6, fontWeight: "bold", fontSize: "1em"
              }}
            >Send</button>
            {showDone && (
              <button
                style={{
                  background: "#24ca6d", color: "#fff", border: "none",
                  borderRadius: 6, padding: "8px 14px", fontWeight: 600,
                  cursor: "pointer", fontSize: "1em", minWidth: 55
                }}
                onClick={handleDone}
                tabIndex={0}
              >Done</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
