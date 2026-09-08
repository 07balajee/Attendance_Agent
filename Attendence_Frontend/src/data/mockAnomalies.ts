import { AnomalyRecord, AnomalySummaryStats } from '../types/anomaly';

export const MOCK_ANOMALIES: AnomalyRecord[] = [
  // ── Mike Employee (emp_004) — Multiple flags (Habitual Late + Missing Checkup + Repeated Absence + Excess Leave Pattern)
  {
    id: 'anom_001',
    employee_id: 'emp_004',
    employee_name: 'Mike Employee',
    department: 'Engineering',
    detected_signal: {
      type: 'habitual_late',
      title: 'Habitual Late Arrival',
      count: 5,
      threshold: 4,
      timeWindowDays: 30,
      message: 'Late arrival (sign-in after 09:30) on 5 days in the past 30 days.',
      severity: 'Critical',
      dates: ['2026-09-04 (09:48)', '2026-09-03 (09:52)', '2026-09-02 (09:40)', '2026-09-01 (10:05)', '2026-08-25 (09:55)'],
    },
    status: 'Under Review',
    detected_on: '2026-09-07T06:00:00',
    thread_id: 'attendance-emp_004-2026-09-07',
    draft_narrative:
      'The employee has recorded five late arrivals past 09:30 and two unapproved absences in the last 30 days, alongside three missing daily checkup logs. An SLA-breached leave request and overdue equipment expense remain open. Recommend conducting a structured 1-on-1 check-in to identify workload challenges or commute constraints.',
    supporting_data: {
      attendance_count: 22,
      late_days: ['2026-09-04', '2026-09-03', '2026-09-02', '2026-09-01', '2026-08-25'],
      absent_days: ['2026-09-07', '2026-08-28'],
      missing_checkup_days: ['2026-09-04', '2026-09-03', '2026-09-01'],
      excess_leave_count: 2,
      escalated_items_count: 2,
    },
  },
  {
    id: 'anom_002',
    employee_id: 'emp_004',
    employee_name: 'Mike Employee',
    department: 'Engineering',
    detected_signal: {
      type: 'missing_checkup',
      title: 'Missing Daily Checkup',
      count: 3,
      threshold: 3,
      timeWindowDays: 30,
      message: 'Signed in but no daily tasks/checkup submitted on 3 days in past 30 days.',
      severity: 'Warning',
      dates: ['2026-09-04', '2026-09-03', '2026-09-01'],
    },
    status: 'Under Review',
    detected_on: '2026-09-07T06:00:00',
    thread_id: 'attendance-emp_004-2026-09-07',
  },
  {
    id: 'anom_003',
    employee_id: 'emp_004',
    employee_name: 'Mike Employee',
    department: 'Engineering',
    detected_signal: {
      type: 'excess_leave_pattern',
      title: 'Excess Leave Pattern',
      count: 2,
      threshold: 2,
      timeWindowDays: 90,
      message: '2 excess-leave requests submitted exceeding remaining balance in past 90 days.',
      severity: 'Warning',
      dates: ['2026-08-01 (4 days req, 1 rem)', '2026-07-02 (5 days req, 2 rem)'],
    },
    status: 'Under Review',
    detected_on: '2026-09-07T06:00:00',
    thread_id: 'attendance-emp_004-2026-09-07',
  },

  // ── Neha Singh (emp_005) — Frequent Short Leave
  {
    id: 'anom_004',
    employee_id: 'emp_005',
    employee_name: 'Neha Singh',
    department: 'Product',
    detected_signal: {
      type: 'frequent_short_leave',
      title: 'Frequent Short Leave',
      count: 3,
      threshold: 3,
      timeWindowDays: 30,
      message: '3 single-day approved leaves taken within the past 30 days.',
      severity: 'Warning',
      dates: ['2026-09-01', '2026-08-21', '2026-08-14'],
    },
    status: 'Drafted',
    detected_on: '2026-09-07T05:30:00',
    thread_id: 'attendance-emp_005-2026-09-07',
    draft_narrative:
      'The employee has utilized 3 isolated single-day leaves across the past month, predominantly adjacent to weekends. While all leaves were pre-approved within policy, frequent short-notice disruptions may affect product delivery cycles. Recommend an informal review of quarterly leave planning.',
    supporting_data: {
      attendance_count: 21,
      single_day_leaves: ['2026-09-01', '2026-08-21', '2026-08-14'],
      late_days: [],
      absent_days: [],
    },
  },

  // ── Rohan Verma (emp_008) — Repeated Absence
  {
    id: 'anom_005',
    employee_id: 'emp_008',
    employee_name: 'Rohan Verma',
    department: 'Engineering',
    detected_signal: {
      type: 'repeated_absence',
      title: 'Repeated Absence',
      count: 2,
      threshold: 2,
      timeWindowDays: 30,
      message: '2 working days marked Absent without prior approved leave in past 30 days.',
      severity: 'Critical',
      dates: ['2026-09-04', '2026-08-26'],
    },
    status: 'Detected',
    detected_on: '2026-09-07T05:30:00',
    thread_id: 'attendance-emp_008-2026-09-07',
    draft_narrative:
      'The employee was marked Absent on two distinct working days without leave authorization in the preceding 30 days. Node 1 automatically created absent records nightly. Suggest HR connect with the employee to verify absence reporting compliance.',
    supporting_data: {
      attendance_count: 20,
      absent_days: ['2026-09-04', '2026-08-26'],
      late_days: ['2026-09-07'],
      missing_checkup_days: [],
    },
  },

  // ── Sanjay Gupta (emp_010) — Habitual Late Arrival
  {
    id: 'anom_006',
    employee_id: 'emp_010',
    employee_name: 'Sanjay Gupta',
    department: 'Operations',
    detected_signal: {
      type: 'habitual_late',
      title: 'Habitual Late Arrival',
      count: 4,
      threshold: 4,
      timeWindowDays: 30,
      message: 'Late sign-in (> 09:30) on 4 days in the past 30 days.',
      severity: 'Critical',
      dates: ['2026-09-07 (09:42)', '2026-09-04 (09:35)', '2026-09-02 (09:42)', '2026-08-31 (09:48)'],
    },
    status: 'Resolved',
    detected_on: '2026-09-05T06:00:00',
    draft_narrative:
      'The employee logged 4 sign-ins between 09:35 and 09:48 over the past 30 days. Infrastructure shifts and on-call night monitoring explain arrival timing.',
    approved_narrative:
      'The employee logged 4 sign-ins between 09:35 and 09:48 over the past 30 days due to late night on-call emergency response shifts. Manager approved adjusted 10:00 AM shift timing.',
    supporting_data: {
      attendance_count: 22,
      late_days: ['2026-09-07', '2026-09-04', '2026-09-02', '2026-08-31'],
    },
  },
];

export const MOCK_ANOMALY_STATS: AnomalySummaryStats = {
  total: 6,
  critical: 3,
  warning: 3,
  underReview: 3,
  resolved: 1,
};
