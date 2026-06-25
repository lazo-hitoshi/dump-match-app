"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/types/domain";
import { parseSkills } from "@/lib/format";
import type { SiteStatus } from "@/types/database";

async function db(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

async function requireProfile() {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("ログインが必要です");
  return profile;
}

function siteCode(): string {
  return `S-${Math.floor(Math.random() * 8999 + 1000)}`;
}

export async function createSite(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await db();

  const payload = {
    company_id: isAdminRole(profile.role)
      ? String(formData.get("company_id") ?? profile.companyId)
      : profile.companyId,
    site_code: siteCode(),
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    start_date: String(formData.get("start_date") ?? ""),
    end_date: String(formData.get("end_date") ?? ""),
    required_truck_count: Number(formData.get("required_truck_count") ?? 1),
    required_skills: parseSkills(String(formData.get("required_skills") ?? "")),
    daily_price: Number(formData.get("daily_price") ?? 0),
    payment_terms: String(formData.get("payment_terms") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    status: String(formData.get("status") ?? "draft") as SiteStatus,
    created_by: profile.id,
  };

  const { data, error } = await supabase.from("sites").insert(payload).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "登録に失敗しました");

  revalidatePath("/sites");
  revalidatePath("/dashboard");
  redirect(`/sites/${(data as { id: string }).id}`);
}

export async function updateSite(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  const supabase = await db();

  const payload = {
    name: String(formData.get("name") ?? ""),
    address: String(formData.get("address") ?? ""),
    start_date: String(formData.get("start_date") ?? ""),
    end_date: String(formData.get("end_date") ?? ""),
    required_truck_count: Number(formData.get("required_truck_count") ?? 1),
    required_skills: parseSkills(String(formData.get("required_skills") ?? "")),
    daily_price: Number(formData.get("daily_price") ?? 0),
    payment_terms: String(formData.get("payment_terms") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    status: String(formData.get("status") ?? "draft") as SiteStatus,
  };

  const { error } = await supabase.from("sites").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/sites");
  revalidatePath(`/sites/${id}`);
  revalidatePath("/dashboard");
  redirect(`/sites/${id}`);
}
