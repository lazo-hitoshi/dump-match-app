"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { MapMarker } from "@/types/map";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/types/map";
import "leaflet/dist/leaflet.css";

type LocationMapProps = {
  markers: MapMarker[];
  className?: string;
};

function markerIcon(kind: MapMarker["kind"], selected: boolean): L.DivIcon {
  const color = kind === "site" ? "#17856a" : "#3978b8";
  const ring = selected ? "outline:4px solid rgba(245,184,71,0.45);" : "";
  return L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:34px;height:34px;border-radius:50%;border:2px solid #fff;background:${color};color:#fff;font-size:11px;font-weight:900;box-shadow:0 8px 18px rgba(23,32,37,0.18);${ring}">${kind === "site" ? "現" : "ダ"}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export function LocationMap({ markers, className }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
    }).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (markers.length === 0) return;

    const bounds = L.latLngBounds([]);

    for (const marker of markers) {
      const latLng = L.latLng(marker.lat, marker.lng);
      bounds.extend(latLng);

      const leafletMarker = L.marker(latLng, {
        icon: markerIcon(marker.kind, false),
        title: marker.name,
      });

      const popup = `
        <strong>${marker.name}</strong>
        ${marker.sublabel ? `<br><span style="font-size:12px;color:#60717b">${marker.sublabel}</span>` : ""}
        ${marker.href ? `<br><a href="${marker.href}" style="font-size:12px">詳細を開く</a>` : ""}
      `;
      leafletMarker.bindPopup(popup);
      leafletMarker.addTo(layer);
    }

    if (markers.length === 1) {
      map.setView(bounds.getCenter(), 13);
    } else {
      map.fitBounds(bounds.pad(0.15), { maxZoom: 13 });
    }
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={className ?? "leaflet-map-canvas"}
      role="region"
      aria-label="現場とダンプの地図"
    />
  );
}
