import type { CompanyStatus, ReservationStatus, SiteStatus, TruckStatus } from "@/types/database";

export function yen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function dateLabel(value: string): string {
  return value.replaceAll("-", "/");
}

export function companyStatusLabel(status: CompanyStatus): string {
  const labels: Record<CompanyStatus, string> = {
    pending: "未審査",
    approved: "承認",
    rejected: "差戻し",
    suspended: "停止",
  };
  return labels[status];
}

export function companyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    operator: "運営",
    site_company: "現場会社",
    truck_company: "ダンプ会社",
    both: "両方",
  };
  return labels[type] ?? type;
}

export function truckStatusLabel(status: TruckStatus): string {
  const labels: Record<TruckStatus, string> = {
    available: "空き",
    held: "仮押さえ",
    booked: "予約済",
    unavailable: "停止",
  };
  return labels[status];
}

export function siteStatusClass(status: SiteStatus): string {
  if (status === "open") return "open";
  if (status === "filled") return "filled";
  if (status === "paused") return "warning";
  return "";
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

export function auditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    request_reservation: "予約申請",
    approve_reservation: "予約承認",
    cancel_reservation: "予約キャンセル",
    update_company_status: "会社審査",
  };
  return labels[action] ?? action;
}

export function auditTargetTypeLabel(targetType: string): string {
  const labels: Record<string, string> = {
    reservation: "予約",
    company: "会社",
    site: "現場",
    truck: "ダンプ",
  };
  return labels[targetType] ?? targetType;
}

export function parseSkills(value: string): string[] {
  return value
    .split(/[,、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
