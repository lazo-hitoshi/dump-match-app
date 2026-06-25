import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { auditActionLabel, auditTargetTypeLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/types/domain";

type AuditLogRow = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
};

type ActorRow = {
  id: string;
  name: string;
  email: string;
};

function detailLink(targetType: string, targetId: string): string | null {
  if (targetType === "reservation") return `/reservations/${targetId}`;
  if (targetType === "company") return "/companies";
  if (targetType === "site") return `/sites/${targetId}`;
  if (targetType === "truck") return `/trucks/${targetId}`;
  return null;
}

function summaryText(row: AuditLogRow): string {
  const after = row.after_data;
  if (!after) return row.target_id;

  if (row.target_type === "reservation" && typeof after.reservation_code === "string") {
    return after.reservation_code;
  }
  if (row.target_type === "company" && typeof after.name === "string") {
    return after.name;
  }
  if (typeof after.name === "string") return after.name;
  if (typeof after.site_code === "string") return after.site_code;
  if (typeof after.truck_code === "string") return after.truck_code;

  return row.target_id;
}

export default async function AuditLogsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");
  if (!isAdminRole(profile.role)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, actor_user_id, action, target_type, target_id, before_data, after_data, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (logs ?? []) as AuditLogRow[];
  const actorIds = [...new Set(rows.map((row) => row.actor_user_id))];

  const { data: actors } =
    actorIds.length > 0
      ? await supabase.from("users").select("id, name, email").in("id", actorIds)
      : { data: [] as ActorRow[] };

  const actorMap = new Map(
    ((actors ?? []) as ActorRow[]).map((actor) => [actor.id, actor]),
  );

  return (
    <>
      <PageHeader eyebrow="監査" title="操作履歴" />
      <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <p className="mini-text" style={{ padding: 20 }}>
            操作履歴はまだありません。予約申請・承認や会社審査を行うと記録されます。
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日時</th>
                  <th>操作者</th>
                  <th>操作</th>
                  <th>対象</th>
                  <th>詳細</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const actor = actorMap.get(row.actor_user_id);
                  const href = detailLink(row.target_type, row.target_id);
                  return (
                    <tr key={row.id}>
                      <td>{new Date(row.created_at).toLocaleString("ja-JP")}</td>
                      <td>
                        <strong>{actor?.name ?? "不明"}</strong>
                        <div className="mini-text">{actor?.email ?? row.actor_user_id}</div>
                      </td>
                      <td>{auditActionLabel(row.action)}</td>
                      <td>
                        {auditTargetTypeLabel(row.target_type)}
                        <div className="mini-text">{summaryText(row)}</div>
                      </td>
                      <td>
                        {href ? (
                          <Link href={href} className="small-button">
                            開く
                          </Link>
                        ) : (
                          <span className="mini-text">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
