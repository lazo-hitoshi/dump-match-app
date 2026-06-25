import type { SupabaseClient } from "@supabase/supabase-js";

type AuditLogInput = {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
};

export async function writeAuditLog(
  supabase: SupabaseClient,
  input: AuditLogInput,
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    before_data: input.beforeData ?? null,
    after_data: input.afterData ?? null,
  });

  if (error) throw new Error(error.message);
}
