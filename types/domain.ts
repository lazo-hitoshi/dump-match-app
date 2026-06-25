import type {
  CompanyStatus,
  CompanyType,
  ReservationStatus,
  SiteStatus,
  TruckStatus,
  UserRole,
} from "@/types/database";

export type Company = {
  id: string;
  companyCode: string;
  companyType: CompanyType;
  name: string;
  status: CompanyStatus;
};

export type UserProfile = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export type SiteSummary = {
  id: string;
  siteCode: string;
  name: string;
  address: string;
  startDate: string;
  endDate: string;
  requiredTruckCount: number;
  bookedCount: number;
  remainingCount: number;
  dailyPrice: number;
  requiredSkills: string[];
  status: SiteStatus;
};

export type TruckSummary = {
  id: string;
  truckCode: string;
  plateNumber: string;
  truckType: string;
  skills: string[];
  desiredDailyPrice: number | null;
  status: TruckStatus;
  companyName: string;
};

export type MatchCandidate = {
  siteId: string;
  siteName: string;
  truckId: string;
  truckCode: string;
  companyName: string;
  score: number;
  priceDiff: number;
  distanceKm: number | null;
};

export type ReservationSummary = {
  id: string;
  reservationCode: string;
  siteName: string;
  truckCode: string;
  status: ReservationStatus;
  startDate: string;
  endDate: string;
  fixedDailyPrice: number;
};

export const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = [
  "approved",
  "booked",
  "in_progress",
];

export const ADMIN_ROLES: UserRole[] = ["system_admin", "operator"];

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function siteStatusLabel(status: SiteStatus): string {
  const labels: Record<SiteStatus, string> = {
    draft: "下書き",
    open: "募集中",
    paused: "一時停止",
    filled: "充足",
    completed: "完了",
    canceled: "キャンセル",
  };
  return labels[status];
}

export function reservationStatusLabel(status: ReservationStatus): string {
  const labels: Record<ReservationStatus, string> = {
    requested: "申請中",
    approved: "承認済",
    booked: "予約済",
    in_progress: "稼働中",
    completed: "完了",
    canceled: "キャンセル",
    rejected: "却下",
  };
  return labels[status];
}

export function skillsMatch(required: string[], available: string[]): boolean {
  return required.every((skill) => available.includes(skill));
}

export function remainingCount(required: number, booked: number): number {
  return Math.max(0, required - booked);
}

export function openMaps(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
