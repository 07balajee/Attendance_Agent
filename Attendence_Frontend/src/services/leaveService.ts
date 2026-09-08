import { LeaveRequest, EmployeeLeaveBalance, LeaveStatus } from '../types/leave';
import { MOCK_LEAVE_REQUESTS, MOCK_LEAVE_BALANCES } from '../data/mockLeaves';

let leaveRequests: LeaveRequest[] = [...MOCK_LEAVE_REQUESTS];
let leaveBalances: EmployeeLeaveBalance[] = [...MOCK_LEAVE_BALANCES];

export const leaveService = {
  async getLeaveRequests(filters?: {
    status?: LeaveStatus | 'All' | 'Excess Leave';
    type?: string;
    department?: string;
    search?: string;
  }): Promise<LeaveRequest[]> {
    await new Promise((r) => setTimeout(r, 150));
    let list = [...leaveRequests];

    if (filters?.status && filters.status !== 'All') {
      if (filters.status === 'Excess Leave') {
        list = list.filter((r) => r.is_excess_leave);
      } else {
        list = list.filter((r) => r.status === filters.status);
      }
    }
    if (filters?.type && filters.type !== 'All Types') {
      list = list.filter((r) => r.type === filters.type);
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
          r.type.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getLeaveBalances(employeeId?: string): Promise<EmployeeLeaveBalance[]> {
    await new Promise((r) => setTimeout(r, 100));
    if (employeeId) {
      return leaveBalances.filter((b) => b.employee_id === employeeId);
    }
    return leaveBalances;
  },

  async approveLeaveRequest(id: string, reviewer: string = 'HR Admin'): Promise<LeaveRequest> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = leaveRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Leave request not found');

    leaveRequests[idx] = {
      ...leaveRequests[idx],
      status: 'Approved',
      reviewed_by: reviewer,
      reviewed_on: new Date().toISOString(),
    };

    // Deduct balance
    const req = leaveRequests[idx];
    const balIdx = leaveBalances.findIndex(
      (b) => b.employee_id === req.employee_id && b.leave_type === req.type
    );
    if (balIdx >= 0) {
      leaveBalances[balIdx] = {
        ...leaveBalances[balIdx],
        used: leaveBalances[balIdx].used + req.days,
        remaining: Math.max(0, leaveBalances[balIdx].remaining - req.days),
      };
    }

    return leaveRequests[idx];
  },

  async rejectLeaveRequest(
    id: string,
    reviewer: string = 'HR Admin',
    reason: string = 'Rejected per policy'
  ): Promise<LeaveRequest> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = leaveRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Leave request not found');

    leaveRequests[idx] = {
      ...leaveRequests[idx],
      status: 'Rejected',
      reviewed_by: reviewer,
      reviewed_on: new Date().toISOString(),
      management_note: reason,
    };

    return leaveRequests[idx];
  },
};
