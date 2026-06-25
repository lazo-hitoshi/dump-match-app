export type MapMarkerKind = "site" | "truck";

export type MapMarker = {
  id: string;
  kind: MapMarkerKind;
  name: string;
  sublabel?: string;
  lat: number;
  lng: number;
  href?: string;
};

export const DEFAULT_MAP_CENTER: [number, number] = [35.68, 139.76];
export const DEFAULT_MAP_ZOOM = 10;
