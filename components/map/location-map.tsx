"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { MapMarker, MapViewport } from "@/types/map";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/types/map";
import "leaflet/dist/leaflet.css";

type LocationMapProps = {
  markers: MapMarker[];
  className?: string;
  viewport?: MapViewport | null;
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

export function LocationMap({ markers, className, viewport }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const initialCenter = viewport?.center ?? DEFAULT_MAP_CENTER;
  const initialZoom = viewport?.zoom ?? DEFAULT_MAP_ZOOM;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
    }).setView(initialCenter, initialZoom);

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
      circleRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (viewport?.radiusKm && viewport.center) {
      circleRef.current = L.circle(viewport.center, {
        radius: viewport.radiusKm * 1000,
        color: "#3978b8",
        weight: 2,
        fillColor: "#3978b8",
        fillOpacity: 0.08,
      }).addTo(map);
    }
  }, [viewport]);

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
      map.setView(bounds.getCenter(), viewport?.zoom ?? 13);
    } else {
      map.fitBounds(bounds.pad(0.15), { maxZoom: viewport?.zoom ?? 13 });
    }
  }, [markers, viewport?.zoom]);

  return (
    <div
      ref={containerRef}
      className={className ?? "leaflet-map-canvas"}
      role="region"
      aria-label="現場とダンプの地図"
    />
  );
}
