import React from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';

interface AttendanceFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedDate: string;
  onDateChange: (v: string) => void;
  selectedDept: string;
  onDeptChange: (v: string) => void;
  selectedStatus: string;
  onStatusChange: (v: string) => void;
  onReset: () => void;
}

export const AttendanceFilterBar: React.FC<AttendanceFilterBarProps> = ({
  search,
  onSearchChange,
  selectedDate,
  onDateChange,
  selectedDept,
  onDeptChange,
  selectedStatus,
  onStatusChange,
  onReset,
}) => {
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

  const statuses = ['All', 'Present', 'Absent', 'Late', 'Working', 'Auto-closed'];

  const hasFilters =
    search !== '' ||
    selectedDate !== '2026-09-07' ||
    selectedDept !== 'All Departments' ||
    selectedStatus !== 'All';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-700">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => onDeptChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-700">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
