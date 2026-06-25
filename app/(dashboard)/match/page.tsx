import { PageHeader } from "@/components/layout/page-header";
import { requestReservation } from "@/lib/actions/reservations";
import { buildMatchCandidates } from "@/lib/match";
import { createClient } from "@/lib/supabase/server";
import { dateLabel, yen } from "@/lib/format";

export default async function MatchPage() {
  const supabase = await createClient();

  const [{ data: sites }, { data: trucks }, { data: availabilities }, { data: summaries }] =
    await Promise.all([
      supabase
        .from("sites")
        .select(
          "id, site_code, name, address, start_date, end_date, daily_price, required_skills, status",
        )
        .eq("status", "open"),
      supabase
        .from("trucks")
        .select("id, truck_code, skills, desired_daily_price, status, companies(name)")
        .eq("status", "available"),
      supabase
        .from("truck_availabilities")
        .select("truck_id, available_start_date, available_end_date, is_active")
        .eq("is_active", true),
      supabase.from("site_reservation_summary").select("site_id, remaining_count"),
    ]);

  const candidates = buildMatchCandidates(
    (sites ?? []) as Parameters<typeof buildMatchCandidates>[0],
    (trucks ?? []) as Parameters<typeof buildMatchCandidates>[1],
    (availabilities ?? []) as Parameters<typeof buildMatchCandidates>[2],
    (summaries ?? []) as Parameters<typeof buildMatchCandidates>[3],
  );

  return (
    <>
      <PageHeader eyebrow="マッチング" title="条件に合う候補を探す" />

      <section className="panel match-panel">
        <div className="section-heading">
          <h3>マッチ候補</h3>
          <span className="count-pill">{candidates.length}件</span>
        </div>
        <div className="match-list">
          {candidates.length === 0 ? (
            <p className="mini-text" style={{ padding: 12 }}>
              条件に合う候補はありません
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
    </>
  );
}
