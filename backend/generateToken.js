import { authorize, getAccessToken } from "./calendarService.js";
import readline from "readline";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import process from "process";

// Constants
const CREDENTIALS_PATH = path.join(process.cwd(), "client_secret.json");
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  try {
    // Attempt to authorize using existing token
    await authorize();
    console.log("✅ Authorized successfully!");
    rl.close();
  } catch (err) {
    console.log("⚠️ No valid token found. Starting OAuth flow...");

    // Load credentials
    let credentials;
    try {
      credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
    } catch (e) {
      console.error("❌ Could not read client_secret.json file.");
      rl.close();
      process.exit(1);
    }

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log("🔐 Open this URL in your browser:\n", authUrl);

    rl.question("Paste the code from the browser here: ", async (code) => {
      try {
        await getAccessToken(oAuth2Client, code);
        console.log("✅ Token saved successfully.");
      } catch (err) {
        console.error("❌ Failed to get access token:", err.message);
      } finally {
        rl.close();
      }
    });
  }
})();
