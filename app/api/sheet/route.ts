import { google } from "googleapis";
import { readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Load credentials from JSON file
    const credsPath = path.join(process.cwd(), "credentials.json");
    const creds = JSON.parse(readFileSync(credsPath, "utf-8"));

    // Create JWT auth client
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Verify access token works (optional debug)
    const token = await auth.getAccessToken();
    console.log("✅ Access Token:", token);

    const sheets = google.sheets({ version: "v4", auth });

    // ✅ Your actual spreadsheet ID
    const spreadsheetId = "1drWGCdEFUyWvGWiBV68SLf0dlNALSMl2j1IQozbN8oM";
    const range = "Companies!A2:Z"; // start from row 2 to skip header if needed

    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const [header, ...rows] = res.data.values || [];

    const data = rows.map((row) => {
      const obj: Record<string, string> = {};
      header.forEach((col, i) => {
        obj[col] = row[i] || "";
      });
      return obj;
    });

    const markers = data
      .map((row) => ({
        name: row["NAME"] || "Unknown",
        address: row["Full Address"] || "",
        phone: row["Phone Number"] || row["PHONE"] || "",
        arr: Number(row["MAXIO  LOCAL ARR AT END OF MONTH  C"]) || 0,
        lat: Number(row["Lat"]),
        lon: Number(row["Lon"]),
      }))
      .filter((r) => !isNaN(r.lat) && !isNaN(r.lon));

    return NextResponse.json({ data: markers });
  } catch (err) {
    console.error("❌ Error loading sheet:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: "Failed to load sheet", details: message }, { status: 500 });
  }
}
