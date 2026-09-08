export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  remaining_balance: number;
  applied_on: string; // ISO or YYYY-MM-DD
  status: LeaveStatus;
  is_excess_leave: boolean;
  management_note?: string | null;
  reviewed_by?: string | null;
  reviewed_on?: string | null;
  age_bd?: number; // Business days since applied_on
  sla_status?: 'normal' | 'warning' | 'breached';
}

export interface EmployeeLeaveBalance {
  employee_id: string;
  employee_name: string;
  leave_type: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
}
