import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { LocationMap } from "@/components/map/location-map-dynamic";
import { RadiusFilter } from "@/components/map/radius-filter";
import { getAppPersona } from "@/lib/auth/persona";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { getCompanyGeoAnchors, getMapCenterFromAnchors } from "@/lib/geo-reference";
import {
  attachDistance,
  filterWithinRadius,
  formatDistanceKm,
  parseRadiusKm,
  sortByDistance,
  toGeoPoint,
} from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import { buildMapMarkers } from "@/lib/map-markers";
import { truckStatusLabel, yen } from "@/lib/format";
import type { TruckStatus } from "@/types/database";
import type { MapViewport } from "@/types/map";

type TruckRow = {
  id: string;
  company_id: string;
  truck_code: string;
  plate_number: string;
  truck_type: string;
  skills: string[];
  desired_daily_price: number | null;
  base_address: string | null;
  base_lat: number | null;
  base_lng: number | null;
  status: TruckStatus;
  companies: { name: string } | null;
};

export default async function TrucksPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string }>;
}) {
  const { radius: radiusParam } = await searchParams;
  const radiusKm = parseRadiusKm(radiusParam);
  const profile = await getCurrentUserProfile();
  const persona = getAppPersona(profile);
  const supabase = await createClient();

  let query = supabase
    .from("trucks")
    .select(
      "id, company_id, truck_code, plate_number, truck_type, skills, desired_daily_price, base_address, base_lat, base_lng, status, companies(name)",
    );

  if (persona === "site") {
    query = query.eq("status", "available");
  }

  const { data } = await query.order("truck_code");
  const allTrucks = (data ?? []) as TruckRow[];

  const anchors =
    profile && persona !== "admin"
      ? await getCompanyGeoAnchors(supabase, profile.companyId, persona)
      : [];
  const useNearbyFilter = persona === "site" && anchors.length > 0;

  const withDistance = attachDistance(allTrucks, anchors, (truck) =>
    toGeoPoint(truck.base_lat, truck.base_lng),
  );

  let trucks = withDistance;
  if (persona === "site") {
    trucks = useNearbyFilter
      ? sortByDistance(filterWithinRadius(withDistance, radiusKm))
      : sortByDistance(withDistance);
  } else if (persona === "truck" && profile) {
    trucks = withDistance.filter((truck) => truck.company_id === profile.companyId);
  }

  const mapMarkers = buildMapMarkers([], trucks);
  const mapCenter = getMapCenterFromAnchors(anchors);
  const viewport: MapViewport | null =
    mapCenter && useNearbyFilter
      ? { center: [mapCenter.lat, mapCenter.lng], radiusKm, zoom: 10 }
      : null;

  return (
    <>
      <PageHeader
        eyebrow={persona === "site" ? "現場会社ポータル" : persona === "truck" ? "ダンプ会社ポータル" : "ダンプ"}
        title={
          persona === "site"
            ? "近くの空きダンプ"
            : persona === "truck"
              ? "自社の空き車両"
              : "空き車両と会社を確認する"
        }
        actions={
          persona !== "site" ? (
            <Link href="/trucks/new" className="primary-action">
              ダンプ追加
            </Link>
          ) : undefined
        }
      />

      {useNearbyFilter ? (
        <Suspense fallback={null}>
          <RadiusFilter label="ダンプの表示半径" />
        </Suspense>
      ) : null}

      {mapMarkers.length > 0 ? (
        <section className="panel map-panel" style={{ marginBottom: 14 }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Map</p>
              <h3>{persona === "site" ? "近くのダンプマップ" : "ダンプ拠点マップ"}</h3>
            </div>
            <span className="count-pill">{mapMarkers.length}台</span>
          </div>
          <LocationMap markers={mapMarkers} viewport={viewport} />
        </section>
      ) : null}

      <section className="card-grid">
        {trucks.length === 0 ? (
          <p className="mini-text">
            {useNearbyFilter
              ? `半径 ${radiusKm} km 以内に空きダンプがありません。出稼ぎ対応の場合は半径を広げてください。`
              : "車両がまだありません。"}
          </p>
        ) : (
          trucks.map((truck) => (
            <article key={truck.id} className="entity-card">
              <div className="card-top">
                <div className="card-title">
                  <strong>{truck.truck_code}</strong>
                  <span>
                    {truck.companies?.name} / {truck.plate_number}
                  </span>
                </div>
                <div className="card-badges">
                  {truck.distanceKm != null ? (
                    <span className="distance-pill">{formatDistanceKm(truck.distanceKm)}</span>
                  ) : null}
                  <span className={`status-pill ${truck.status === "available" ? "open" : "booked"}`}>
                    {truckStatusLabel(truck.status)}
                  </span>
                </div>
              </div>
              <div className="card-meta">
                <span className="skill-pill">{(truck.skills ?? []).join("・")}</span>
                <span className="mini-text">{truck.truck_type}</span>
                {truck.desired_daily_price != null ? (
                  <span className="mini-text">希望 {yen(truck.desired_daily_price)}</span>
                ) : null}
              </div>
              {truck.base_address ? <p className="mini-text">{truck.base_address}</p> : null}
              <div className="card-actions">
                <Link href={`/trucks/${truck.id}`} className="small-button primary">
                  詳細・空き予定
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
