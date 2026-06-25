"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { isAdminRole } from "@/types/domain";
import type { CompanyStatus } from "@/types/database";

async function db(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}
async function requireAdmin() {
  const profile = await getCurrentUserProfile();
  if (!profile || !isAdminRole(profile.role)) {
    throw new Error("管理者のみ実行できます");
  }
  return profile;
}

export async function updateCompanyStatus(formData: FormData) {
  const profile = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as CompanyStatus;
  const reviewNote = String(formData.get("review_note") ?? "") || null;

  const supabase = await db();

  const { data: before, error: fetchError } = await supabase
    .from("companies")
    .select("id, company_code, name, status, review_note")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!before) throw new Error("会社が見つかりません");

  const { data: after, error } = await supabase
    .from("companies")
    .update({ status, review_note: reviewNote })
    .eq("id", id)
    .select("id, company_code, name, status, review_note")
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorUserId: profile.id,
    action: "update_company_status",
    targetType: "company",
    targetId: id,
    beforeData: before as Record<string, unknown>,
    afterData: after as Record<string, unknown>,
  });

  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
}
