import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { approveReservation, cancelReservation } from "@/lib/actions/reservations";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { dateLabel, reservationStatusLabel, yen } from "@/lib/format";
import { isAdminRole } from "@/types/domain";
import type { ReservationStatus } from "@/types/database";

type ReservationRow = {
  id: string;
  reservation_code: string;
  start_date: string;
  end_date: string;
  fixed_daily_price: number;
  status: ReservationStatus;
  note: string | null;
  cancel_reason: string | null;
  sites: { name: string; address: string } | null;
  trucks: { truck_code: string; plate_number: string } | null;
};

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("reservations")
    .select(
      "id, reservation_code, start_date, end_date, fixed_daily_price, status, note, cancel_reason, sites(name, address), trucks(truck_code, plate_number)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const row = data as ReservationRow;
  const isAdmin = isAdminRole(profile?.role ?? "viewer");

  return (
    <>
      <PageHeader
        eyebrow={row.reservation_code}
        title={row.sites?.name ?? "予約詳細"}
        actions={<Link href="/reservations" className="secondary-action">一覧へ</Link>}
      />

      <section className="workspace-grid">
        <article className="panel" style={{ padding: 20 }}>
          <p>車両: {row.trucks?.truck_code}（{row.trucks?.plate_number}）</p>
          <p>
            期間: {dateLabel(row.start_date)} 〜 {dateLabel(row.end_date)}
          </p>
          <p>金額: {yen(row.fixed_daily_price)}</p>
          <p>状態: {reservationStatusLabel(row.status)}</p>
          {row.note ? <p>備考: {row.note}</p> : null}
          {row.cancel_reason ? <p>キャンセル理由: {row.cancel_reason}</p> : null}
        </article>

        <article className="panel" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>操作</h3>
          {isAdmin && row.status === "requested" ? (
            <form action={approveReservation} className="entry-form" style={{ paddingTop: 0 }}>
              <input type="hidden" name="id" value={row.id} />
              <label className="full">
                承認メモ
                <input name="reason" placeholder="管理者承認" />
              </label>
              <button type="submit" className="primary-action">
                承認する
              </button>
            </form>
          ) : null}

          {row.status !== "completed" && row.status !== "canceled" && row.status !== "rejected" ? (
            <form action={cancelReservation} className="entry-form" style={{ paddingTop: 0 }}>
              <input type="hidden" name="id" value={row.id} />
              <label className="full">
                キャンセル理由
                <input name="reason" required defaultValue="キャンセル" />
              </label>
              <button type="submit" className="danger-button">
                キャンセル
              </button>
            </form>
          ) : null}
        </article>
      </section>
    </>
  );
}
