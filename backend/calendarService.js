// backend/calendarService.js
import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import os from "os"; // Required to get user's home directory

const secretsDir = path.join(os.homedir(), "grsix-secrets");
const CREDENTIALS_PATH = path.join(secretsDir, "client_secret.json");
const TOKEN_PATH = path.join(secretsDir, "token.json");
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/**
 * Authorize a Google OAuth2 client using stored credentials and tokens.
 * If no token is found, throws an error with the authorization URL.
 */
export async function authorize() {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, "utf-8");
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    try {
      const tokenContent = await fs.readFile(TOKEN_PATH, "utf-8");
      const token = JSON.parse(tokenContent);
      oAuth2Client.setCredentials(token);
      return oAuth2Client;
    } catch (_err) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
      });
      console.log("🔐 Open this URL in your browser:", authUrl);
      throw new Error(
        "No token found. Please authorize first by visiting the above URL and providing the code."
      );
    }
  } catch (err) {
    console.error("❌ Error loading client secret or token:", err.message);
    throw err;
  }
}

/**
 * Exchanges authorization code for access tokens and stores them.
 * @param {google.auth.OAuth2} oAuth2Client
 * @param {string} code The authorization code returned from Google's OAuth2 consent screen.
 */
export async function getAccessToken(oAuth2Client, code) {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
    console.log("✅ Token saved to", TOKEN_PATH);
  } catch (err) {
    console.error("❌ Error retrieving access token", err.message);
    throw err;
  }
}

/**
 * Creates a calendar event on the primary calendar using authorized OAuth2 client.
 * @param {google.auth.OAuth2} auth The authorized OAuth2 client.
 * @param {string} summary Event title.
 * @param {string} description Event description.
 * @param {string} startDateTime ISO string for event start.
 * @param {string} endDateTime ISO string for event end.
 */
export async function createCalendarEvent(
  auth,
  summary,
  description,
  startDateTime,
  endDateTime
) {
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary,
    description,
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Kolkata",
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    console.log("📅 Event created:", res.data.htmlLink);
    return res.data;
  } catch (err) {
    console.error("❌ Error creating calendar event:", err.message);
    throw err;
  }
}
