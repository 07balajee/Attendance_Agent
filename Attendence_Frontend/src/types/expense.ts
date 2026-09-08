export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ExpenseRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  expense_type: string;
  amount: number; // INR (₹)
  applied_on: string;
  status: ExpenseStatus;
  description: string;
  management_note?: string | null;
  reviewed_by?: string | null; // e.g. "System (auto-escalated)"
  reviewed_on?: string | null;
  receipt_url?: string;
  age_bd?: number;
  sla_status?: 'normal' | 'warning' | 'breached';
}
