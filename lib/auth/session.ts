import { createClient } from "@/lib/supabase/server";
import type { UsersRow } from "@/types/database";
import type { UserProfile } from "@/types/domain";
import type { UserRole } from "@/types/database";

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, company_id, name, email, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as UsersRow | null;

  if (error || !profile || !profile.is_active) return null;

  return {
    id: profile.id,
    companyId: profile.company_id,
    name: profile.name,
    email: profile.email,
    role: profile.role as UserRole,
    isActive: profile.is_active,
  };
}
