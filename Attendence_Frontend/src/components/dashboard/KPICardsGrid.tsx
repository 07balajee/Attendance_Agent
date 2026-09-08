import React from 'react';
import { StatCard } from '../common/StatCard';
import { useNavigate } from 'react-router-dom';

interface KPICardsGridProps {
  stats: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    lateArrivals: number;
    pendingLeave: number;
    pendingOvertime: number;
    pendingExpenses: number;
    activeAnomalies: number;
  };
}

export const KPICardsGrid: React.FC<KPICardsGridProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
      <StatCard
        title="Total Emp"
        value={stats.totalEmployees}
        color="gray"
        iconName="Users"
        description="All active employees"
      />
      <StatCard
        title="Present"
        value={stats.presentToday}
        color="green"
        iconName="UserCheck"
        description="Signed in today"
        onClick={() => navigate('/attendance?status=Present')}
      />
      <StatCard
        title="Absent"
        value={stats.absentToday}
        color="red"
        iconName="UserX"
        description="Auto-marked by Node 1"
        onClick={() => navigate('/attendance?status=Absent')}
      />
      <StatCard
        title="Late Arrivals"
        value={stats.lateArrivals}
        color="amber"
        iconName="Clock"
        description="Sign in > 09:30"
        onClick={() => navigate('/attendance?status=Late')}
      />
      <StatCard
        title="Pending Leave"
        value={stats.pendingLeave}
        color="blue"
        iconName="Calendar"
        description="Awaiting HR review"
        onClick={() => navigate('/leave')}
      />
      <StatCard
        title="Pending OT"
        value={stats.pendingOvertime}
        color="blue"
        iconName="Clock3"
        description="Unsynced OT claims"
        onClick={() => navigate('/overtime')}
      />
      <StatCard
        title="Pending Exp"
        value={stats.pendingExpenses}
        color="blue"
        iconName="Receipt"
        description="Reimbursement queue"
        onClick={() => navigate('/expenses')}
      />
      <StatCard
        title="Anomalies"
        value={stats.activeAnomalies}
        color="amber"
        iconName="AlertTriangle"
        description="Detected by Node 5"
        onClick={() => navigate('/anomalies')}
      />
    </div>
  );
};
