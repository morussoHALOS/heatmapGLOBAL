"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
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

export default function HomePage() {
  const [data, setData] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sheet")
      .then((res) => res.json())
      .then((json) => {
        console.log("🧪 API JSON:", json);

        if (json.data?.length > 0) {
          console.log("🔍 Sample Keys:", Object.keys(json.data[0]));
          console.log("🔍 Sample Row:", json.data[0]);
        }

        // ✅ API already returns fully parsed data
        const markers = json.data.filter(
          (row: MarkerData) =>
            typeof row.lat === "number" &&
            !isNaN(row.lat) &&
            typeof row.lon === "number" &&
            !isNaN(row.lon)
        );

        console.log("📍 Parsed Markers:", markers);
        setData(markers);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Fetch failed", err);
        setLoading(false);
        setData([]);
      });
  }, []);

  if (loading) return <div className="p-4">Loading map…</div>;
  if (!data.length) return <div className="p-4">No map data found.</div>;

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
      >
        Update Map
      </Button>

      <LeafletMap data={data} />
    </div>
  );
}
