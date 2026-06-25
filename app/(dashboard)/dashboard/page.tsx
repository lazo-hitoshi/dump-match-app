import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getAppPersona } from "@/lib/auth/persona";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { SiteReservationSummaryRow } from "@/types/database";

async function getAdminStats() {
  const supabase = await createClient();
  const [{ count: openSites }, { count: availableTrucks }, { count: pendingReservations }] =
    await Promise.all([
      supabase.from("sites").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("trucks").select("*", { count: "exact", head: true }).eq("status", "available"),
      supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "requested"),
    ]);
  const { data: summaries } = await supabase.from("site_reservation_summary").select("*");
  const shortage = ((summaries ?? []) as SiteReservationSummaryRow[]).reduce(
    (sum, row) => sum + Math.max(0, row.remaining_count ?? 0),
    0,
  );
  return {
    openSites: openSites ?? 0,
    availableTrucks: availableTrucks ?? 0,
    pendingReservations: pendingReservations ?? 0,
    shortage,
  };
}

async function getSiteCompanyStats(companyId: string) {
  const supabase = await createClient();
  const [{ count: myOpenSites }, { count: pendingOnMySites }] = await Promise.all([
    supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "open"),
    supabase
      .from("reservations")
      .select("*, sites!inner(company_id)", { count: "exact", head: true })
      .eq("sites.company_id", companyId)
      .eq("status", "requested"),
  ]);
  const { data: mySites } = await supabase
    .from("sites")
    .select("id")
    .eq("company_id", companyId);
  const siteIds = (mySites ?? []).map((s) => (s as { id: string }).id);
  let shortage = 0;
  if (siteIds.length > 0) {
    const { data: summaries } = await supabase
      .from("site_reservation_summary")
      .select("remaining_count")
      .in("site_id", siteIds);
    shortage = ((summaries ?? []) as { remaining_count: number }[]).reduce(
      (sum, row) => sum + Math.max(0, row.remaining_count ?? 0),
      0,
    );
  }
  return {
    myOpenSites: myOpenSites ?? 0,
    pendingOnMySites: pendingOnMySites ?? 0,
    shortage,
  };
}

async function getTruckCompanyStats(companyId: string) {
  const supabase = await createClient();
  const [{ count: myAvailableTrucks }, { count: myPendingApps }] = await Promise.all([
    supabase
      .from("trucks")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "available"),
    supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("applicant_company_id", companyId)
      .eq("status", "requested"),
  ]);
  const { count: openSites } = await supabase
    .from("sites")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");
  return {
    myAvailableTrucks: myAvailableTrucks ?? 0,
    myPendingApps: myPendingApps ?? 0,
    openSites: openSites ?? 0,
  };
}

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();
  const persona = getAppPersona(profile);
  const today = new Date().toLocaleDateString("ja-JP");

  if (persona === "site" && profile) {
    const stats = await getSiteCompanyStats(profile.companyId);
    return (
      <>
        <PageHeader
          eyebrow="現場会社ポータル"
          title={`${profile.companyName} の現場状況`}
          actions={
            <Link href="/sites/new" className="primary-action">
              現場を登録
            </Link>
          }
        />
        <section className="quick-stats">
          <article className="stat-tile">
            <span className="stat-label">募集中の自社現場</span>
            <strong>{stats.myOpenSites}</strong>
            <small>本日 {today}</small>
          </article>
          <article className="stat-tile">
            <span className="stat-label">申請中の予約</span>
            <strong>{stats.pendingOnMySites}</strong>
            <small>自社現場への申請</small>
          </article>
          <article className="stat-tile accent">
            <span className="stat-label">不足台数合計</span>
            <strong>{stats.shortage}</strong>
            <small>自社現場の残枠</small>
          </article>
        </section>
        <section className="panel" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>よく使う機能</h3>
          <div className="card-actions" style={{ justifyContent: "flex-start" }}>
            <Link href="/sites" className="small-button primary">
              自社の現場一覧
            </Link>
            <Link href="/reservations" className="small-button">
              予約状況
            </Link>
            <Link href="/notifications" className="small-button">
              通知
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (persona === "truck" && profile) {
    const stats = await getTruckCompanyStats(profile.companyId);
    return (
      <>
        <PageHeader
          eyebrow="ダンプ会社ポータル"
          title={`${profile.companyName} の配車状況`}
          actions={
            <>
              <Link href="/match" className="primary-action">
                マッチ候補を見る
              </Link>
              <Link href="/trucks/new" className="secondary-action">
                ダンプを登録
              </Link>
            </>
          }
        />
        <section className="quick-stats">
          <article className="stat-tile">
            <span className="stat-label">空きダンプ（自社）</span>
            <strong>{stats.myAvailableTrucks}</strong>
            <small>稼働可能車両</small>
          </article>
          <article className="stat-tile">
            <span className="stat-label">申請中の予約</span>
            <strong>{stats.myPendingApps}</strong>
            <small>
              <Link href="/reservations">予約一覧へ</Link>
            </small>
          </article>
          <article className="stat-tile accent">
            <span className="stat-label">募集中の現場</span>
            <strong>{stats.openSites}</strong>
            <small>マッチ可能な現場</small>
          </article>
        </section>
        <section className="panel" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>よく使う機能</h3>
          <div className="card-actions" style={{ justifyContent: "flex-start" }}>
            <Link href="/match" className="small-button primary">
              マッチ候補
            </Link>
            <Link href="/trucks" className="small-button">
              自社ダンプ一覧
            </Link>
            <Link href="/sites" className="small-button">
              現場を探す
            </Link>
            <Link href="/notifications" className="small-button">
              通知
            </Link>
          </div>
        </section>
      </>
    );
  }

  const stats = await getAdminStats();
  return (
    <>
      <PageHeader
        eyebrow="運営管理"
        title="現場と空きダンプをすばやく合わせる"
        actions={
          <>
            <Link href="/sites/new" className="primary-action">
              現場追加
            </Link>
            <Link href="/trucks/new" className="secondary-action">
              ダンプ追加
            </Link>
          </>
        }
      />
      <section className="quick-stats">
        <article className="stat-tile">
          <span className="stat-label">募集中の現場</span>
          <strong>{stats.openSites}</strong>
          <small>本日 {today}</small>
        </article>
        <article className="stat-tile">
          <span className="stat-label">空きダンプ</span>
          <strong>{stats.availableTrucks}</strong>
          <small>稼働可能車両</small>
        </article>
        <article className="stat-tile">
          <span className="stat-label">承認待ち予約</span>
          <strong>{stats.pendingReservations}</strong>
          <small>
            <Link href="/reservations">予約一覧へ</Link>
          </small>
        </article>
        <article className="stat-tile accent">
          <span className="stat-label">不足台数合計</span>
          <strong>{stats.shortage}</strong>
          <small>残枠の合計</small>
        </article>
      </section>
      <section className="panel" style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>クイックアクセス</h3>
        <div className="card-actions" style={{ justifyContent: "flex-start" }}>
          <Link href="/sites" className="small-button primary">
            現場一覧
          </Link>
          <Link href="/trucks" className="small-button">
            ダンプ一覧
          </Link>
          <Link href="/match" className="small-button">
            マッチ候補
          </Link>
          <Link href="/companies" className="small-button">
            会社審査
          </Link>
          <Link href="/audit-logs" className="small-button">
            操作履歴
          </Link>
        </div>
      </section>
    </>
  );
}
