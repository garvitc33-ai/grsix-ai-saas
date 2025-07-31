// backend/routes/schedule.js
import express from "express";
import { addScheduledCall } from "../models/scheduled_calls.js";
import { generateScript } from "../ai.js";
import { authorize, createCalendarEvent } from "../calendarService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { customerName, phoneNumber, scheduledTime, companyName, knowledgeBase } = req.body;

    if (!customerName || !phoneNumber || !scheduledTime || !companyName || !knowledgeBase) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1. Generate the AI script
    const script = await generateScript(knowledgeBase, companyName);

    // 2. Create Google Calendar event
    const auth = await authorize();
    const startTime = new Date(scheduledTime).toISOString();
    const endTime = new Date(new Date(scheduledTime).getTime() + 30 * 60 * 1000).toISOString();
    await createCalendarEvent(auth, `Call with ${customerName}`, script, startTime, endTime);

    // 3. Save the scheduled call
    const savedId = await addScheduledCall({
      customerName,
      phoneNumber,
      scheduledTime,
      script,
    });

    res.json({ message: "Call scheduled!", id: savedId });
  } catch (err) {
    console.error("❌ Error scheduling call:", err.message);
    res.status(500).json({ error: err.message || "Failed to schedule call" });
  }
});

export default router;
