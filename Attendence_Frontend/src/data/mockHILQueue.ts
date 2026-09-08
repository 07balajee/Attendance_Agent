import { HILQueueItem } from '../types/agent';

export const MOCK_HIL_QUEUE: HILQueueItem[] = [
  {
    id: 'hil_001',
    thread_id: 'attendance-emp_004-2026-09-07',
    employee_id: 'emp_004',
    employee_name: 'Mike Employee',
    department: 'Engineering',
    run_date: '2026-09-07',
    anomaly_types: ['Habitual Late Arrival', 'Missing Daily Checkup', 'Repeated Absence', 'Excess Leave Pattern'],
    flags: {
      habitual_late: { count: 5, threshold: 4, message: 'Late arrival (09:30+) on 5 days in past 30.' },
      missing_checkup: { count: 3, threshold: 3, message: 'Signed in but no checkup on 3 days.' },
      repeated_absence: { count: 2, threshold: 2, message: '2 unapproved absences in past 30 days.' },
      excess_leave_pattern: { count: 2, threshold: 2, message: '2 excess-leave requests in past 90 days.' },
    },
    draft_narrative:
      'The employee has recorded five late arrivals past 09:30 and two unapproved absences in the last 30 days, alongside three missing daily checkup logs. An SLA-breached leave request and overdue equipment expense remain open. Recommend conducting a structured 1-on-1 check-in to identify workload challenges or commute constraints.',
    created_at: '2026-09-07T05:30:19',
    waiting_minutes: 45,
    assigned_reviewer: 'Ananya Iyer (HR Operations)',
    status: 'Waiting for Review',
  },
  {
    id: 'hil_002',
    thread_id: 'attendance-emp_005-2026-09-07',
    employee_id: 'emp_005',
    employee_name: 'Neha Singh',
    department: 'Product',
    run_date: '2026-09-07',
    anomaly_types: ['Frequent Short Leave'],
    flags: {
      frequent_short_leave: { count: 3, threshold: 3, message: '3 single-day approved leaves in past 30 days.' },
    },
    draft_narrative:
      'The employee has utilized 3 isolated single-day leaves across the past month, predominantly adjacent to weekends. While all leaves were pre-approved within policy, frequent short-notice disruptions may affect product delivery cycles. Recommend an informal review of quarterly leave planning.',
    created_at: '2026-09-07T05:33:06',
    waiting_minutes: 42,
    assigned_reviewer: 'Ananya Iyer (HR Operations)',
    status: 'Waiting for Review',
  },
  {
    id: 'hil_003',
    thread_id: 'attendance-emp_008-2026-09-06',
    employee_id: 'emp_008',
    employee_name: 'Rohan Verma',
    department: 'Engineering',
    run_date: '2026-09-06',
    anomaly_types: ['Repeated Absence'],
    flags: {
      repeated_absence: { count: 2, threshold: 2, message: '2 days marked Absent without prior leave in past 30 days.' },
    },
    draft_narrative:
      'The employee was marked Absent on two distinct working days without leave authorization in the preceding 30 days. Node 1 automatically created absent records nightly. Suggest HR connect with the employee to verify absence reporting compliance.',
    created_at: '2026-09-06T23:30:45',
    waiting_minutes: 410,
    assigned_reviewer: 'Pooja Joshi (HR Partner)',
    status: 'Waiting for Review',
  },
];
