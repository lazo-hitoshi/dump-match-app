import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  createAvailability,
  toggleAvailability,
  updateTruck,
} from "@/lib/actions/trucks";
import { getAppPersona } from "@/lib/auth/persona";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dateLabel, truckStatusLabel, yen } from "@/lib/format";
import type { TruckStatus } from "@/types/database";

type TruckRow = {
  id: string;
  truck_code: string;
  plate_number: string;
  truck_type: string;
  skills: string[];
  desired_daily_price: number | null;
  base_address: string | null;
  status: TruckStatus;
  companies: { name: string } | null;
};

type AvailabilityRow = {
  id: string;
  available_start_date: string;
  available_end_date: string;
  area_note: string | null;
  desired_daily_price: number | null;
  is_active: boolean;
};

export default async function TruckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentUserProfile();
  const persona = getAppPersona(profile);
  const canManage = persona === "admin" || persona === "truck";
  const supabase = await createClient();
  const { data } = await supabase
    .from("trucks")
    .select(
      "id, truck_code, plate_number, truck_type, skills, desired_daily_price, base_address, status, companies(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const truck = data as TruckRow;

  const { data: availabilities } = await supabase
    .from("truck_availabilities")
    .select("id, available_start_date, available_end_date, area_note, desired_daily_price, is_active")
    .eq("truck_id", id)
    .order("available_start_date", { ascending: false });

  const rows = (availabilities ?? []) as AvailabilityRow[];

  return (
    <>
      <PageHeader
        eyebrow={truck.truck_code}
        title={`${truck.companies?.name ?? ""} / ${truck.plate_number}`}
        actions={<Link href="/trucks" className="secondary-action">一覧へ</Link>}
      />

      <section className="workspace-grid">
        <article className="panel" style={{ padding: 20 }}>
          <p>車種: {truck.truck_type}</p>
          <p>スキル: {(truck.skills ?? []).join("、")}</p>
          <p>状態: {truckStatusLabel(truck.status)}</p>
          {truck.desired_daily_price ? <p>希望単価: {yen(truck.desired_daily_price)}</p> : null}
          {truck.base_address ? <p>待機場所: {truck.base_address}</p> : null}

          {canManage ? (
            <>
              <h3>車両編集</h3>
              <form action={updateTruck} className="entry-form" style={{ paddingTop: 0 }}>
            <input type="hidden" name="id" value={truck.id} />
            <label className="full">
              車両番号
              <input name="plate_number" defaultValue={truck.plate_number} required />
            </label>
            <label>
              車種
              <input name="truck_type" defaultValue={truck.truck_type} required />
            </label>
            <label>
              希望日額
              <input
                type="number"
                name="desired_daily_price"
                defaultValue={truck.desired_daily_price ?? undefined}
              />
            </label>
            <label className="full">
              スキル
              <input name="skills" defaultValue={(truck.skills ?? []).join(", ")} />
            </label>
            <label className="full">
              待機場所
              <input name="base_address" defaultValue={truck.base_address ?? ""} />
            </label>
            <label>
              状態
              <select name="status" defaultValue={truck.status}>
                <option value="available">空き</option>
                <option value="held">仮押さえ</option>
                <option value="booked">予約済</option>
                <option value="unavailable">停止</option>
              </select>
            </label>
            <button type="submit" className="primary-action">
              更新
            </button>
          </form>
            </>
          ) : null}
        </article>

        <article className="panel match-panel" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>空き予定</h3>
          <div className="match-list" style={{ maxHeight: "none", padding: 0 }}>
            {rows.length === 0 ? (
              <p className="mini-text">空き予定はまだ登録されていません。</p>
            ) : (
              rows.map((row) => (
              <div key={row.id} className="match-item">
                <div className="match-title">
                  <strong>
                    {dateLabel(row.available_start_date)} - {dateLabel(row.available_end_date)}
                  </strong>
                  <span>{row.area_note ?? "エリア未設定"}</span>
                </div>
                {canManage ? (
                <div className="match-actions">
                  <form action={toggleAvailability}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="truck_id" value={truck.id} />
                    <input type="hidden" name="is_active" value={String(row.is_active)} />
                    <button type="submit" className="small-button">
                      {row.is_active ? "無効化" : "有効化"}
                    </button>
                  </form>
                </div>
                ) : null}
              </div>
            ))
            )}
          </div>

          {canManage ? (
            <>
          <h3>空き予定を追加</h3>
          <form action={createAvailability} className="entry-form" style={{ paddingTop: 0 }}>
            <input type="hidden" name="truck_id" value={truck.id} />
            <div className="form-grid">
              <label>
                開始日
                <input type="date" name="available_start_date" required />
              </label>
              <label>
                終了日
                <input type="date" name="available_end_date" required />
              </label>
            </div>
            <label className="full">
              エリアメモ
              <input name="area_note" placeholder="東京23区" />
            </label>
            <button type="submit" className="secondary-action">
              空き予定を登録
            </button>
          </form>
            </>
          ) : null}
        </article>
      </section>
    </>
  );
}
