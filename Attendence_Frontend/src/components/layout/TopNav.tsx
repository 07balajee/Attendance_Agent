import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Calendar,
  Filter,
  User,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface TopNavProps {
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  isLiveBackend: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  selectedDepartment,
  onDepartmentChange,
  isLiveBackend,
}) => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine page title & breadcrumbs based on route
  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Attendance Dashboard', breadcrumb: 'Dashboard' };
      case '/attendance':
        return { title: 'Attendance Management', breadcrumb: 'Attendance' };
      case '/leave':
        return { title: 'Leave Management', breadcrumb: 'Leave Quotas & Requests' };
      case '/overtime':
        return { title: 'Overtime & Payroll Sync', breadcrumb: 'Overtime' };
      case '/expenses':
        return { title: 'Expenses & Reimbursements', breadcrumb: 'Expenses' };
      case '/sla':
        return { title: 'SLA Monitoring & Escalations', breadcrumb: 'SLA Center' };
      case '/anomalies':
        return { title: 'Behavioral Anomaly Center', breadcrumb: 'Anomalies' };
      case '/orchestration':
        return { title: 'Attendance Agentic Orchestration', breadcrumb: 'LangGraph Engine' };
      case '/settings':
        return { title: 'Attendance Automation Settings', breadcrumb: 'Settings' };
      default:
        return { title: 'HRMS Attendance Module', breadcrumb: 'Module' };
    }
  };

  const { title, breadcrumb } = getPageMeta();

  const departments = [
    'All Departments',
    'Engineering',
    'Product',
    'Operations',
    'Finance',
    'Human Resources',
    'Design',
    'Sales',
  ];

  const notifications = [
    {
      id: '1',
      title: 'HIL Review Required',
      desc: 'Mike Employee (emp_004) flagged for 4 anomaly signals. AI draft ready.',
      time: '12m ago',
      urgent: true,
    },
    {
      id: '2',
      title: 'SLA Breach Auto-Escalated',
      desc: 'Expense claim exp_001 pending 9 days stamped as System (auto-escalated).',
      time: '35m ago',
      urgent: true,
    },
    {
      id: '3',
      title: 'Node 3 Payroll Sync',
      desc: 'Synced ₹2,400 OT into Priya Patel dynamic_checkup_data.',
      time: '2h ago',
      urgent: false,
    },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-xs">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <span>Attendance Module</span>
          <span>/</span>
          <span className="text-slate-600 font-semibold">{breadcrumb}</span>
        </div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      {/* Middle: Global Search & Dept Filter */}
      <div className="hidden md:flex items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, ID, request... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Side: Status, Date, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Live Backend Indicator */}
        <div className="hidden lg:flex items-center gap-1.5">
          {isLiveBackend ? (
            <Badge variant="green" size="sm" dot>
              Port 8001 Live
            </Badge>
          ) : (
            <Badge variant="blue" size="sm" dot>
              Simulated Mode
            </Badge>
          )}
        </div>

        {/* Current Date */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Mon, 7 Sep 2026</span>
        </div>

        {/* Notification Bell with Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <span className="text-xs font-bold text-slate-900">Agent & SLA Alerts</span>
                <span className="text-[10px] bg-rose-50 text-rose-600 font-semibold px-2 py-0.5 rounded-full">
                  2 Critical
                </span>
              </div>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl p-2.5 border transition-colors ${
                      n.urgent
                        ? 'bg-rose-50/40 border-rose-100/80'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs">
            HR
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-none">Ananya Iyer</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">HR Operations Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
