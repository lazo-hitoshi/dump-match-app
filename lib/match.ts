import { skillsMatch } from "@/types/domain";
import { distanceScoreBonus, haversineKm, toGeoPoint } from "@/lib/geo";

export type MatchCandidateView = {
  siteId: string;
  siteName: string;
  siteCode: string;
  truckId: string;
  truckCode: string;
  companyName: string;
  score: number;
  priceDiff: number;
  dailyPrice: number;
  desiredPrice: number | null;
  startDate: string;
  endDate: string;
  skills: string[];
  distanceKm: number | null;
};

export type SiteRow = {
  id: string;
  site_code: string;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  start_date: string;
  end_date: string;
  daily_price: number;
  required_skills: string[];
  status: string;
};

export type TruckRow = {
  id: string;
  truck_code: string;
  base_address?: string | null;
  base_lat?: number | null;
  base_lng?: number | null;
  skills: string[];
  desired_daily_price: number | null;
  status: string;
  companies?: { name: string } | null;
};

type AvailabilityRow = {
  truck_id: string;
  available_start_date: string;
  available_end_date: string;
  is_active: boolean;
};

type SummaryRow = {
  site_id: string;
  remaining_count: number;
};

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

function matchScore(site: SiteRow, truck: TruckRow, priceDiff: number, distanceKm: number | null): number {
  let score = 42;
  score += 24;
  if (priceDiff >= 0) score += 18;
  score += Math.max(0, 16 - Math.min(16, Math.abs(priceDiff) / 1000));
  if (distanceKm != null) score += distanceScoreBonus(distanceKm);
  return Math.min(99, score);
}

function siteTruckDistanceKm(site: SiteRow, truck: TruckRow): number | null {
  const sitePoint = toGeoPoint(site.lat, site.lng);
  const truckPoint = toGeoPoint(truck.base_lat, truck.base_lng);
  if (!sitePoint || !truckPoint) return null;
  return haversineKm(sitePoint, truckPoint);
}

export function buildMatchCandidates(
  sites: SiteRow[],
  trucks: TruckRow[],
  availabilities: AvailabilityRow[],
  summaries: SummaryRow[],
  options?: { maxDistanceKm?: number },
): MatchCandidateView[] {
  const remainingBySite = new Map(summaries.map((s) => [s.site_id, s.remaining_count ?? 0]));
  const availByTruck = availabilities.filter((a) => a.is_active);

  const candidates: MatchCandidateView[] = [];

  for (const site of sites) {
    if (site.status !== "open") continue;
    if ((remainingBySite.get(site.id) ?? 0) <= 0) continue;

    for (const truck of trucks) {
      if (truck.status !== "available") continue;
      if (!skillsMatch(site.required_skills ?? [], truck.skills ?? [])) continue;

      const hasAvailability = availByTruck.some(
        (a) =>
          a.truck_id === truck.id &&
          overlaps(a.available_start_date, a.available_end_date, site.start_date, site.end_date),
      );
      if (!hasAvailability) continue;

      const desired = truck.desired_daily_price ?? site.daily_price;
      const priceDiff = site.daily_price - desired;
      const distanceKm = siteTruckDistanceKm(site, truck);

      if (options?.maxDistanceKm != null) {
        if (distanceKm == null || distanceKm > options.maxDistanceKm) continue;
      }

      candidates.push({
        siteId: site.id,
        siteName: site.name,
        siteCode: site.site_code,
        truckId: truck.id,
        truckCode: truck.truck_code,
        companyName: truck.companies?.name ?? "",
        score: matchScore(site, truck, priceDiff, distanceKm),
        priceDiff,
        dailyPrice: site.daily_price,
        desiredPrice: truck.desired_daily_price,
        startDate: site.start_date,
        endDate: site.end_date,
        skills: site.required_skills ?? [],
        distanceKm,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}
