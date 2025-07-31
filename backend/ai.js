import { extractWebsiteText } from "./scraper.js";
import { Groq } from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY in environment variables");
}

const conversationHistory = {}; // { [sessionId]: [ { role, content } ... ] }

/**
 * Generate a cold email from a company's website content
 */
export async function generateEmailFromWebsite(url) {
  const websiteText = await extractWebsiteText(url);

  if (!websiteText || websiteText.length < 100) {
    throw new Error("Website content too short or failed to extract");
  }

  const prompt = `
You're a professional cold outreach expert working for GRSIX AI — an AI-powered follow-up and CRM automation system.

Your job is to write short, natural, highly personalized cold emails based on the target company's website content (below). Each email should:

1. Start with a greeting like "Hi [Company Name] Team," or "Hi [Name],"
2. Acknowledge the website/company positively but concisely — no generic praise
3. Re-state a pain they likely face (missed follow-ups, lead leakage, staff overload, slow response times, etc.)
4. Show how GRSIX AI solves that — with voice + email automation, lead tracking, CRM sync
5. Be written like a human — no robotic tone, no “I empathize with your pain” language
6. Stay under 140 words
7. End with a clear CTA (e.g., "Would you be open to a 15-minute call next week?")

Only return the final email body — no titles, no extra commentary.

Website content:
"""${websiteText}"""
  `.trim();

  const chat = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192"
  });

  return chat.choices[0].message.content.trim();
}

/**
 * Generate a natural call script using a company knowledge base
 */
export async function generateScript(companyName, knowledgeBase = "") {
  const callPrompt = `
You're a persuasive, confident AI sales assistant calling on behalf of "${companyName}".

Goal: Convince the lead to use the product/service, book a demo, or learn more — not just share info.

Use the following knowledge base only to understand what the company offers, but speak naturally, step by step.

Your call flow should be:
- Friendly intro and soft opener
- Ask if it's a good time
- Mention what the company does, but keep it tight and tailored
- Clearly explain how the solution benefits the lead
- Ask small questions to keep them engaged
- Handle objections naturally, like a human would
- Try to get interest, convert or move forward

Knowledge Base:
"""${knowledgeBase}"""
  `.trim();

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: callPrompt }],
    model: "llama3-70b-8192"
  });

  return response.choices[0].message.content.trim();
}

/**
 * Improve knowledge base using feedback
 */
export async function improveKnowledgeBase(oldBase, instructionPrompt) {
  const fullPrompt = `
You are a helpful AI assistant. You're improving a company's knowledge base based on human feedback.

--- Original Knowledge Base ---
${oldBase}

--- Instruction ---
${instructionPrompt}

Now rewrite the updated knowledge base clearly, keeping the original structure and integrating the feedback.
  `.trim();

  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a knowledge base editor AI." },
      { role: "user", content: fullPrompt }
    ],
    model: "llama3-70b-8192"
  });

  return response.choices[0].message.content.trim();
}

/**
 * Generate the next response during the call — fast, clear, and persuasive
 */
export async function generateNextGroqResponse(referenceScript = "", userInput = "", sessionId = "") {
  try {
    if (!userInput?.trim()) {
      return "Sorry, I didn’t catch that. Could you repeat?";
    }

    if (!conversationHistory[sessionId]) {
      conversationHistory[sessionId] = [
        {
          role: "system",
          content: `
You are a smart, fast-talking, persuasive AI sales assistant.

IMPORTANT:
- Your job is to convert the lead, not just explain.
- NEVER read or quote from the reference script — just use it to answer questions when needed.
- Speak like a confident human: fast, warm, casual, helpful, and professional.
- After every sentence or question, pause and wait for the user's reply.
- Respond in short chunks like:
  "Hey! I'm calling from [company]..." → wait → "We help people like you with..." → wait
- If the user sounds uninterested (says "not now", "bye", "stop", etc.), politely end the call.
- Always stay goal-focused: Try to book a demo, get interest, or qualify the lead.

FACTS ONLY (do not repeat directly):
"""${referenceScript}"""
          `.replace(/^ +/gm, '')
        }
      ];
    }

    conversationHistory[sessionId].push({ role: "user", content: userInput });

    // Trim history to last 20 messages (keep system message intact)
    if (conversationHistory[sessionId].length > 20) {
      conversationHistory[sessionId] = [
        conversationHistory[sessionId][0], // system
        ...conversationHistory[sessionId].slice(-19)
      ];
    }

    const chat = await groq.chat.completions.create({
      messages: conversationHistory[sessionId],
      model: "llama3-70b-8192",
      temperature: 0.75
    });

    const reply = chat.choices[0].message.content.trim();
    conversationHistory[sessionId].push({ role: "assistant", content: reply });

    const lower = userInput.toLowerCase();
    const shouldEnd = [
      "bye", "not interested", "stop", "no thanks",
      "call later", "don't want", "already using"
    ].some(phrase => lower.includes(phrase));

    if (shouldEnd) {
      return "Got it! Thanks for your time — have a great day!";
    }

    return reply;
  } catch (err) {
    console.error("❌ Groq AI error:", err.message);
    return "Sorry, something went wrong. Could you repeat that?";
  }
}
