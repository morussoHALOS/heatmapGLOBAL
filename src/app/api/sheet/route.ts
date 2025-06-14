import { google } from "googleapis";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Try to load credentials from env, else fallback to credentials.json
async function getCredentials() {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      type: "service_account",
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else {
    const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
    const file = await fs.readFile(CREDENTIALS_PATH, "utf8");
    return JSON.parse(file);
  }
}

export async function GET() {
  try {
    const credentials = await getCredentials();

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Adjust this to match your sheet ID and desired range
    const spreadsheetId = "1drWGCdEFUyWvGWiBV68SLf0dlNALSMl2j1IQozbN8oM";
    const range = "Companies!A3:1000"; // headers in row 3, data starts row 4

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    let data = [];

    if (rows && rows.length > 1) {
      const headers = rows[0];
      data = rows.slice(1).map((row) =>
        Object.fromEntries(headers.map((k, i) => [k, row[i] ?? ""]))
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error loading Google Sheet:", error);
    return NextResponse.json({ error: "Failed to fetch Google Sheet data." }, { status: 500 });
  }
}
