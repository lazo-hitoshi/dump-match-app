import { PageHeader } from "@/components/layout/page-header";
import { createSite } from "@/lib/actions/sites";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { isAdminRole } from "@/types/domain";

export default async function NewSitePage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();
  const { data: companies } = isAdminRole(profile?.role ?? "viewer")
    ? await supabase.from("companies").select("id, name").eq("status", "approved")
    : { data: [] as { id: string; name: string }[] };

  return (
    <>
      <PageHeader eyebrow="現場" title="新規現場登録" />
      <section className="panel" style={{ padding: 20, maxWidth: 720 }}>
        <form action={createSite} className="entry-form" style={{ paddingTop: 0 }}>
          {isAdminRole(profile?.role ?? "viewer") ? (
            <label className="full">
              登録会社
              <select name="company_id" required defaultValue="">
                <option value="" disabled>
                  選択してください
                </option>
                {(companies ?? []).map((c) => (
                  <option key={c.id as string} value={c.id as string}>
                    {c.name as string}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="full">
            現場名
            <input name="name" required />
          </label>
          <label className="full">
            住所
            <input name="address" required />
          </label>
          <div className="form-grid">
            <label>
              開始日
              <input type="date" name="start_date" required />
            </label>
            <label>
              終了日
              <input type="date" name="end_date" required />
            </label>
            <label>
              必要台数
              <input type="number" name="required_truck_count" min={1} defaultValue={1} required />
            </label>
            <label>
              日額（円）
              <input type="number" name="daily_price" min={0} required />
            </label>
          </div>
          <label className="full">
            必要スキル（カンマ区切り）
            <input name="required_skills" placeholder="大型, 深ダンプ" />
          </label>
          <label className="full">
            支払条件
            <input name="payment_terms" />
          </label>
          <label className="full">
            注意事項
            <input name="notes" />
          </label>
          <label>
            状態
            <select name="status" defaultValue="open">
              <option value="draft">下書き</option>
              <option value="open">募集中</option>
              <option value="paused">一時停止</option>
            </select>
          </label>
          <button type="submit" className="primary-action">
            登録する
          </button>
        </form>
      </section>
    </>
  );
}
