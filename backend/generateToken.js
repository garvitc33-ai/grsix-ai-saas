import { authorize, getAccessToken } from "./calendarService.js";
import readline from "readline";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Copied from calendarService.js
const CREDENTIALS_PATH = path.join(process.cwd(), "client_secret.json");
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Try authorize (with token), else start OAuth flow
try {
  const auth = await authorize();
  // If no error, we're done!
  console.log("✅ Authorized successfully!");
  rl.close();
} catch (err) {
  // Prepare oAuth2Client so we don't call authorize() again
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
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

  console.log("🔐 Open this URL in your browser:", authUrl);

  rl.question("Paste the code from the browser here: ", async (code) => {
    await getAccessToken(oAuth2Client, code);
    rl.close();
  });
}
