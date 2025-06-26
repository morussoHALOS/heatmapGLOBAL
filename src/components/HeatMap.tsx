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

type MarkerData = {
  name: string;
  address: string;
  arr: number;
  lat: number;
  lon: number;
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
}: {
  data: MarkerData[];
  mapRef: MutableRefObject<LeafletMapType | null>;
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
                <div style={{ fontWeight: 600, fontSize: 16 }}>{row.name}</div>
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
