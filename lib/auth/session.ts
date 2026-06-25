import { createClient } from "@/lib/supabase/server";
import type { CompanyType, UsersRow } from "@/types/database";
import type { UserProfile } from "@/types/domain";
import type { UserRole } from "@/types/database";

type UserWithCompany = UsersRow & {
  companies: { name: string; company_type: CompanyType } | null;
};

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, company_id, name, email, role, is_active, companies(name, company_type)")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as UserWithCompany | null;

  if (error || !row || !row.is_active || !row.companies) return null;

  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.companies.name,
    companyType: row.companies.company_type,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
    isActive: row.is_active,
  };
}
