import { google } from "googleapis";
import { JWT } from "google-auth-library";
import * as fs from "fs";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = "token.json"; // You can change this path as needed

async function loadCredentials(): Promise<JWT> {
  try {
    const keyContent = fs.readFileSync("service-account-key.json");
    const key = JSON.parse(keyContent.toString());

    const jwtClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: SCOPES,
    });

    await jwtClient.authorize();
    return jwtClient;
  } catch (error) {
    console.error("Error loading service account key:", error);
    throw error;
  }
}

export { loadCredentials };
