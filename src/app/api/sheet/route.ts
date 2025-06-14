import { NextResponse } from "next/server";
import { google } from "googleapis";
import path from "path";
import fs from "fs/promises";

export async function GET() {
  try {
    const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
    const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, "utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // --- Range starts at row 2, headers in row 2 ---
    const spreadsheetId = "1drWGCdEFUyWvGWiBV68SLf0dlNALSMl2j1IQozbN8oM";
    const range = "Companies!A2:L1000";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    let data = [];
    if (rows && rows.length > 1) {
      const headers = rows[0];        // <-- row 2: column headers
      data = rows.slice(1).map(row =>
        Object.fromEntries(headers.map((k, l) => [k, row[l] ?? ""]))
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch Google Sheet data." }, { status: 500 });
  }
}
