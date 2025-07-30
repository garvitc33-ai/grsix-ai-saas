import express from "express";
import axios from "axios";
const router = express.Router();

// --- Modern Organized FAQS for GRSIX AI SaaS ---
const FAQS = [
  {
    keywords: ["create campaign", "new campaign"],
    answer: `
**Create a Campaign – Quick Guide**

**Step 1:**
- Click <b>Campaigns</b> on the sidebar.

**Step 2:**
- Click <b>Create Campaign</b> (blue button).

**Step 3:**
- Name your campaign.
- Select agent, upload a CSV list, and set your schedule.

**Step 4:**
- Review and click <b>Start Campaign</b>.

You can track progress on the <b>Campaign Board</b>!

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["campaign board", "status board", "check status"],
    answer: `
**Campaign Board Overview**

- Go to <b>Campaign Board</b> from the sidebar.
- See ALL campaigns, their schedule, and current status (Completed/Ongoing/etc).
- Click any campaign for detailed info, call logs, and progress.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["analytics", "analytics dashboard", "stats", "view data", "calls completed"],
    answer: `
**Using Analytics Dashboard**

- Click <b>Analytics Dashboard</b> (sidebar).
- See overall progress with pie charts and daily stats.
- Use filters to view by <b>Campaign</b> or <b>Agent</b>.
- Check the <b>Leaderboard</b> to see top-performing campaigns and agents.
- Browse <b>Recent Calls</b> for details.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["create agent", "add agent", "voice ai", "agent dashboard"],
    answer: `
**Creating an Agent (Voice AI/Campaigns)**

- Click <b>Create Agent</b> from the sidebar.
- Fill in agent details and assign a knowledge base.
- Click <b>Create</b> to make the agent available.
- Manage all agents in <b>Agent Dashboard</b>.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["upload list", "upload leads", "csv", "excel", "import list"],
    answer: `
**Uploading a CSV/XLSX List**

- In <b>Create Campaign</b>, use "Upload Lead List" to select your .csv or .xlsx file.
- Confirm the file and schedule before launching.
- Supported formats: CSV, XLSX.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["edit campaign", "change schedule", "reschedule"],
    answer: `
**Editing/Rescheduling a Campaign**

- Go to <b>Campaign Board</b>.
- Click the campaign you want to edit.
- Update its details or schedule (if the option is enabled).
- Save changes.

_Note: Scheduled or completed campaigns may have limited edit options._

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["dashboard", "overview"],
    answer: `
**Dashboard Quick Overview**

- <b>Dashboard</b> gives you a top-level view of all major SaaS modules and stats.
- Use sidebar for navigation to Email, Voice, Campaigns, Analytics, and more.

[[DONE_BUTTON]]
    `.trim()
  },
  {
    keywords: ["settings"],
    answer: `
**Settings**

- Click <b>Settings</b> on the sidebar.
- Configure integrations, email, voice, and other preferences.
- Save to apply changes.

[[DONE_BUTTON]]
    `.trim()
  }
  // Add more as you refine your app!
];

const SYSTEM_PROMPT = `
You are the in-app support assistant for the GRSIX AI SaaS dashboard. Always answer with:
- Short, modern, clearly formatted sections.
- Bulleted steps, bold section names, and actionable button/click instructions.
- Never write big paragraphs or walls of text.
- Always end with: '[[DONE_BUTTON]]' so the user can mark the answer as complete.

Sidebar sections: Dashboard, Create Campaign, Campaign Board, Analytics Dashboard, Create Agent, Agent Dashboard, Settings.
Do not discuss features NOT present in this UI.
If the user is done, they can click "Done" to reset the chat.
`;

// FAQ finder
function findFaqAnswer(question) {
  if (!question) return null;
  const q = question.toLowerCase();
  for (const faq of FAQS) {
    if (faq.keywords.some(word => q.includes(word))) {
      return faq.answer;
    }
  }
  return null;
}

// Main chatbot route
router.post("/", async (req, res) => {
  let { question } = req.body;
  if (
    !question ||
    typeof question !== "string" ||
    !question.trim() ||
    question.length > 500
  ) {
    return res.status(400).json({ error: "Missing or invalid question." });
  }
  question = question.trim();

  // FAQ direct answer
  const faAnswer = findFaqAnswer(question);
  if (faAnswer) return res.json({ answer: faAnswer });

  // Prepare Groq payload
  const payload = {
    model: "llama3-70b-8192",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: question },
    ]
  };

  try {
    const result = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );
    const answer =
      (result?.data?.choices?.[0]?.message?.content?.trim() ||
      "I'm sorry, I couldn't find the answer. Please try again or check the Knowledge Base.")
      + "\n\n[[DONE_BUTTON]]";
    res.json({ answer });
  } catch (err) {
    let apiError = "Groq API error.";
    if (err.response?.data?.error?.message) {
      apiError = err.response.data.error.message;
    } else if (err.message) {
      apiError = err.message;
    }
    res.status(500).json({ error: apiError });
  }
});

export default router;
