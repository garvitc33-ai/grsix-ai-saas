import express from "express";
import { getAgentById } from "../models/Agent.js";
import twilio from "twilio";
import { generateNextGroqResponse } from "../ai.js";

const router = express.Router();
const callSessions = {};
const MAX_HISTORY = 12;

function isGoodbye(reply = "") {
  return /goodbye|thank you for your time|wish you (well|a great day)|that's all|not interested|no thanks|bye/i.test(reply);
}

// === 1️⃣ Call Starts: Clear Sales Opening ===
router.post("/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await getAgentById(agentId);
    const callSid = req.body.CallSid || "unknown-session";

    if (!agent) {
      return res.status(404).type("text/xml").send(`
        <Response>
          <Say>Agent not found. Goodbye!</Say>
          <Hangup />
        </Response>
      `);
    }

    const company = agent.companyName || agent.company_name || "our company";
    callSessions[callSid] = { history: [] };

    const greeting = "Hi! This is a quick call to share something valuable.";
    const intro = `I’m calling from ${company}, and we specialize in helping people like you find their dream property.`;
    const hook = `Can I take just 30 seconds to tell you what makes our offerings stand out?`;

    callSessions[callSid].history.push({
      role: "assistant",
      text: `${greeting} ${intro} ${hook}`,
    });

    const response = new twilio.twiml.VoiceResponse();
    const gather = response.gather({
      input: "speech",
      action: `/api/twilio/step-2/${agentId}?sessionId=${callSid}`,
      method: "POST",
      timeout: 4, // Shorter timeout for faster flow
    });

    gather.say({ voice: "alice", language: "en-US" }, greeting);
    gather.pause({ length: 0.5 });
    gather.say(intro);
    gather.pause({ length: 0.5 });
    gather.say(hook);

    res.type("text/xml").send(response.toString());
  } catch (err) {
    console.error("❌ Error in voiceHandler start:", err.message);
    res.status(500).type("text/xml").send(`
      <Response>
        <Say>Internal server error. Goodbye!</Say>
        <Hangup />
      </Response>
    `);
  }
});

// === 2️⃣ AI-Driven Human-Like Sales Assistant Flow ===
router.post("/step-2/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const userSpeech = req.body.SpeechResult || "";
    const sessionId = req.query.sessionId || "unknown-session";

    if (!userSpeech) {
      return res.type("text/xml").send(`
        <Response>
          <Say>Sorry, I didn’t catch that. Let's try again later. Goodbye!</Say>
          <Hangup />
        </Response>
      `);
    }

    const agent = await getAgentById(agentId);
    if (!agent) {
      return res.type("text/xml").send(`
        <Response>
          <Say>Agent not found. Goodbye!</Say>
          <Hangup />
        </Response>
      `);
    }

    if (!callSessions[sessionId]) callSessions[sessionId] = { history: [] };
    const history = callSessions[sessionId].history;

    history.push({ role: "user", text: userSpeech });
    callSessions[sessionId].history = history.slice(-MAX_HISTORY);

    const referenceScript = agent.script || agent.knowledge_base || "";
    const rawReply = await generateNextGroqResponse(referenceScript, userSpeech, sessionId);
    history.push({ role: "assistant", text: rawReply });

    const response = new twilio.twiml.VoiceResponse();
    const cleanedReply = rawReply.replace(/\n/g, " ").trim();
    const chunks = cleanedReply.split(/(?<=[.?!])\s+/).filter(Boolean);

    for (const chunk of chunks) {
      response.say({ voice: "alice", language: "en-US" }, chunk);
      response.pause({ length: 0.5 }); // Faster pacing
    }

    if (isGoodbye(cleanedReply)) {
      response.say("Thanks again for your time. I hope we get to connect soon. Goodbye!");
      response.hangup();
      delete callSessions[sessionId];
    } else {
      response.gather({
        input: "speech",
        action: `/api/twilio/step-2/${agentId}?sessionId=${sessionId}`,
        method: "POST",
        timeout: 4,
      });
    }

    res.type("text/xml").send(response.toString());
  } catch (err) {
    console.error("❌ Error in voiceHandler step-2:", err.message);
    res.status(500).type("text/xml").send(`
      <Response>
        <Say>Something went wrong. We'll call again soon. Goodbye!</Say>
        <Hangup />
      </Response>
    `);
  }
});

// === 🔄 Optional Reset API ===
router.post("/reset/:callSid", (req, res) => {
  const { callSid } = req.params;
  delete callSessions[callSid];
  res.json({ ok: true });
});

export default router;
