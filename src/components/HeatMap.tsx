"use client";

import { useEffect } from "react";
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup 
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMapType } from "leaflet";
import { useMap } from "react-leaflet";
import { useState } from "react";
import type { MutableRefObject } from "react";

import { GeoJSON } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import { REGION_MAP } from "@/lib/region-utils";
import { STATE_ABBREVIATIONS } from "@/lib/state-utils";

type MarkerData = {
  name: string;
  address: string;
  arr: number;
  lat: number;
  lon: number;
  companyId: string;
  phone?: string;
};

function getMarkerColor(arr: number): string {
  if (arr <= 10000) return "green";
  if (arr <= 25000) return "yellow";
  if (arr <= 50000) return "orange";
  if (arr <= 100000) return "red";
  return "purple";
}

function getPaneForArr(arr: number): string {
  if (arr > 100000) return "arr-purple";
  if (arr > 50000) return "arr-red";
  if (arr > 25000) return "arr-orange";
  if (arr > 10000) return "arr-yellow";
  return "arr-green";
}

function getStateColorByRegion(state: string): string {
  // First, check if the state is already an abbreviation (2 chars).
  const upper = state.trim().toUpperCase();
  let abbr = upper.length === 2 ? upper : STATE_ABBREVIATIONS[upper];

  // If no abbreviation was found, use the full state name to look it up
  if (!abbr) {
    abbr = upper; // fall back to using the original state name as abbreviation if not found
  }

  const region = REGION_MAP[abbr]; // Now using abbreviation for region matching

  switch (region) {
    case "Carolina":
      return "red";    // Carolina = red
    case "Chiara":
      return "blue";   // Chiara = blue
    case "Arash":
      return "green";  // Arash = green
    case "International":
      return "purple"; // International can be purple (if applicable)
    default:
      return "gray";   // Default color for undefined regions
  }
}


export function StateOverlayLayer() {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch("/data/us-states.geo.json")
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  if (!geojson) return null;

  // Styling function to set fillColor based on region
  const style = (feature: any) => {
    const stateName = feature.properties.NAME;  // Get state name from GeoJSON
    const upperState = stateName.trim().toUpperCase();
    
    // Convert full state name to abbreviation if needed
    let abbr = upperState.length === 2 ? upperState : STATE_ABBREVIATIONS[upperState];
    
    // If STATE_ABBREVIATIONS doesn't have the mapping, create a fallback
    if (!abbr) {
      // Common state name to abbreviation mappings as fallback
      const fallbackMappings: { [key: string]: string } = {
        "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
        "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
        "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
        "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
        "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
        "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS",
        "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
        "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
        "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
        "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
        "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT",
        "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV",
        "WISCONSIN": "WI", "WYOMING": "WY"
      };
      
      abbr = fallbackMappings[upperState];
      
      if (!abbr) {
        console.warn(`❌ No abbreviation found for state: "${stateName}"`);
        return {
          fillColor: "gray",
          weight: 1,
          opacity: 0.7,
          color: "#ffffff",
          fillOpacity: 0.5,
        };
      }
    }

    // Get region from abbreviation
    const region = REGION_MAP[abbr];
    
    if (!region) {
      console.warn(`❌ Region not found for state: "${stateName}" (abbr: "${abbr}")`);
      return {
        fillColor: "gray",
        weight: 1,
        opacity: 0.7,
        color: "#ffffff",
        fillOpacity: 0.5,
      };
    }

    // Determine color based on region
    let color = "gray"; // default
    switch (region) {
      case "Carolina":
        color = "red";
        break;
      case "Chiara":
        color = "blue";
        break;
      case "Arash":
        color = "green";
        break;
      case "International":
        color = "purple";
        break;
      default:
        color = "gray";
    }

    return {
      fillColor: color,
      weight: 1,
      opacity: 0.7,
      color: "#ffffff",  // Border color
      fillOpacity: 0.5,  // Transparency
    };
  };

  return (
    <GeoJSON
      data={geojson}
      style={style}
    />
  );
}



// Component to create panes once map is ready
function SetupPanes() {
  const map = useMap();

  useEffect(() => {
    const panes = [
      { name: "arr-purple", zIndex: 650 },
      { name: "arr-red", zIndex: 640 },
      { name: "arr-orange", zIndex: 630 },
      { name: "arr-yellow", zIndex: 620 },
      { name: "arr-green", zIndex: 610 },
    ];

    panes.forEach(({ name, zIndex }) => {
      if (!map.getPane(name)) {
        map.createPane(name);
        map.getPane(name)!.style.zIndex = zIndex.toString();
      }
    });
  }, [map]);

  return null;
}

export default function HeatMap({
  data,
  mapRef,
  children,
}: {
  data: MarkerData[];
  mapRef: MutableRefObject<LeafletMapType | null>;
  children?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMounted(true);
    }
  }, []);

  if (!mounted) return null;

  const validData = data.filter(
    (row) =>
      typeof row.lat === "number" &&
      !isNaN(row.lat) &&
      typeof row.lon === "number" &&
      !isNaN(row.lon)
  );

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[37.0902, -95.7129]}
        zoom={5}
        minZoom={5}
        maxZoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
      >


        <SetupPanes />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {children}

        {validData.map((row, i) => (
          <CircleMarker
            key={i}
            center={[row.lat, row.lon]}
            radius={6 + Math.log1p(row.arr) * 0.5}
            pane={getPaneForArr(row.arr)}
            pathOptions={{
              color: getMarkerColor(row.arr),
              fillColor: getMarkerColor(row.arr),
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div style={{ minWidth: 120, maxWidth: 180, padding: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  <a
                  href={`https://app-eu1.hubspot.com/contacts/25618776/record/0-2/${row.companyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline', color: 'orange' }}
                  >
                    {row.name}
                  </a>
                  </div>
                <div style={{ fontSize: 13, margin: "4px 0" }}>{row.address}</div>
                <div style={{ fontSize: 13 }}>
                  <b>Phone:</b> {row.phone || "N/A"}
                </div>
                <div style={{ fontSize: 14, color: "#b10000", marginTop: 4 }}>
                  <b>ARR:</b> ${row.arr.toLocaleString()}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
