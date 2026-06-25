import { PageHeader } from "@/components/layout/page-header";
import { createTruck } from "@/lib/actions/trucks";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { isAdminRole } from "@/types/domain";

export default async function NewTruckPage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();
  const { data: companies } = isAdminRole(profile?.role ?? "viewer")
    ? await supabase.from("companies").select("id, name").eq("status", "approved")
    : { data: [] as { id: string; name: string }[] };

  return (
    <>
      <PageHeader eyebrow="ダンプ" title="新規ダンプ登録" />
      <section className="panel" style={{ padding: 20, maxWidth: 720 }}>
        <form action={createTruck} className="entry-form" style={{ paddingTop: 0 }}>
          {isAdminRole(profile?.role ?? "viewer") ? (
            <label className="full">
              所属会社
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
            車両番号
            <input name="plate_number" required placeholder="品川100あ1234" />
          </label>
          <label>
            車種
            <input name="truck_type" defaultValue="大型ダンプ" required />
          </label>
          <label>
            希望日額
            <input type="number" name="desired_daily_price" min={0} />
          </label>
          <label className="full">
            対応スキル（カンマ区切り）
            <input name="skills" placeholder="大型, 深ダンプ" />
          </label>
          <label className="full">
            待機場所
            <input name="base_address" />
          </label>
          <button type="submit" className="primary-action">
            登録する
          </button>
        </form>
      </section>
    </>
  );
}
