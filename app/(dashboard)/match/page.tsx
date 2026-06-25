import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LocationMap } from "@/components/map/location-map-dynamic";
import { RadiusFilter } from "@/components/map/radius-filter";
import { getAppPersona } from "@/lib/auth/persona";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { requestReservation } from "@/lib/actions/reservations";
import { buildMatchCandidates, type SiteRow, type TruckRow } from "@/lib/match";
import { buildMapMarkers } from "@/lib/map-markers";
import { getCompanyGeoAnchors, getMapCenterFromAnchors } from "@/lib/geo-reference";
import { formatDistanceKm, parseRadiusKm } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import { dateLabel, yen } from "@/lib/format";
import type { MapViewport } from "@/types/map";

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string }>;
}) {
  const { radius: radiusParam } = await searchParams;
  const radiusKm = parseRadiusKm(radiusParam);
  const profile = await getCurrentUserProfile();
  const persona = getAppPersona(profile);
  if (persona === "site") redirect("/dashboard");

  const supabase = await createClient();
  const anchors =
    profile && persona === "truck"
      ? await getCompanyGeoAnchors(supabase, profile.companyId, persona)
      : [];
  const useNearbyFilter = persona === "truck" && anchors.length > 0;

  const [{ data: sites }, { data: trucks }, { data: availabilities }, { data: summaries }] =
    await Promise.all([
      supabase
        .from("sites")
        .select(
          "id, site_code, name, address, lat, lng, start_date, end_date, daily_price, required_skills, status",
        )
        .eq("status", "open"),
      supabase
        .from("trucks")
        .select(
          "id, truck_code, base_address, base_lat, base_lng, skills, desired_daily_price, status, companies(name)",
        )
        .eq("status", "available"),
      supabase
        .from("truck_availabilities")
        .select("truck_id, available_start_date, available_end_date, is_active")
        .eq("is_active", true),
      supabase.from("site_reservation_summary").select("site_id, remaining_count"),
    ]);

  const siteRows = (sites ?? []) as SiteRow[];
  const truckRows = (trucks ?? []) as TruckRow[];

  const candidates = buildMatchCandidates(
    siteRows,
    truckRows,
    (availabilities ?? []) as Parameters<typeof buildMatchCandidates>[2],
    (summaries ?? []) as Parameters<typeof buildMatchCandidates>[3],
    useNearbyFilter ? { maxDistanceKm: radiusKm } : undefined,
  );

  const candidateSiteIds = new Set(candidates.map((c) => c.siteId));
  const candidateTruckIds = new Set(candidates.map((c) => c.truckId));

  const mapMarkers = buildMapMarkers(
    siteRows
      .filter((s) => candidateSiteIds.has(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        site_code: s.site_code,
        address: s.address,
        lat: s.lat ?? null,
        lng: s.lng ?? null,
      })),
    truckRows
      .filter((t) => candidateTruckIds.has(t.id))
      .map((t) => ({
        id: t.id,
        truck_code: t.truck_code,
        base_address: t.base_address ?? null,
        base_lat: t.base_lat ?? null,
        base_lng: t.base_lng ?? null,
        companies: t.companies ?? null,
      })),
  );

  const mapCenter = getMapCenterFromAnchors(anchors);
  const viewport: MapViewport | null =
    mapCenter && useNearbyFilter
      ? { center: [mapCenter.lat, mapCenter.lng], radiusKm, zoom: 10 }
      : null;

  return (
    <>
      <PageHeader
        eyebrow={persona === "truck" ? "ダンプ会社ポータル" : "マッチング"}
        title="条件に合う候補を探す"
      />

      {useNearbyFilter ? (
        <Suspense fallback={null}>
          <RadiusFilter label="マッチ候補の表示半径" />
        </Suspense>
      ) : null}

      <section className="workspace-grid">
        <section className="panel map-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Map</p>
              <h3>現場とダンプの位置</h3>
            </div>
            <span className="count-pill">{mapMarkers.length}件</span>
          </div>
          {mapMarkers.length > 0 ? (
            <LocationMap markers={mapMarkers} viewport={viewport} />
          ) : (
            <p className="mini-text" style={{ padding: 16 }}>
              地図に表示できる候補がありません。半径を広げるか、座標データを確認してください。
            </p>
          )}
          <p className="mini-text map-legend">
            <span className="map-legend-item map-legend-item--site">現</span> 現場
            <span className="map-legend-item map-legend-item--truck">ダ</span> ダンプ
          </p>
        </section>

        <section className="panel match-panel">
          <div className="section-heading">
            <h3>マッチ候補</h3>
            <span className="count-pill">{candidates.length}件</span>
          </div>
          <div className="match-list">
            {candidates.length === 0 ? (
              <p className="mini-text" style={{ padding: 12 }}>
                {useNearbyFilter
                  ? `半径 ${radiusKm} km 以内に条件に合う候補はありません。出稼ぎ対応の場合は半径を広げてください。`
                  : "条件に合う候補はありません"}
              </p>
            ) : (
              candidates.slice(0, 20).map((item) => (
                <article key={`${item.siteId}-${item.truckId}`} className="match-item">
                  <div className="match-top">
                    <div className="match-title">
                      <strong>{item.siteName}</strong>
                      <span>
                        {item.companyName} / {item.truckCode}
                      </span>
                    </div>
                    <div className="match-score">{item.score}</div>
                  </div>
                  <div className="match-meta">
                    <span className="skill-pill">{item.skills.join("・")}</span>
                    {item.distanceKm != null ? (
                      <span className="distance-pill">{formatDistanceKm(item.distanceKm)}</span>
                    ) : null}
                    <span className="mini-text">
                      {dateLabel(item.startDate)} - {dateLabel(item.endDate)}
                    </span>
                    <span className="mini-text">
                      {yen(item.dailyPrice)}
                      {item.desiredPrice ? ` / 希望 ${yen(item.desiredPrice)}` : ""}
                    </span>
                  </div>
                  <div className="match-actions">
                    <form action={requestReservation}>
                      <input type="hidden" name="site_id" value={item.siteId} />
                      <input type="hidden" name="truck_id" value={item.truckId} />
                      <input type="hidden" name="start_date" value={item.startDate} />
                      <input type="hidden" name="end_date" value={item.endDate} />
                      <button type="submit" className="small-button primary">
                        予約申請
                      </button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </>
  );
}
