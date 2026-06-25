import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { dateLabel, yen } from "@/lib/format";
import { openMaps, siteStatusLabel } from "@/types/domain";
import type { SiteReservationSummaryRow, SiteStatus } from "@/types/database";

type SiteRow = {
  id: string;
  site_code: string;
  name: string;
  address: string;
  start_date: string;
  end_date: string;
  required_truck_count: number;
  daily_price: number;
  required_skills: string[];
  status: SiteStatus;
};

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select(
      "id, site_code, name, address, start_date, end_date, required_truck_count, daily_price, required_skills, status",
    )
    .order("start_date", { ascending: false });

  const { data: summaries } = await supabase.from("site_reservation_summary").select("*");
  const summaryRows = (summaries ?? []) as SiteReservationSummaryRow[];
  const remainingMap = new Map(summaryRows.map((s) => [s.site_id, s.remaining_count]));

  const rows = (sites ?? []) as SiteRow[];

  return (
    <>
      <PageHeader
        eyebrow="現場"
        title="募集中の現場を確認する"
        actions={
          <Link href="/sites/new" className="primary-action">
            現場追加
          </Link>
        }
      />

      <section className="card-grid">
        {rows.length === 0 ? (
          <p className="mini-text">現場がまだありません。</p>
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
                  <span className={`status-pill ${site.status === "open" ? "open" : ""}`}>
                    {siteStatusLabel(site.status)}
                  </span>
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
