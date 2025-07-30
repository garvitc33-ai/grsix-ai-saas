import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import twilio from "twilio";
import nodemailer from "nodemailer";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import leadsRoutes from "./routes/leads.js";
import knowledgeBaseRoutes from "./routes/knowledgeBase.js";
import agentRoutes from "./routes/agent.js";
import campaignRoutes from "./routes/Campaigns.js";
import scheduleRoutes from "./routes/schedule.js";
import voiceHandler from "./twilio/voiceHandler.js";
import { generateEmailFromWebsite } from "./ai.js";
import db from "./sqlite.js";
import campaignStatusRoutes from "./routes/campaignstatus.js";
import chatbotRoutes from "./routes/chatbot.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });
app.set("io", io);

io.on("connection", (socket) => {
  console.log("📡 New analytics dashboard client connected");
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/leads", leadsRoutes);
app.use("/api/knowledgebase", knowledgeBaseRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/twilio", voiceHandler);
app.use("/api/campaigns", campaignStatusRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api", campaignRoutes);

app.post("/api/generate-email", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Website URL is required" });
  try {
    const rawEmail = await generateEmailFromWebsite(url);
    res.status(200).json({ email: rawEmail });
  } catch (err) {
    console.error("❌ Error generating email:", err);
    res.status(500).json({ message: "Failed to generate cold email" });
  }
});

app.post("/api/send-email", async (req, res) => {
  const { url, to } = req.body;
  if (!url || !to)
    return res.status(400).json({ message: "URL and recipient email required" });
  try {
    const rawEmail = await generateEmailFromWebsite(url);
    const brandName = new URL(url).hostname.replace("www.", "").split(".")[0].toUpperCase();
    const subject = `Boost ${brandName} with Smart AI Follow-Ups`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"GRSIX AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: rawEmail,
    });

    await db.runAsync(
      `INSERT INTO email_leads (email, subject, preview, content, category, follow_up_status, time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [to, subject, rawEmail.slice(0, 50), rawEmail, "MEDIUM", "pending", new Date().toISOString()]
    );

    res.status(200).json({ message: "Email sent and saved!", emailBody: rawEmail });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
let conversationMemory = [];

app.get("/call", async (req, res) => {
  try {
    await client.calls.create({
      to: process.env.MY_PHONE_NUMBER,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: `${process.env.NGROK_URL}/voice`,
    });
    res.send("📞 Call started!");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error starting call.");
  }
});

app.post("/voice", (req, res) => {
  console.log("✅ /voice route hit");
  const twiml = new twilio.twiml.VoiceResponse();
  conversationMemory = [];

  const intro = `
    <speak>
      नमस्ते गरवित! <break time="300ms"/> मैं GRSIX AI की एवा बोल रही हूँ।
      <break time="400ms"/> क्या मैं आपकी किसी सहायता कर सकती हूँ?
    </speak>`;

  twiml.say({ voice: "Polly.Aditi", language: "hi-IN" }, intro);

  twiml.gather({
    input: "speech",
    timeout: 5,
    speechTimeout: "auto",
    action: "/gather",
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/gather", async (req, res) => {
  const userSpeech = req.body.SpeechResult || "कोई आवाज़ नहीं सुनी गई।";
  console.log("🧠 यूज़र ने कहा:", userSpeech);
  conversationMemory.push({ role: "user", content: userSpeech });

  const basePrompt = {
    role: "system",
    content: `
      तुम एवा हो, GRSIX AI की एक मददगार, विनम्र, और इंसान जैसी AI वॉयस असिस्टेंट हो।
      तुम गरवित को कॉल कर रही हो। तुम केवल हिंदी में ही जवाब देती हो।
      तुम एक असली इंसान की तरह बात करती हो — छोटे, गर्मजोशी से, और फ्रेंडली तरीके से।
      प्रश्न पूछो और उत्तर प्राकृतिक रूप से दो, जैसे एक वास्तविक बातचीत हो रही हो। अंग्रेज़ी का प्रयोग बिल्कुल मत करो।
    `,
  };

  const fullConversation = [basePrompt, ...conversationMemory];
  let aiReply = "माफ़ कीजिए, कुछ गड़बड़ हो गई है।";

  try {
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: fullConversation,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const reply = groqResponse.data.choices[0].message.content;
    conversationMemory.push({ role: "assistant", content: reply });
    aiReply = `<speak><break time="300ms"/>${reply.replace(/\n/g, "<break time='400ms'/>")}</speak>`;
  } catch (err) {
    console.error("❌ Groq API error:", err.message);
  }

  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say({ voice: "Polly.Aditi", language: "hi-IN" }, aiReply);

  twiml.gather({
    input: "speech",
    timeout: 5,
    speechTimeout: "auto",
    action: "/gather",
  }).say({ voice: "Polly.Aditi", language: "hi-IN" }, `<speak>क्या आप कुछ और जानना चाहेंगे?</speak>`);

  res.type("text/xml");
  res.send(twiml.toString());
});

app.get("/", (req, res) => {
  res.send("✅ GRSIX AI Unified Server is running!");
});

import "./callScheduler.js";

// ✅ Serve frontend build from /frontend/dist
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});


server.listen(port, () => {
  console.log(`🚀 Unified server running at http://localhost:${port}`);
});

export default app;
