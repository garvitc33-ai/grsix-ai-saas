import express from "express";
import axios from "axios";

const router = express.Router();

// --- GRSIX SaaS In-App FAQ Database ---
const FAQS = [
  {
    keywords: ["create campaign", "new campaign"],
    answer: `
**Create a Campaign – Quick Guide**

- Click <b>Campaigns</b> on the sidebar.
- Click <b>Create Campaign</b> (blue button).
- Name your campaign, select agent, upload a CSV list, and set your schedule.
- Click <b>Start Campaign</b> to launch.

Track progress in the <b>Campaign Board</b>.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["campaign board", "status board", "check status"],
    answer: `
**Campaign Board Overview**

- Access via sidebar: <b>Campaign Board</b>.
- View campaigns with schedules and status (Ongoing/Completed).
- Click a campaign for detailed call logs and progress.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["analytics", "analytics dashboard", "stats", "view data", "calls completed"],
    answer: `
**Using Analytics Dashboard**

- Click <b>Analytics Dashboard</b> in the sidebar.
- View pie charts, stats, and call metrics.
- Filter by <b>Campaign</b> or <b>Agent</b>.
- Explore the <b>Leaderboard</b> and <b>Recent Calls</b>.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["create agent", "add agent", "voice ai", "agent dashboard"],
    answer: `
**Creating an Agent (Voice AI)**

- Go to <b>Create Agent</b> from sidebar.
- Enter details and assign a knowledge base.
- Click <b>Create</b> to add agent.
- Manage all agents under <b>Agent Dashboard</b>.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["upload list", "upload leads", "csv", "excel", "import list"],
    answer: `
**Uploading a CSV/XLSX Lead List**

- In <b>Create Campaign</b>, use "Upload Lead List".
- Select a .csv or .xlsx file.
- Confirm schedule and launch.

Supported formats: .csv, .xlsx

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["edit campaign", "change schedule", "reschedule"],
    answer: `
**Editing or Rescheduling Campaigns**

- Go to <b>Campaign Board</b>.
- Click the campaign to modify.
- Update schedule/details if allowed, then save.

_Note: Some edits may be locked after launch._

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["dashboard", "overview"],
    answer: `
**Dashboard Overview**

- Top-level view of campaigns, calls, and agents.
- Use sidebar to navigate to Voice, Campaigns, Analytics, and more.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["settings"],
    answer: `
**Settings Panel**

- Access <b>Settings</b> from the sidebar.
- Configure integrations, email, voice options, and preferences.

[[DONE_BUTTON]]
    `.trim()
  }
];

// System instructions for the LLM
const SYSTEM_PROMPT = `
You are the in-app support assistant for the GRSIX AI SaaS dashboard.

Always reply with:
- Clear steps and bullet points.
- Bold section titles.
- Short, actionable help.
- Always end with: [[DONE_BUTTON]]

Do NOT mention features not in: Dashboard, Create Campaign, Campaign Board, Analytics Dashboard, Create Agent, Agent Dashboard, Settings.
`;

// Match FAQs
function findFaqAnswer(question = "") {
  const lower = question.toLowerCase();
  return FAQS.find(f => f.keywords.some(k => lower.includes(k)))?.answer || null;
}

// Main chatbot handler
router.post("/", async (req, res) => {
  let { question } = req.body;

  if (
    typeof question !== "string" ||
    !question.trim() ||
    question.length > 500
  ) {
    return res.status(400).json({ error: "Missing or invalid question." });
  }

  question = question.trim();

  // Direct FAQ hit
  const faAnswer = findFaqAnswer(question);
  if (faAnswer) return res.json({ answer: faAnswer });

  // Fallback to Groq model
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question },
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    const answer =
      (response?.data?.choices?.[0]?.message?.content?.trim() ||
        "I'm sorry, I couldn't find the answer. Please try again.")
      + "\n\n[[DONE_BUTTON]]";

    res.json({ answer });
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message || "Groq API Error";
    console.error("❌ Chatbot error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
