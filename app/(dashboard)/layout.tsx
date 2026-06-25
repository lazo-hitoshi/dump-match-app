import { getCurrentUserProfile } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentUserProfile();

  return (
    <div className="app-shell">
      <Sidebar profile={profile} />
      <main className="main">{children}</main>
    </div>
  );
}
