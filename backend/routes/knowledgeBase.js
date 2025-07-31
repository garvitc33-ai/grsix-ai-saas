import express from "express";
import multer from "multer";
import fs from "fs";
import { extractWebsiteText } from "../scraper.js";
import {
  saveKnowledgeBase,
  getAllKnowledgeBases,
  getKnowledgeBaseByName,
  getKnowledgeBaseById,
  updateKnowledgeBaseByName,
} from "../models/knowledgeBase.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// === Utility: Clean company name ===
function sanitizeCompanyName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "");
}

// === 1️⃣ Upload KB from File ===
router.post("/upload", upload.single("file"), async (req, res) => {
  const { companyName } = req.body;
  const file = req.file;

  if (!companyName || !file) {
    return res.status(400).json({ error: "Company name and file are required" });
  }

  try {
    const content = fs.readFileSync(file.path, "utf-8");
    await saveKnowledgeBase({
      name: companyName,
      source_type: "manual",
      content,
    });
    fs.unlinkSync(file.path); // cleanup
    res.status(200).json({ message: "✅ Knowledge base uploaded successfully" });
  } catch (err) {
    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); // fail-safe cleanup
    res.status(500).json({ error: "Failed to save knowledge base" });
  }
});

// === 2️⃣ Generate KB by Scraping Website ===
router.post("/generate", async (req, res) => {
  const { companyName, website } = req.body;
  if (!companyName || !website) {
    return res.status(400).json({ error: "Company name and website are required" });
  }

  try {
    const scrapedText = await extractWebsiteText(website);
    await saveKnowledgeBase({
      name: companyName,
      source_type: "website",
      content: scrapedText,
    });
    res.status(200).json({ message: "✅ Knowledge base generated", content: scrapedText });
  } catch (err) {
    console.error("❌ Scraping failed:", err.message);
    res.status(500).json({ error: "Failed to extract or save website content" });
  }
});

// === 3️⃣ Get All KBs ===
router.get("/", async (req, res) => {
  try {
    const data = await getAllKnowledgeBases();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch knowledge bases" });
  }
});

// === 4️⃣ Get KB by Company Name ===
router.get("/:companyName", async (req, res) => {
  try {
    const data = await getKnowledgeBaseByName(req.params.companyName);
    if (!data) return res.status(404).json({ error: "Knowledge base not found" });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch knowledge base" });
  }
});

// === 5️⃣ Get KB by ID ===
router.get("/id/:id", async (req, res) => {
  try {
    const data = await getKnowledgeBaseById(req.params.id);
    if (!data) return res.status(404).json({ error: "Knowledge base not found" });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch knowledge base" });
  }
});

// === 6️⃣ Update KB by Company Name ===
router.post("/:companyName", async (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Invalid content" });
  }

  try {
    await updateKnowledgeBaseByName(req.params.companyName, content);
    res.status(200).json({ message: "✅ Knowledge base updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update knowledge base" });
  }
});

// === 7️⃣ Save AI-Generated KB Directly ===
router.post("/save-ai", async (req, res) => {
  const { companyName, content } = req.body;
  if (!companyName || !content) {
    return res.status(400).json({ error: "Company name and content are required" });
  }

  try {
    await saveKnowledgeBase({
      name: companyName,
      source_type: "website",
      content,
    });
    res.status(200).json({ message: "✅ AI knowledge base saved successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save AI-generated knowledge base" });
  }
});

export default router;
