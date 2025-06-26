"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

type MarkerData = {
  arr: number;
  name: string;
  phone?: string;
  address: string;
  lat: number;
  lon: number;
};

type RawRow = {
  NAME: string;
  "Full Address": string;
  "MAXIO  LOCAL ARR AT END OF MONTH  C": string;
  Lat: string;
  Lon: string;
  "Phone Number"?: string;
};

export default function HomePage() {
  const [data, setData] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const res = await fetch("/api/sheet");
        const json = await res.json();

        console.log("🧪 API JSON:", json);

        if (!res.ok || !json.data) {
          console.error("❌ API returned error:", json.error || "No data");
          return;
        }

        const parsedMarkers = (json.data as RawRow[]).map((row) => {
          const lat = Number(row.Lat);
          const lon = Number(row.Lon);

          return {
            name: row.NAME || "Unknown",
            address: row["Full Address"] || "",
            arr: Number(row["MAXIO  LOCAL ARR AT END OF MONTH  C"]) || 0,
            lat,
            lon,
            phone: row["Phone Number"] || "",
          };
        }).filter(
          (row: MarkerData) =>
            !isNaN(row.lat) &&
            !isNaN(row.lon)
        );

        console.log("📍 Parsed Markers:", parsedMarkers);
        setData(parsedMarkers);
      } catch (err) {
        console.error("❌ Fetch error:", (err as Error).message);
      } finally {
        setLoading(false);
        console.log("✅ Done loading");
      }
    };

    fetchMarkers();
  }, []);

  if (loading) return <div className="p-4">Loading map…</div>;
  if (!data.length) return <div className="p-4 text-red-500">No map data found. Check console.</div>;

  return (
    <div className="relative w-full h-screen">
      <div className="flex justify-center">
        <Button className="mx-auto mt-4 z-[9000]" variant="title">
          HALOS Global Heatmap
        </Button>
      </div>

      <Button
        className="bg-orange-500 text-white absolute bottom-5 right-2 z-[9000]"
        variant="ghost"
        onClick={() => window.location.reload()}
      >
        Update Map
      </Button>

      <LeafletMap data={data} />
    </div>
  );
}
