import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = "Companies!A2:L";

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    privateKey = privateKey.replace(/\\n/g, "\n");

    const jwt = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth: jwt });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values ?? [];
    if (values.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const [headers, ...rows] = values;
    const structured: Record<string, string>[] = rows.map((row: string[]) =>
      Object.fromEntries(headers.map((key, i) => [key, row[i] ?? ""]))
    );

    const excludedHeaders = ["MAXIO  CUSTOMER STATUS  C", "PHONE", "CITY", "ADDRESS"];

    const cleaned = structured.map((row) => {
      const filteredRow: Record<string, string> = {};
      for (const key in row) {
        if (!excludedHeaders.includes(key)) {
          filteredRow[key] = row[key];
        }
      }
      return filteredRow;
    });

    return NextResponse.json({ data: cleaned });
  } catch (err) {
    const error = err as Error;
    console.error("❌ Sheets API Error:", error.message);
    return NextResponse.json({ error: "Failed to load sheet", details: error.message }, { status: 500 });
  }
}
