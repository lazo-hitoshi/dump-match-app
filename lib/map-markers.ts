import type { MapMarker } from "@/types/map";

type SiteGeoRow = {
  id: string;
  name: string;
  site_code: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status?: string;
};

type TruckGeoRow = {
  id: string;
  truck_code: string;
  base_address: string | null;
  base_lat: number | null;
  base_lng: number | null;
  status?: string;
  companies?: { name: string } | null;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function siteToMarker(site: SiteGeoRow): MapMarker | null {
  const lat = toNumber(site.lat);
  const lng = toNumber(site.lng);
  if (lat == null || lng == null) return null;

  return {
    id: site.id,
    kind: "site",
    name: site.name,
    sublabel: `${site.site_code} / ${site.address}`,
    lat,
    lng,
    href: `/sites/${site.id}`,
  };
}

export function truckToMarker(truck: TruckGeoRow): MapMarker | null {
  const lat = toNumber(truck.base_lat);
  const lng = toNumber(truck.base_lng);
  if (lat == null || lng == null) return null;

  return {
    id: truck.id,
    kind: "truck",
    name: truck.truck_code,
    sublabel: [truck.companies?.name, truck.base_address].filter(Boolean).join(" / "),
    lat,
    lng,
    href: `/trucks/${truck.id}`,
  };
}

export function buildMapMarkers(sites: SiteGeoRow[], trucks: TruckGeoRow[]): MapMarker[] {
  const siteMarkers = sites.map(siteToMarker).filter((m): m is MapMarker => m != null);
  const truckMarkers = trucks.map(truckToMarker).filter((m): m is MapMarker => m != null);
  return [...siteMarkers, ...truckMarkers];
}
