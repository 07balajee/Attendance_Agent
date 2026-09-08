export type AnomalyType =
  | 'habitual_late'
  | 'frequent_short_leave'
  | 'repeated_absence'
  | 'missing_checkup'
  | 'excess_leave_pattern';

export type AnomalySeverity = 'Critical' | 'Warning' | 'Low';
export type AnomalyStatus = 'Detected' | 'Drafted' | 'Under Review' | 'Resolved' | 'Dismissed';

export interface DetectedSignal {
  type: AnomalyType;
  title: string;
  count: number;
  threshold: number;
  timeWindowDays: number;
  message: string;
  severity: AnomalySeverity;
  dates?: string[];
}

export interface AnomalyRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  detected_signal: DetectedSignal;
  status: AnomalyStatus;
  detected_on: string; // ISO
  draft_narrative?: string;
  approved_narrative?: string;
  thread_id?: string;
  supporting_data?: {
    attendance_count: number;
    late_days?: string[];
    absent_days?: string[];
    single_day_leaves?: string[];
    missing_checkup_days?: string[];
    excess_leave_count?: number;
    escalated_items_count?: number;
  };
}

export interface AnomalySummaryStats {
  total: number;
  critical: number;
  warning: number;
  underReview: number;
  resolved: number;
}
