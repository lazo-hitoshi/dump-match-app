import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { dateLabel, reservationStatusLabel, yen } from "@/lib/format";
import type { ReservationStatus } from "@/types/database";

type ReservationRow = {
  id: string;
  reservation_code: string;
  start_date: string;
  end_date: string;
  fixed_daily_price: number;
  status: ReservationStatus;
  sites: { name: string } | null;
  trucks: { truck_code: string } | null;
};

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservations")
    .select("id, reservation_code, start_date, end_date, fixed_daily_price, status, sites(name), trucks(truck_code)")
    .order("requested_at", { ascending: false });

  const rows = (data ?? []) as ReservationRow[];

  return (
    <>
      <PageHeader eyebrow="予約" title="予約申請と承認状況" />
      <section className="panel admin-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>コード</th>
                <th>現場</th>
                <th>車両</th>
                <th>期間</th>
                <th>金額</th>
                <th>状態</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.reservation_code}</td>
                  <td>{row.sites?.name}</td>
                  <td>{row.trucks?.truck_code}</td>
                  <td>
                    {dateLabel(row.start_date)} - {dateLabel(row.end_date)}
                  </td>
                  <td>{yen(row.fixed_daily_price)}</td>
                  <td>
                    <span className="status-pill">{reservationStatusLabel(row.status)}</span>
                  </td>
                  <td>
                    <Link href={`/reservations/${row.id}`} className="small-button primary">
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
