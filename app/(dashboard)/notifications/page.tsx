import { PageHeader } from "@/components/layout/page-header";
import { markNotificationRead } from "@/lib/actions/reservations";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  read_at: string | null;
  created_at: string;
};

export default async function NotificationsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, notification_type, read_at, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as NotificationRow[];

  return (
    <>
      <PageHeader eyebrow="通知" title="重要な変更を確認する" />
      <section className="match-list" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <p className="mini-text">通知はありません。</p>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="match-item">
              <div className="match-title">
                <strong>{row.title}</strong>
                <span>
                  {row.notification_type} / {new Date(row.created_at).toLocaleString("ja-JP")}
                </span>
              </div>
              <p style={{ margin: 0 }}>{row.body}</p>
              {!row.read_at ? (
                <form action={markNotificationRead}>
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit" className="small-button">
                    既読にする
                  </button>
                </form>
              ) : (
                <span className="mini-text">既読</span>
              )}
            </article>
          ))
        )}
      </section>
    </>
  );
}
