import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { truckStatusLabel, yen } from "@/lib/format";
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

export default async function TrucksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trucks")
    .select(
      "id, truck_code, plate_number, truck_type, skills, desired_daily_price, base_address, status, companies(name)",
    )
    .order("truck_code");

  const trucks = (data ?? []) as TruckRow[];

  return (
    <>
      <PageHeader
        eyebrow="ダンプ"
        title="空き車両と会社を確認する"
        actions={
          <Link href="/trucks/new" className="primary-action">
            ダンプ追加
          </Link>
        }
      />

      <section className="card-grid">
        {trucks.length === 0 ? (
          <p className="mini-text">車両がまだありません。</p>
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
                <span className={`status-pill ${truck.status === "available" ? "open" : "booked"}`}>
                  {truckStatusLabel(truck.status)}
                </span>
              </div>
              <div className="card-meta">
                <span className="skill-pill">{(truck.skills ?? []).join("・")}</span>
                <span className="mini-text">{truck.truck_type}</span>
                {truck.desired_daily_price ? (
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
