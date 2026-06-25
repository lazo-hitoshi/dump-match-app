import { getCurrentUserProfile } from "@/lib/auth/session";
import { getAppPersona } from "@/lib/auth/persona";
import { AccessGuard } from "@/components/layout/access-guard";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUserProfile();
  const persona = getAppPersona(profile);

  return (
    <div className="app-shell">
      <Sidebar profile={profile} />
      <main className="main">
        <AccessGuard persona={persona}>{children}</AccessGuard>
      </main>
    </div>
  );
}
