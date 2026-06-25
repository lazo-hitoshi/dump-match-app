"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/types/domain";
import { parseSkills } from "@/lib/format";
import type { TruckStatus } from "@/types/database";

async function db(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

async function requireProfile() {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("ログインが必要です");
  return profile;
}

function truckCode(): string {
  return `D-${Math.floor(Math.random() * 8999 + 1000)}`;
}

export async function createTruck(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await db();

  const payload = {
    company_id: isAdminRole(profile.role)
      ? String(formData.get("company_id") ?? profile.companyId)
      : profile.companyId,
    truck_code: truckCode(),
    plate_number: String(formData.get("plate_number") ?? ""),
    truck_type: String(formData.get("truck_type") ?? "大型ダンプ"),
    skills: parseSkills(String(formData.get("skills") ?? "")),
    base_address: String(formData.get("base_address") ?? "") || null,
    desired_daily_price: Number(formData.get("desired_daily_price") ?? 0) || null,
    status: String(formData.get("status") ?? "available") as TruckStatus,
  };

  const { data, error } = await supabase.from("trucks").insert(payload).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "登録に失敗しました");

  revalidatePath("/trucks");
  redirect(`/trucks/${(data as { id: string }).id}`);
}

export async function updateTruck(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  const supabase = await db();

  const payload = {
    plate_number: String(formData.get("plate_number") ?? ""),
    truck_type: String(formData.get("truck_type") ?? ""),
    skills: parseSkills(String(formData.get("skills") ?? "")),
    base_address: String(formData.get("base_address") ?? "") || null,
    desired_daily_price: Number(formData.get("desired_daily_price") ?? 0) || null,
    status: String(formData.get("status") ?? "available") as TruckStatus,
  };

  const { error } = await supabase.from("trucks").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/trucks");
  revalidatePath(`/trucks/${id}`);
  redirect(`/trucks/${id}`);
}

export async function createAvailability(formData: FormData) {
  await requireProfile();
  const truckId = String(formData.get("truck_id") ?? "");
  const supabase = await db();

  const { error } = await supabase.from("truck_availabilities").insert({
    truck_id: truckId,
    driver_id: String(formData.get("driver_id") ?? "") || null,
    available_start_date: String(formData.get("available_start_date") ?? ""),
    available_end_date: String(formData.get("available_end_date") ?? ""),
    area_note: String(formData.get("area_note") ?? "") || null,
    desired_daily_price: Number(formData.get("desired_daily_price") ?? 0) || null,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/trucks/${truckId}`);
}

export async function toggleAvailability(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id") ?? "");
  const truckId = String(formData.get("truck_id") ?? "");
  const isActive = formData.get("is_active") === "true";
  const supabase = await db();

  const { error } = await supabase
    .from("truck_availabilities")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/trucks/${truckId}`);
}
