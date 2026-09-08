import { OvertimeRequest, OvertimeMonthlySummary, OvertimeStatus } from '../types/overtime';
import { MOCK_OVERTIME_REQUESTS, MOCK_OVERTIME_SUMMARY } from '../data/mockOvertime';

let overtimeRequests: OvertimeRequest[] = [...MOCK_OVERTIME_REQUESTS];

export const overtimeService = {
  async getOvertimeRequests(filters?: {
    status?: OvertimeStatus | 'All' | 'Payroll Synced';
    department?: string;
    search?: string;
  }): Promise<OvertimeRequest[]> {
    await new Promise((r) => setTimeout(r, 150));
    let list = [...overtimeRequests];

    if (filters?.status && filters.status !== 'All') {
      if (filters.status === 'Payroll Synced') {
        list = list.filter((r) => r.payroll_synced);
      } else {
        list = list.filter((r) => r.status === filters.status);
      }
    }
    if (filters?.department && filters.department !== 'All Departments') {
      list = list.filter((r) => r.department === filters.department);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.employee_id.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getOvertimeSummary(): Promise<OvertimeMonthlySummary> {
    await new Promise((r) => setTimeout(r, 100));
    const approved = overtimeRequests.filter((r) => r.status === 'Approved');
    const totalHours = approved.reduce((sum, r) => sum + r.hours, 0);
    const totalPay = approved.reduce((sum, r) => sum + r.amount, 0);
    const syncedRecords = approved.filter((r) => r.payroll_synced).length;
    const pendingRecords = overtimeRequests.filter((r) => r.status === 'Pending').length;

    return {
      totalHours,
      totalPay,
      syncedRecords,
      pendingRecords,
    };
  },

  async approveOvertime(id: string, reviewer: string = 'Manager'): Promise<OvertimeRequest> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = overtimeRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Overtime request not found');

    overtimeRequests[idx] = {
      ...overtimeRequests[idx],
      status: 'Approved',
      reviewed_by: reviewer,
      reviewed_on: new Date().toISOString(),
      payroll_synced: true, // Node 3 would sync this into dynamic_checkup_data
      management_note: 'Approved. Overtime hours and amount synced to dynamic_checkup_data by Node 3.',
    };

    return overtimeRequests[idx];
  },

  async rejectOvertime(
    id: string,
    reviewer: string = 'Manager',
    reason: string = 'Overtime hours not justified'
  ): Promise<OvertimeRequest> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = overtimeRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Overtime request not found');

    overtimeRequests[idx] = {
      ...overtimeRequests[idx],
      status: 'Rejected',
      reviewed_by: reviewer,
      reviewed_on: new Date().toISOString(),
      management_note: reason,
      payroll_synced: false,
    };

    return overtimeRequests[idx];
  },
};
