"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import type { Map as LeafletMap } from "leaflet";
import ArrLegend from "@/components/ArrLegend";

const HeatMap = dynamic(() => import("@/components/HeatMap"), {
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
  const companyCount = 100;
  const [legendItems, setLegendItems] = useState<
  { label: string; color: string; accounts: number; tierSum: string }[]
  >([]);
  const center: [number, number] = [37.0902, -95.7129];
  const mapRef = useRef<LeafletMap | null>(null);


  const centerOnMap = () => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom(), {
        animate: true,
      });
    }
  };


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
        // Step 1: Save parsed markers
        setData(parsedMarkers);

        // Step 2: Define ARR brackets
        const tiers = [
          { label: "≥ $100K", color: "bg-purple-500", min: 100000, max: Infinity },
          { label: "$50K-100K", color: "bg-red-500", min: 50000, max: 99999.99 },
          { label: "$25K-$50K", color: "bg-orange-500", min: 25000, max: 49999.99 },
          { label: "$10K-$25K", color: "bg-yellow-500", min: 10000, max: 24999.99 },
          { label: "≤ $10K", color: "bg-green-500", min: 0, max: 9999.99 },
        ];

        // Step 3: Compute stats
        const stats = tiers.map(tier => {
          const matches = parsedMarkers.filter(c => c.arr >= tier.min && c.arr <= tier.max);
          return {
            label: tier.label,
            color: tier.color,
            accounts: matches.length,
            tierSum: matches.reduce((acc, c) => acc + c.arr, 0).toLocaleString(),
          };
        });

        setLegendItems(stats);
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
        <Button 
          className="mx-auto mt-3 z-[9000]" 
          variant="title"
        >
          HALOS Global Heatmap
        </Button>
      </div>

      <Button
        className="bg-orange-500 text-white absolute bottom-5 right-2 z-[9000]"
        variant="ghost"
        onClick={centerOnMap}
      >
        Center
      </Button>
        
      <HeatMap data={data} mapRef={mapRef} />
      <ArrLegend items={legendItems}/>
    </div>
  );
}
