"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

// Plain Leaflet with explicit cleanup: survives React StrictMode double effects and remounts
// (react-leaflet threw "Map container is being reused" in dev).
export default function SiteMap({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const map = L.map(node, { center: [lat, lon], zoom: 16, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    L.circleMarker([lat, lon], { radius: 11, color: "#084536", weight: 3, fillColor: "#d4930f", fillOpacity: 0.95 })
      .bindTooltip(label, { direction: "top", offset: [0, -10], permanent: true })
      .addTo(map);
    return () => {
      map.remove();
    };
  }, [lat, lon, label]);

  return <div ref={el} style={{ height: "100%", width: "100%" }} />;
}
