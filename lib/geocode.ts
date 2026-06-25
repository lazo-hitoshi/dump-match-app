export type GeoPoint = {
  lat: number;
  lng: number;
};

/** 住所から緯度経度を取得（OpenStreetMap Nominatim） */
export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "jp");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "DumpLink-MVP/1.0 (dump-match-app)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as { lat: string; lon: string }[];
    if (!results.length) return null;

    const lat = Number(results[0].lat);
    const lng = Number(results[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}
