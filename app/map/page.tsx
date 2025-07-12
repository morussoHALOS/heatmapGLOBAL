"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import type { Map as LeafletMap } from "leaflet";
import ArrLegend from "@/components/ArrLegend";
import StatesLegend, { computeRegionStats, StateGroupItem } from "@/components/StatesLegend";

// Dynamic import of the HeatMap component (SSR disabled)
const HeatMap = dynamic(() => import("@/components/HeatMap"), {
  ssr: false,
});

// Dynamic import of StateOverlayLayer to prevent SSR issues
const StateOverlayLayer = dynamic(
  () => import("@/components/HeatMap").then((mod) => ({ default: mod.StateOverlayLayer })),
  { ssr: false }
);

// Tiers for ARR categorization
const tiers = [
  { label: "≥ $100K", color: "bg-purple-500", min: 100000, max: Infinity },
  { label: "$50K-100K", color: "bg-red-500", min: 50000, max: 99999.99 },
  { label: "$25K-$50K", color: "bg-orange-500", min: 25000, max: 49999.99 },
  { label: "$10K-$25K", color: "bg-yellow-500", min: 10000, max: 24999.99 },
  { label: "≤ $10K", color: "bg-green-500", min: 0, max: 9999.99 },
];

// Define the structure of marker data
type MarkerData = {
  arr: number;
  name: string;
  phone: string;
  address: string;
  lat: number;
  lon: number;
  state: string;
  companyId: string;
};

// For handling incoming data format
type RawRow = {
  NAME?: string;
  "Full Address"?: string;
  "MAXIO  LOCAL ARR AT END OF MONTH  C"?: string;
  Lat?: string;
  Lon?: string;
  "Phone Number"?: string;
  "STATE": string;
  "HS OBJECT ID": string;
};

export default function MapPage() {
  // State management for various aspects of the map
  const [showRegionOverlay, setShowRegionOverlay] = useState(false);
  const [stats, setStats] = useState<StateGroupItem[]>([]);
  const [data, setData] = useState<MarkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [legendItems, setLegendItems] = useState<
    { label: string; color: string; accounts: number; tierSum: string }[]
  >([]);
  const [activeTierLabels, setActiveTierLabels] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  const center: [number, number] = [37.0902, -95.7129]; // Center of the US
  const mapRef = useRef<LeafletMap | null>(null);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to center the map on the US
  const centerOnUS = (zoomLevel = 5) => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoomLevel, {
        animate: true,
      });
    }
  };

  // Handle clicks on tier labels (used for filtering)
  const handleTierClick = (label: string) => {
    setActiveTierLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  // Reset all active filters for tiers
  const handleResetTiers = () => {
    setActiveTierLabels([]);
  };

  // Fetching the data
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch("/api/sheet");
        const json = await res.json();

        if (!res.ok || !json.data) {
          const errorMessage = json.error || "No data available";
          console.error("❌ API returned error:", errorMessage);
          setError(errorMessage);
          return;
        }

        const parsedMarkers = (json.data as RawRow[])
          .map((row, index) => {
            const lat = Number(row.Lat);
            const lon = Number(row.Lon);
            const arrRaw = row["MAXIO  LOCAL ARR AT END OF MONTH  C"];
            const arr = Number(arrRaw);
            const name = row.NAME || "";
            const address = row["Full Address"] || "";
            const state = row.STATE || "";
            const phone = row["Phone Number"] || "";
            const companyId = row["HS OBJECT ID"] || "";

            // More robust validation
            if (!name.trim() || !address.trim() || isNaN(lat) || isNaN(lon) || isNaN(arr) || arr < 0) {
              console.warn("❌ Skipped row", index + 3, {
                name,
                address,
                lat,
                lon,
                arrRaw,
              });
              return null;
            }

            return {
              name: name.trim(),
              address: address.trim(),
              arr,
              lat,
              lon,
              phone: phone.trim(),
              state: state.trim(),
              companyId,
            };
          })
          .filter((row): row is MarkerData => row !== null);

        console.log("✅ Final marker count:", parsedMarkers.length);
        setData(parsedMarkers);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("❌ Fetch error:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkers();
  }, []);

  // Calculate stats and update legends when data changes
  useEffect(() => {
    if (!data.length) return;

    const stats = tiers.map((tier) => {
      const matches = data.filter(
        (c) => c.arr >= tier.min && c.arr <= tier.max
      );
      return {
        label: tier.label,
        color: tier.color,
        accounts: matches.length,
        tierSum: matches.reduce((acc, c) => acc + c.arr, 0).toLocaleString(),
      };
    });

    console.log("🟢 Updated legend items:", stats);
    setLegendItems(stats);

    const regionalStats = computeRegionStats(
      data.map((entry) => ({
        STATE: entry.state,
        "MAXIO  LOCAL ARR AT END OF MONTH  C": entry.arr.toString(),
      }))
    );

    setStats(regionalStats);
  }, [data]);

  // Don't render anything until mounted on client
  if (!isMounted) {
    return <div className="p-4">Initializing map...</div>;
  }

  if (loading) return <div className="p-4">Loading map...</div>;
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading map data: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!data.length) {
    return <div className="p-4 text-red-500">No map data found. Check console for details.</div>;
  }

  // Filter data based on active tiers
  const filteredData = activeTierLabels.length
    ? data.filter((c) => {
        const tier = tiers.find((t) => c.arr >= t.min && c.arr <= t.max);
        return tier && activeTierLabels.includes(tier.label);
      })
    : data;

  return (
    <div className="relative w-full h-screen">
      <div className="flex justify-center">
        <Button className="mx-auto mt-3 z-[9000]" variant="title">
          HALOS Global Heatmap
        </Button>
      </div>

      {/* US button to center map */}
      <Button
        className="bg-orange-500 text-white absolute bottom-5 right-2 z-[9000] cursor-pointer hover:bg-orange-600"
        variant="ghost"
        onClick={() => centerOnUS(5)}
      >
        US
      </Button>

      {/* Reset filters button */}
      <Button
        className="bg-gray-200 text-black absolute bottom-46 left-5 z-[9999] cursor-pointer hover:bg-gray-300"
        size="sm"
        variant="ghost"
        onClick={handleResetTiers}
      >
        Reset Filters
      </Button>

      {/* Toggle Region Overlay */}
      <Button
        className="absolute top-12 left-12 z-[9999] cursor-pointer"
        size="md"
        variant="ghost"
        onClick={() => setShowRegionOverlay((prev) => !prev)}
      >
        Toggle Region Overlay
      </Button>
      
      <HeatMap
        data={filteredData}
        mapRef={mapRef}
      >
        {showRegionOverlay && <StateOverlayLayer />}
      </HeatMap>

      {/* ARR Legend and Region Stats */}
      <ArrLegend
        items={legendItems}
        onTierClick={handleTierClick}
        activeLabels={activeTierLabels}
      />
      <StatesLegend items={stats} />
    </div>
  );
}