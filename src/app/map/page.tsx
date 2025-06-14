"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

// Dynamically import LeafletMap with no SSR
const LeafletMap = dynamic(() => import("../../components/LeafletMap"), {
  ssr: false,
});

type MarkerData = {
  name: string;
  address: string;
  arr: number;
  lat: number;
  lon: number;
  phone?: string;
};

// Convert sheet rows into clean MarkerData
function convertSheetToMarkers(sheetData: Record<string, string>[]): MarkerData[] {
  return (sheetData || [])
    .map((row) => ({
      name: row["NAME"] || "Unknown",
      address: row["Full Address"] || "",
      arr: Number(row["MAXIO  LOCAL ARR AT END OF MONTH  C"]) || 0,
      lat: Number(row["Lat"]),
      lon: Number(row["Lon"]),
      phone: row["Phone Number"] || row["PHONE"] || "",
    }))
    .filter(
      (row) =>
        typeof row.lat === "number" &&
        !isNaN(row.lat) &&
        typeof row.lon === "number" &&
        !isNaN(row.lon)
    );
}

export default function MapPage() {
  const [data, setData] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sheet")
      .then((res) => res.json())
      .then((json) => {
        setData(convertSheetToMarkers(json.data));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setData([]);
      });
  }, []);

  if (loading) return <div className="p-4">Loading map…</div>;
  if (!data.length) return <div className="p-4">No map data found.</div>;

  return (
    <div className="relative w-full h-screen">
        <div className="flex justify-center">
            <Button className="mx-auto mt-4 opacity-500 z-[9000]" variant="title">
                HALOS Global Heatmap
            </Button>
        </div>

      <Button
        className="bg-orange-500 text-white absolute bottom-5 right-2 z-[9000]"
        variant="ghost"
      >
        Update Map
      </Button>
      <LeafletMap data={data} />
    </div>
  );
}
