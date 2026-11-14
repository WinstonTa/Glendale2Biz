"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

export default function SiteMap({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  return (
    <MapContainer
      key={`${lat},${lon}`}
      center={[lat, lon]}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[lat, lon]}
        radius={11}
        pathOptions={{ color: "#084536", weight: 3, fillColor: "#d4930f", fillOpacity: 0.95 }}
      >
        <Tooltip direction="top" offset={[0, -10]} permanent>
          {label}
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
