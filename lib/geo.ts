export const DEFAULT_RADIUS_KM = 30;

export const RADIUS_OPTIONS_KM = [30, 50, 100, 200, 500] as const;

export type RadiusKm = (typeof RADIUS_OPTIONS_KM)[number];

export type GeoPoint = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6371;

export function parseRadiusKm(value: string | string[] | undefined): RadiusKm {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (RADIUS_OPTIONS_KM.includes(n as RadiusKm)) return n as RadiusKm;
  return DEFAULT_RADIUS_KM;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function centroid(points: GeoPoint[]): GeoPoint | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** 複数基準点のうち、対象への最短距離（km） */
export function minDistanceKm(target: GeoPoint, anchors: GeoPoint[]): number | null {
  if (anchors.length === 0) return null;
  return Math.min(...anchors.map((anchor) => haversineKm(anchor, target)));
}

export function isWithinRadiusKm(target: GeoPoint, anchors: GeoPoint[], radiusKm: number): boolean {
  const distance = minDistanceKm(target, anchors);
  return distance != null && distance <= radiusKm;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 10) / 10} km`;
  if (km < 100) return `${Math.round(km * 10) / 10} km`;
  return `${Math.round(km)} km`;
}

export function distanceScoreBonus(distanceKm: number): number {
  if (distanceKm <= 10) return 18;
  if (distanceKm <= 30) return 14;
  if (distanceKm <= 50) return 10;
  if (distanceKm <= 100) return 6;
  if (distanceKm <= 200) return 3;
  return 0;
}

export function toGeoPoint(
  lat: number | string | null | undefined,
  lng: number | string | null | undefined,
): GeoPoint | null {
  if (lat == null || lng == null) return null;
  const latN = typeof lat === "number" ? lat : Number(lat);
  const lngN = typeof lng === "number" ? lng : Number(lng);
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return null;
  return { lat: latN, lng: lngN };
}

export type WithDistance<T> = T & {
  distanceKm: number | null;
};

export function attachDistance<T>(
  items: T[],
  anchors: GeoPoint[],
  getPoint: (item: T) => GeoPoint | null,
): WithDistance<T>[] {
  return items.map((item) => {
    const point = getPoint(item);
    const distanceKm = point ? minDistanceKm(point, anchors) : null;
    return { ...item, distanceKm };
  });
}

export function filterWithinRadius<T>(
  items: WithDistance<T>[],
  radiusKm: number,
  options?: { includeUnknown?: boolean },
): WithDistance<T>[] {
  return items.filter((item) => {
    if (item.distanceKm == null) return options?.includeUnknown ?? false;
    return item.distanceKm <= radiusKm;
  });
}

export function sortByDistance<T>(items: WithDistance<T>[]): WithDistance<T>[] {
  return [...items].sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });
}
