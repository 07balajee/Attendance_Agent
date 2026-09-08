import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { KPICardsGrid } from '../components/dashboard/KPICardsGrid';
import { TodayAttendanceTable } from '../components/dashboard/TodayAttendanceTable';
import { PendingRequestsTabs } from '../components/dashboard/PendingRequestsTabs';
import { SLAOverviewWidget } from '../components/dashboard/SLAOverviewWidget';
import { AnomalyOverviewWidget } from '../components/dashboard/AnomalyOverviewWidget';
import { EmployeeAttendanceDrawer } from '../components/attendance/EmployeeAttendanceDrawer';
import { LeaveDetailDrawer } from '../components/leave/LeaveDetailDrawer';
import { OvertimeDetailDrawer } from '../components/overtime/OvertimeDetailDrawer';
import { ExpenseDetailDrawer } from '../components/expenses/ExpenseDetailDrawer';

import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { overtimeService } from '../services/overtimeService';
import { expenseService } from '../services/expenseService';
import { anomalyService } from '../services/anomalyService';

import { AttendanceRecord } from '../types/attendance';
import { LeaveRequest } from '../types/leave';
import { OvertimeRequest } from '../types/overtime';
import { ExpenseRequest } from '../types/expense';
import { AnomalyRecord } from '../types/anomaly';
import { useToast } from '../hooks/useToast';

export const Dashboard: React.FC = () => {
  const { selectedDepartment } = useOutletContext<{ selectedDepartment: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);

  // Drawers state
  const [selectedAttRecord, setSelectedAttRecord] = useState<AttendanceRecord | null>(null);
  const [attHistory, setAttHistory] = useState<AttendanceRecord[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeRequest | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);

  const loadData = async () => {
    try {
      const [att, leaves, ot, exp, anom] = await Promise.all([
        attendanceService.getAttendanceRecords({
          date: '2026-09-07',
          department: selectedDepartment,
        }),
        leaveService.getLeaveRequests({ department: selectedDepartment }),
        overtimeService.getOvertimeRequests({ department: selectedDepartment }),
        expenseService.getExpenses({ department: selectedDepartment }),
        anomalyService.getAnomalies({ department: selectedDepartment }),
      ]);

      setAttendanceRecords(att);
      setLeaveRequests(leaves);
      setOvertimeRequests(ot);
      setExpenses(exp);
      setAnomalies(anom);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepartment]);

  // Handle viewing an employee's details
  const handleViewEmployee = async (record: AttendanceRecord) => {
    setSelectedAttRecord(record);
    const history = await attendanceService.getEmployeeAttendanceHistory(record.employee_id);
    setAttHistory(history);
  };

  // KPI calculations
  const totalEmployees = 15;
  const presentToday = attendanceRecords.filter((r) => r.approval_status === 'Present' || r.approval_status === 'Working').length;
  const absentToday = attendanceRecords.filter((r) => r.approval_status === 'Absent').length;
  const lateArrivals = attendanceRecords.filter((r) => r.approval_status === 'Late').length;
  const pendingLeave = leaveRequests.filter((r) => r.status === 'Pending').length;
  const pendingOvertime = overtimeRequests.filter((r) => r.status === 'Pending').length;
  const pendingExpenses = expenses.filter((r) => r.status === 'Pending').length;
  const activeAnomalies = anomalies.filter((a) => a.status === 'Under Review' || a.status === 'Drafted').length;

  // SLA counts
  const approachingCount =
    leaveRequests.filter((r) => r.status === 'Pending' && (r.age_bd || 0) >= 2 && (r.age_bd || 0) < 5).length +
    overtimeRequests.filter((r) => r.status === 'Pending' && (r.age_bd || 0) >= 2 && (r.age_bd || 0) < 5).length +
    expenses.filter((r) => r.status === 'Pending' && (r.age_bd || 0) >= 2 && (r.age_bd || 0) < 5).length;

  const breachedCount =
    leaveRequests.filter((r) => r.status === 'Pending' && (r.age_bd || 0) >= 5).length +
    overtimeRequests.filter((r) => r.status === 'Pending' && (r.age_bd || 0) >= 5).length +
    expenses.filter((r) => r.status === 'Pending' && (r.age_bd || 0) >= 5).length;

  const escalatedCount = expenses.filter((r) => r.reviewed_by?.includes('auto-escalated')).length;

  return (
    <div className="space-y-6">
      {/* 8 KPI Cards */}
      <KPICardsGrid
        stats={{
          totalEmployees,
          presentToday,
          absentToday,
          lateArrivals,
          pendingLeave,
          pendingOvertime,
          pendingExpenses,
          activeAnomalies,
        }}
      />

      {/* Main Grid: Today's Attendance & Pending Requests */}
      <div className="space-y-6">
        <TodayAttendanceTable
          records={attendanceRecords}
          onViewEmployee={handleViewEmployee}
        />

        <PendingRequestsTabs
          leaveRequests={leaveRequests}
          overtimeRequests={overtimeRequests}
          expenses={expenses}
          onReviewLeave={setSelectedLeave}
          onReviewOvertime={setSelectedOvertime}
          onReviewExpense={setSelectedExpense}
        />
      </div>

      {/* Bottom Grid: SLA Watchdog Overview & Anomaly Signals Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SLAOverviewWidget
          approachingCount={approachingCount}
          breachedCount={breachedCount}
          escalatedCount={escalatedCount}
        />

        <AnomalyOverviewWidget anomalies={anomalies} />
      </div>

      {/* Slide-over Drawers */}
      <EmployeeAttendanceDrawer
        isOpen={!!selectedAttRecord}
        onClose={() => setSelectedAttRecord(null)}
        record={selectedAttRecord}
        history={attHistory}
      />

      <LeaveDetailDrawer
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        request={selectedLeave}
        onApprove={async (id) => {
          await leaveService.approveLeaveRequest(id);
          showToast('success', 'Leave Approved', 'The leave request status was updated to Approved.');
          loadData();
        }}
        onReject={async (id, reason) => {
          await leaveService.rejectLeaveRequest(id, 'HR Admin', reason);
          showToast('info', 'Leave Rejected', 'The request was marked as Rejected with your feedback.');
          loadData();
        }}
      />

      <OvertimeDetailDrawer
        isOpen={!!selectedOvertime}
        onClose={() => setSelectedOvertime(null)}
        request={selectedOvertime}
        onApprove={async (id) => {
          await overtimeService.approveOvertime(id);
          showToast('success', 'Overtime Approved', 'Approved and synced to dynamic_checkup_data by Node 3.');
          loadData();
        }}
        onReject={async (id, reason) => {
          await overtimeService.rejectOvertime(id, 'Manager', reason);
          showToast('info', 'Overtime Rejected', 'The claim has been rejected.');
          loadData();
        }}
      />

      <ExpenseDetailDrawer
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onApprove={async (id) => {
          await expenseService.approveExpense(id);
          showToast('success', 'Reimbursement Approved', 'Payment authorization submitted.');
          loadData();
        }}
        onReject={async (id, reason) => {
          await expenseService.rejectExpense(id, 'Finance Manager', reason);
          showToast('info', 'Reimbursement Rejected', 'The reimbursement was rejected.');
          loadData();
        }}
      />
    </div>
  );
};
