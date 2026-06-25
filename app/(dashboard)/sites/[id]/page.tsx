import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { updateSite } from "@/lib/actions/sites";
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
  payment_terms: string | null;
  notes: string | null;
  status: SiteStatus;
};

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("sites").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const site = data as SiteRow;
  const { data: summary } = await supabase
    .from("site_reservation_summary")
    .select("*")
    .eq("site_id", id)
    .maybeSingle();

  const remaining = (summary as SiteReservationSummaryRow | null)?.remaining_count ?? site.required_truck_count;

  return (
    <>
      <PageHeader
        eyebrow={site.site_code}
        title={site.name}
        actions={<Link href="/sites" className="secondary-action">一覧へ</Link>}
      />

      <section className="workspace-grid">
        <article className="panel" style={{ padding: 20 }}>
          <p className="mini-text">{site.address}</p>
          <p>
            {dateLabel(site.start_date)} 〜 {dateLabel(site.end_date)} / {yen(site.daily_price)}
          </p>
          <p>必要スキル: {(site.required_skills ?? []).join("、")}</p>
          <p>
            残り台数: <strong>{remaining}</strong> / {site.required_truck_count}
          </p>
          <p>状態: {siteStatusLabel(site.status)}</p>
          {site.notes ? <p>備考: {site.notes}</p> : null}
          <a href={openMaps(site.address)} target="_blank" rel="noreferrer" className="small-button">
            Google Maps
          </a>
        </article>

        <article className="panel" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>編集</h3>
          <form action={updateSite} className="entry-form" style={{ paddingTop: 0 }}>
            <input type="hidden" name="id" value={site.id} />
            <label className="full">
              現場名
              <input name="name" defaultValue={site.name} required />
            </label>
            <label className="full">
              住所
              <input name="address" defaultValue={site.address} required />
            </label>
            <div className="form-grid">
              <label>
                開始日
                <input type="date" name="start_date" defaultValue={site.start_date} required />
              </label>
              <label>
                終了日
                <input type="date" name="end_date" defaultValue={site.end_date} required />
              </label>
              <label>
                必要台数
                <input
                  type="number"
                  name="required_truck_count"
                  defaultValue={site.required_truck_count}
                  min={1}
                  required
                />
              </label>
              <label>
                日額
                <input type="number" name="daily_price" defaultValue={site.daily_price} required />
              </label>
            </div>
            <label className="full">
              必要スキル
              <input name="required_skills" defaultValue={(site.required_skills ?? []).join(", ")} />
            </label>
            <label>
              状態
              <select name="status" defaultValue={site.status}>
                <option value="draft">下書き</option>
                <option value="open">募集中</option>
                <option value="paused">一時停止</option>
                <option value="filled">充足</option>
                <option value="completed">完了</option>
                <option value="canceled">キャンセル</option>
              </select>
            </label>
            <button type="submit" className="primary-action">
              更新する
            </button>
          </form>
        </article>
      </section>
    </>
  );
}
