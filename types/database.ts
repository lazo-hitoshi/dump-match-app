export type CompanyStatus = "pending" | "approved" | "rejected" | "suspended";
export type CompanyType = "site_company" | "truck_company" | "both" | "operator";
export type UserRole =
  | "system_admin"
  | "operator"
  | "company_admin"
  | "dispatcher"
  | "driver"
  | "viewer";
export type SiteStatus = "draft" | "open" | "paused" | "filled" | "completed" | "canceled";
export type TruckStatus = "available" | "held" | "booked" | "unavailable";
export type DriverStatus = "active" | "inactive" | "suspended";
export type ReservationStatus =
  | "requested"
  | "approved"
  | "booked"
  | "in_progress"
  | "completed"
  | "canceled"
  | "rejected";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type UsersRow = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteReservationSummaryRow = {
  site_id: string;
  required_truck_count: number;
  booked_count: number;
  remaining_count: number;
  is_filled: boolean;
};

export type ReservationRow = {
  id: string;
  reservation_code: string;
  site_id: string;
  truck_id: string;
  driver_id: string | null;
  applicant_company_id: string;
  approved_by: string | null;
  start_date: string;
  end_date: string;
  fixed_daily_price: number;
  status: ReservationStatus;
  cancel_reason: string | null;
  note: string | null;
  requested_at: string;
  approved_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      companies: PublicTable;
      users: { Row: UsersRow; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      drivers: PublicTable;
      trucks: PublicTable;
      sites: PublicTable;
      truck_availabilities: PublicTable;
      reservations: { Row: ReservationRow; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      reservation_status_logs: PublicTable;
      notifications: PublicTable;
      documents: PublicTable;
      messages: PublicTable;
      audit_logs: PublicTable;
    };
    Views: {
      site_reservation_summary: {
        Row: SiteReservationSummaryRow;
        Relationships: [];
      };
    };
    Functions: {
      request_reservation: {
        Args: {
          p_site_id: string;
          p_truck_id: string;
          p_driver_id: string | null;
          p_start_date: string;
          p_end_date: string;
          p_note?: string | null;
        };
        Returns: ReservationRow;
      };
      approve_reservation: {
        Args: {
          p_reservation_id: string;
          p_reason?: string | null;
        };
        Returns: ReservationRow;
      };
      cancel_reservation: {
        Args: {
          p_reservation_id: string;
          p_reason: string;
        };
        Returns: ReservationRow;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
