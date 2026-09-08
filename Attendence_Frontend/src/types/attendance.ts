export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Working'
  | 'Auto-closed';

export interface DynamicCheckupData {
  overtime_hours?: number;
  overtime_amount?: number;
  overtime_rate?: number;
  ot_synced_by_agent?: boolean;
  monthly_ot_hours?: number;
  monthly_ot_pay?: number;
  monthly_ot_synced_by_agent?: boolean;
  anomaly_note?: string;
  anomaly_flagged_by_agent?: boolean;
  anomaly_flags?: string[];
  [key: string]: any;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string; // YYYY-MM-DD
  first_sign_in: string | null; // ISO string
  last_sign_out: string | null; // ISO string
  is_signed_in: boolean;
  approval_status: AttendanceStatus;
  tasks_done: string | null;
  extra_notes?: string | null; // e.g. "WFO", "WFH"
  dynamic_checkup_data?: DynamicCheckupData;
  created_by_node1_absence?: boolean;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  working: number;
  autoClosed: number;
  total: number;
}
