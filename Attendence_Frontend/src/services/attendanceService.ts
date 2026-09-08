import { AttendanceRecord, AttendanceSummary } from '../types/attendance';
import { MOCK_ATTENDANCE_RECORDS } from '../data/mockAttendance';

let attendanceData: AttendanceRecord[] = [...MOCK_ATTENDANCE_RECORDS];

export const attendanceService = {
  async getAttendanceRecords(filters?: {
    date?: string;
    department?: string;
    status?: string;
    search?: string;
  }): Promise<AttendanceRecord[]> {
    // Simulate slight network delay
    await new Promise((r) => setTimeout(r, 150));

    let result = [...attendanceData];

    if (filters?.date) {
      result = result.filter((r) => r.date === filters.date);
    }
    if (filters?.department && filters.department !== 'All Departments') {
      result = result.filter((r) => r.department === filters.department);
    }
    if (filters?.status && filters.status !== 'All') {
      result = result.filter((r) => r.approval_status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.employee_id.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
      );
    }

    return result;
  },

  async getAttendanceSummary(date: string = '2026-09-07'): Promise<AttendanceSummary> {
    await new Promise((r) => setTimeout(r, 100));
    const records = attendanceData.filter((r) => r.date === date);

    const present = records.filter((r) => r.approval_status === 'Present').length;
    const absent = records.filter((r) => r.approval_status === 'Absent').length;
    const late = records.filter((r) => r.approval_status === 'Late').length;
    const working = records.filter((r) => r.approval_status === 'Working').length;
    const autoClosed = records.filter((r) => r.approval_status === 'Auto-closed').length;

    return {
      present,
      absent,
      late,
      working,
      autoClosed,
      total: records.length,
    };
  },

  async getEmployeeAttendanceHistory(employeeId: string): Promise<AttendanceRecord[]> {
    await new Promise((r) => setTimeout(r, 150));
    return attendanceData
      .filter((r) => r.employee_id === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async markAbsent(employeeId: string, date: string): Promise<AttendanceRecord> {
    await new Promise((r) => setTimeout(r, 200));
    const existingIndex = attendanceData.findIndex(
      (r) => r.employee_id === employeeId && r.date === date
    );

    if (existingIndex >= 0) {
      attendanceData[existingIndex] = {
        ...attendanceData[existingIndex],
        is_signed_in: false,
        approval_status: 'Absent',
        created_by_node1_absence: true,
      };
      return attendanceData[existingIndex];
    } else {
      const newRec: AttendanceRecord = {
        id: `att_absent_${Date.now()}`,
        employee_id: employeeId,
        employee_name: 'Employee',
        department: 'General',
        date,
        first_sign_in: null,
        last_sign_out: null,
        is_signed_in: false,
        approval_status: 'Absent',
        tasks_done: null,
        created_by_node1_absence: true,
      };
      attendanceData.unshift(newRec);
      return newRec;
    }
  },
};
