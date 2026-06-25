"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/types/domain";

async function db(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

async function requireProfile() {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("ログインが必要です");
  return profile;
}

export async function requestReservation(formData: FormData) {
  await requireProfile();
  const supabase = await db();

  const siteId = String(formData.get("site_id") ?? "");
  const truckId = String(formData.get("truck_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const note = String(formData.get("note") ?? "") || null;
  const driverId = String(formData.get("driver_id") ?? "") || null;

  const { data, error } = await supabase.rpc("request_reservation", {
    p_site_id: siteId,
    p_truck_id: truckId,
    p_driver_id: driverId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_note: note,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/reservations");
  revalidatePath("/match");
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
  redirect(`/reservations/${(data as { id: string }).id}`);
}

export async function approveReservation(formData: FormData) {
  const profile = await requireProfile();
  if (!isAdminRole(profile.role)) throw new Error("管理者のみ承認できます");

  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "") || null;

  const { error } = await supabase.rpc("approve_reservation", {
    p_reservation_id: id,
    p_reason: reason,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
}

export async function cancelReservation(formData: FormData) {
  await requireProfile();
  const supabase = await db();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "キャンセル");

  const { error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: id,
    p_reason: reason,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
}

export async function markNotificationRead(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await db();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", profile.id);

  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
}
