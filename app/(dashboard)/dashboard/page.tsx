import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/types/domain";
import type { SiteReservationSummaryRow } from "@/types/database";

async function getDashboardStats() {
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
  const summaryRows = (summaries ?? []) as SiteReservationSummaryRow[];
  const shortage = summaryRows.reduce(
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

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();
  const stats = await getDashboardStats();
  const today = new Date().toLocaleDateString("ja-JP");

  return (
    <>
      <PageHeader
        eyebrow={isAdminRole(profile?.role ?? "viewer") ? "管理者ビュー" : "会社ユーザー"}
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
          <Link href="/notifications" className="small-button">
            通知
          </Link>
          {isAdminRole(profile?.role ?? "viewer") ? (
            <Link href="/companies" className="small-button">
              会社審査
            </Link>
          ) : null}
        </div>
      </section>
    </>
  );
}
