"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MarkerData = {
  name: string;
  address: string; // from "Full Address" (column J)
  arr: number;     // from "MAXIO  LOCAL ARR AT END OF MONTH  C" (column B)
  lat: number;     // from column K
  lon: number;     // from column L
  phone?: string;  // from column D (or I)
};

function getMarkerColor(arr: number): string {
  if (arr <= 10000) return "green";
  if (arr <= 25000) return "yellow";
  if (arr <= 50000) return "orange";
  if (arr <= 100000) return "red";
  return "purple";
}

export default function LeafletMap({ data }: { data: MarkerData[] }) {
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
        center={[37.0902, -95.7129]} // Center of USA
        zoom={5}
        minZoom={5}
        maxZoom={12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {validData.map((row, i) => (
          <CircleMarker
            key={i}
            center={[row.lat, row.lon]}
            radius={6 + Math.log1p(row.arr) * 0.5}
            pathOptions={{
              color: getMarkerColor(row.arr),
              fillColor: getMarkerColor(row.arr),
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div style={{ minWidth: 180, maxWidth: 240, padding: 8 }}>
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
