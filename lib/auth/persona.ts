import type { CompanyType } from "@/types/database";
import type { UserProfile } from "@/types/domain";
import { isAdminRole } from "@/types/domain";

export type AppPersona = "admin" | "site" | "truck";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: "◆" },
  { href: "/sites", label: "現場", icon: "●" },
  { href: "/trucks", label: "ダンプ", icon: "■" },
  { href: "/match", label: "マッチ候補", icon: "◇" },
  { href: "/reservations", label: "予約", icon: "▼" },
  { href: "/companies", label: "会社審査", icon: "▲" },
  { href: "/audit-logs", label: "操作履歴", icon: "☰" },
  { href: "/notifications", label: "通知", icon: "◎" },
];

const SITE_NAV: NavItem[] = [
  { href: "/dashboard", label: "ホーム", icon: "◆" },
  { href: "/sites", label: "自社の現場", icon: "●" },
  { href: "/trucks", label: "近くのダンプ", icon: "■" },
  { href: "/reservations", label: "予約状況", icon: "▼" },
  { href: "/notifications", label: "通知", icon: "◎" },
];

const TRUCK_NAV: NavItem[] = [
  { href: "/dashboard", label: "ホーム", icon: "◆" },
  { href: "/trucks", label: "自社のダンプ", icon: "■" },
  { href: "/match", label: "マッチ候補", icon: "◇" },
  { href: "/sites", label: "現場を探す", icon: "●" },
  { href: "/reservations", label: "予約状況", icon: "▼" },
  { href: "/notifications", label: "通知", icon: "◎" },
];

export function getAppPersona(profile: UserProfile | null): AppPersona {
  if (!profile) return "truck";
  if (isAdminRole(profile.role) || profile.companyType === "operator") return "admin";
  if (profile.companyType === "site_company" || profile.companyType === "both") return "site";
  return "truck";
}

export function getNavItems(persona: AppPersona): NavItem[] {
  if (persona === "admin") return ADMIN_NAV;
  if (persona === "site") return SITE_NAV;
  return TRUCK_NAV;
}

export function getPortalTitle(persona: AppPersona): string {
  if (persona === "admin") return "運営管理";
  if (persona === "site") return "現場会社";
  return "ダンプ会社";
}

export function getPortalSubtitle(persona: AppPersona): string {
  if (persona === "admin") return "配車マッチング";
  if (persona === "site") return "現場ポータル";
  return "配車ポータル";
}

export function canAccessPath(persona: AppPersona, pathname: string): boolean {
  if (persona === "admin") return true;

  if (persona === "site") {
    const blocked = ["/match", "/companies", "/audit-logs"];
    if (pathname === "/trucks/new" || pathname.startsWith("/trucks/new/")) return false;
    return !blocked.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }

  if (pathname === "/sites/new") return false;
  const blocked = ["/companies", "/audit-logs"];
  return !blocked.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function companyTypeLabel(type: CompanyType | undefined): string {
  const labels: Record<CompanyType, string> = {
    operator: "運営",
    site_company: "現場会社",
    truck_company: "ダンプ会社",
    both: "両方",
  };
  return type ? labels[type] : "";
}
