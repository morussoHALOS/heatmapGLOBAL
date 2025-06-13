import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import fs from "fs/promises";

export async function GET(req: NextRequest) {
  try {
    // Load service account credentials
    const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
    const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, "utf8"));

    // Authorize
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // --- Replace these with your actual spreadsheet info ---
    const spreadsheetId = "1drWGCdEFUyWvGWiBV68SLf0dlNALSMl2j1IQozbN8oM";
    const range = "HS/company_lists/04Jun!A1:J1000"; 

    // Fetch sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    // Optional: Convert to array of objects with headers
    let data = [];
    if (rows && rows.length > 1) {
      const headers = rows[0];
      data = rows.slice(1).map(row =>
        Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]))
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch Google Sheet data." }, { status: 500 });
  }
}
