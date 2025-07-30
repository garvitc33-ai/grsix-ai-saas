import express from "express";
import twilio from "twilio";
import { getKnowledgeBaseById } from "../models/knowledgeBase.js";
import {
  saveAgent,
  getAllAgents,
  deleteAgentById,
  getAgentById,
} from "../models/Agent.js";
import { generateScript } from "../ai.js";

const router = express.Router();

// 🟡 Twilio client setup
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// === 1️⃣ Generate AI Script from Knowledge Base + Purpose ===
router.post("/generate-script", async (req, res) => {
  const { knowledgeBaseId, purpose } = req.body;

  if (!knowledgeBaseId || !purpose) {
    return res
      .status(400)
      .json({ error: "knowledgeBaseId and purpose are required" });
  }

  try {
    const kb = await getKnowledgeBaseById(knowledgeBaseId);
    if (!kb) {
      console.error("❌ Knowledge base not found");
      return res.status(404).json({ error: "Knowledge base not found" });
    }

    try {
      const script = await generateScript(kb.content, purpose);
      res.status(200).json({ script });
    } catch (genErr) {
      console.error("❌ Script generation failed:", genErr.message);
      res.status(500).json({ error: "Failed to generate script" });
    }
  } catch (err) {
    console.error("❌ Unexpected error during script generation:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// === 2️⃣ Save AI Agent ===
router.post("/", async (req, res) => {
  const { knowledgeBaseId, purpose, script, type } = req.body;

  if (!knowledgeBaseId || !purpose || !script || !type) {
    return res.status(400).json({
      error:
        "All fields are required (knowledgeBaseId, purpose, script, type)",
    });
  }

  try {
    // Parameter names in models/Agent.js: knowledge_base_id, purpose, script, type
    const id = await saveAgent({
      knowledge_base_id: knowledgeBaseId,
      purpose,
      script,
      type,
    });
    res
      .status(200)
      .json({ message: "✅ Agent saved successfully", id });
  } catch (err) {
    console.error("❌ Failed to save agent:", err.message);
    res.status(500).json({ error: "Failed to save agent" });
  }
});

// === 3️⃣ Get All Agents ===
router.get("/agents", async (req, res) => {
  try {
    const agents = await getAllAgents();
    console.log("✅ Agents fetched successfully:", agents.length);
    res.status(200).json(agents);
  } catch (err) {
    console.error("❌ Failed to fetch agents from DB:", err);
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

// === 4️⃣ Delete Agent by ID ===
router.delete("/:id", async (req, res) => {
  try {
    await deleteAgentById(req.params.id);
    res.status(200).json({ message: "✅ Agent deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete agent:", err.message);
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

// === 5️⃣ Trigger Real Twilio Call for Agent ===
router.post("/:id/call", async (req, res) => {
  try {
    const agent = await getAgentById(req.params.id);
    const to = req.body?.to || process.env.MY_PHONE_NUMBER;
    if (!agent)
      return res.status(404).json({ error: "Agent not found" });

    const call = await client.calls.create({
      url: `${process.env.NGROK_URL}/api/twilio/${agent.id}`,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log("📞 Twilio Call SID:", call.sid);
    console.log("📈 Call status:", call.status);

    res.status(200).json({
      message: `📞 Call triggered for agent ID: ${agent.id}`,
      callSid: call.sid,
      status: call.status,
    });
  } catch (err) {
    console.error("❌ Failed to trigger call:", err.message);
    res.status(500).json({ error: "Failed to trigger call" });
  }
});

export default router;
