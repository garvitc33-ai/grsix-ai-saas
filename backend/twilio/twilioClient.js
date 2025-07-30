import twilio from "twilio";

// Load environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const baseUrl = process.env.NGROK_URL; // or your public webhook base URL

// Validation
if (!accountSid || !authToken || !twilioNumber || !baseUrl) {
  throw new Error("Missing one or more required environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, NGROK_URL");
}

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Export Twilio client and number
export { client, twilioNumber };

/**
 * Initiates a conversational AI voice call via Twilio.
 * @param {string} agentId - ID of the AI agent (used in webhook route).
 * @param {string} phone - Phone number to call (must include country code).
 * @returns {Promise<string>} - The Twilio Call SID if successful.
 */
export async function callWithAgent(agentId, phone) {
  try {
    const call = await client.calls.create({
      to: phone,
      from: twilioNumber,
      url: `${baseUrl}/api/twilio/${agentId}`, // Webhook that starts the conversation
      method: "POST",
    });

    console.log(`✅ Conversational AI call initiated to ${phone}: ${call.sid}`);
    return call.sid;
  } catch (error) {
    console.error("❌ Failed to initiate AI call:", error.message);
    throw error;
  }
}
