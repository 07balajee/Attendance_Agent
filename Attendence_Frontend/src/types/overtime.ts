export type OvertimeStatus = 'Pending' | 'Approved' | 'Rejected';

export interface OvertimeRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string; // Date overtime was worked
  hours: number;
  rate: number; // Hourly rate in INR (₹)
  amount: number; // Calculated: hours * rate
  applied_on: string;
  status: OvertimeStatus;
  reviewed_by?: string | null;
  reviewed_on?: string | null;
  management_note?: string | null;
  payroll_synced: boolean; // Synced to dynamic_checkup_data by Node 3
  age_bd?: number;
  sla_status?: 'normal' | 'warning' | 'breached';
}

export interface OvertimeMonthlySummary {
  totalHours: number;
  totalPay: number;
  syncedRecords: number;
  pendingRecords: number;
}
