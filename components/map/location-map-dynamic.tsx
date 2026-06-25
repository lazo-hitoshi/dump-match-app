"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "@/types/map";

export type { MapMarker };

export const LocationMap = dynamic(
  () => import("@/components/map/location-map").then((mod) => mod.LocationMap),
  { ssr: false },
);
