import type { AppPersona } from "@/lib/auth/persona";
import { createClient } from "@/lib/supabase/server";
import { centroid, toGeoPoint, type GeoPoint } from "@/lib/geo";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export async function getCompanyGeoAnchors(
  supabase: ServerSupabase,
  companyId: string,
  persona: AppPersona,
): Promise<GeoPoint[]> {
  const anchors: GeoPoint[] = [];

  if (persona === "site" || persona === "admin") {
    const { data: sites } = await supabase
      .from("sites")
      .select("lat, lng")
      .eq("company_id", companyId);
    for (const site of sites ?? []) {
      const point = toGeoPoint(
        (site as { lat: number | null }).lat,
        (site as { lng: number | null }).lng,
      );
      if (point) anchors.push(point);
    }
  }

  if (persona === "truck" || (persona === "admin" && anchors.length === 0)) {
    const { data: trucks } = await supabase
      .from("trucks")
      .select("base_lat, base_lng")
      .eq("company_id", companyId);
    for (const truck of trucks ?? []) {
      const point = toGeoPoint(
        (truck as { base_lat: number | null }).base_lat,
        (truck as { base_lng: number | null }).base_lng,
      );
      if (point) anchors.push(point);
    }
  }

  return anchors;
}

export function getMapCenterFromAnchors(anchors: GeoPoint[]): GeoPoint | null {
  return centroid(anchors);
}
