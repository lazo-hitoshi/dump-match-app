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
import { dateLabel, yen } from "@/lib/format";
import { openMaps, siteStatusLabel } from "@/types/domain";
import type { SiteReservationSummaryRow, SiteStatus } from "@/types/database";
import type { MapViewport } from "@/types/map";

type SiteRow = {
  id: string;
  company_id: string;
  site_code: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  start_date: string;
  end_date: string;
  required_truck_count: number;
  daily_price: number;
  required_skills: string[];
  status: SiteStatus;
};

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string }>;
}) {
  const { radius: radiusParam } = await searchParams;
  const radiusKm = parseRadiusKm(radiusParam);
  const profile = await getCurrentUserProfile();
  const persona = getAppPersona(profile);
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select(
      "id, company_id, site_code, name, address, lat, lng, start_date, end_date, required_truck_count, daily_price, required_skills, status",
    )
    .order("start_date", { ascending: false });

  const { data: summaries } = await supabase.from("site_reservation_summary").select("*");
  const summaryRows = (summaries ?? []) as SiteReservationSummaryRow[];
  const remainingMap = new Map(summaryRows.map((s) => [s.site_id, s.remaining_count]));

  const allRows = (sites ?? []) as SiteRow[];
  const anchors =
    profile && persona !== "admin"
      ? await getCompanyGeoAnchors(supabase, profile.companyId, persona)
      : [];
  const useNearbyFilter = persona !== "admin" && anchors.length > 0;

  const withDistance = attachDistance(allRows, anchors, (site) => toGeoPoint(site.lat, site.lng));

  const rows = useNearbyFilter
    ? sortByDistance(
        withDistance.filter((site) => {
          if (profile && site.company_id === profile.companyId) return true;
          if (site.status !== "open") return false;
          return filterWithinRadius([site], radiusKm).length > 0;
        }),
      )
    : sortByDistance(withDistance);

  const mapMarkers = buildMapMarkers(rows, []);
  const mapCenter = getMapCenterFromAnchors(anchors);
  const viewport: MapViewport | null =
    mapCenter && useNearbyFilter
      ? { center: [mapCenter.lat, mapCenter.lng], radiusKm, zoom: 10 }
      : null;

  return (
    <>
      <PageHeader
        eyebrow={persona === "truck" ? "ダンプ会社ポータル" : persona === "site" ? "現場会社ポータル" : "現場"}
        title={persona === "truck" ? "近くの募集中現場" : "募集中の現場を確認する"}
        actions={
          persona !== "truck" ? (
            <Link href="/sites/new" className="primary-action">
              現場追加
            </Link>
          ) : undefined
        }
      />

      {useNearbyFilter ? (
        <Suspense fallback={null}>
          <RadiusFilter label="現場の表示半径" />
        </Suspense>
      ) : null}

      {mapMarkers.length > 0 ? (
        <section className="panel map-panel" style={{ marginBottom: 14 }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Map</p>
              <h3>{persona === "truck" ? "近くの現場マップ" : "現場マップ"}</h3>
            </div>
            <span className="count-pill">{mapMarkers.length}件</span>
          </div>
          <LocationMap markers={mapMarkers} viewport={viewport} />
        </section>
      ) : null}

      <section className="card-grid">
        {rows.length === 0 ? (
          <p className="mini-text">
            {useNearbyFilter
              ? `半径 ${radiusKm} km 以内に表示できる現場がありません。半径を広げてください。`
              : "現場がまだありません。"}
          </p>
        ) : (
          rows.map((site) => {
            const remaining = remainingMap.get(site.id) ?? site.required_truck_count;
            const booked = site.required_truck_count - remaining;
            const pct = Math.round((booked / site.required_truck_count) * 100);
            return (
              <article key={site.id} className="entity-card">
                <div className="card-top">
                  <div className="card-title">
                    <strong>{site.name}</strong>
                    <span>
                      {site.site_code} / {site.address}
                    </span>
                  </div>
                  <div className="card-badges">
                    {site.distanceKm != null ? (
                      <span className="distance-pill">{formatDistanceKm(site.distanceKm)}</span>
                    ) : null}
                    <span className={`status-pill ${site.status === "open" ? "open" : ""}`}>
                      {siteStatusLabel(site.status)}
                    </span>
                  </div>
                </div>
                <div className="card-meta">
                  <span className="skill-pill">{(site.required_skills ?? []).join("・")}</span>
                  <span className="mini-text">
                    {dateLabel(site.start_date)} - {dateLabel(site.end_date)}
                  </span>
                  <span className="mini-text">{yen(site.daily_price)}</span>
                </div>
                <div className="card-progress">
                  <span className="mini-text">
                    予約 {booked} / {site.required_truck_count}台（残り {remaining}）
                  </span>
                  <div className="bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="card-actions">
                  <a
                    href={openMaps(site.address)}
                    target="_blank"
                    rel="noreferrer"
                    className="small-button"
                  >
                    地図
                  </a>
                  <Link href={`/sites/${site.id}`} className="small-button primary">
                    詳細
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
