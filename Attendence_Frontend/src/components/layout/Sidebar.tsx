import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Clock,
  Receipt,
  ShieldAlert,
  AlertTriangle,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  hilCount?: number;
  slaBreachCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  hilCount = 2,
  slaBreachCount = 3,
}) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Leave Management', path: '/leave', icon: CalendarDays },
    { name: 'Overtime', path: '/overtime', icon: Clock },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    {
      name: 'SLA & Escalations',
      path: '/sla',
      icon: ShieldAlert,
      badge: slaBreachCount > 0 ? `${slaBreachCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      name: 'Anomaly Center',
      path: '/anomalies',
      icon: AlertTriangle,
      badge: hilCount > 0 ? `${hilCount} HIL` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      name: 'Agent Orchestration',
      path: '/orchestration',
      icon: Bot,
      highlight: true,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 tracking-tight">OxiqAI HRMS</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                  POC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate">Attendance Module</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Layers className="h-5 w-5" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Attendance & Agents
          </div>
        )}

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
            title={collapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                {!collapsed && item.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !collapsed && (
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-slate-100">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              System
            </div>
          )}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-slate-600" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </div>
      </div>

      {/* Footer Banner */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>LangGraph Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            5 Subagent Nodes • 1 Thread per Employee • HIL Checkpointer
          </p>
        </div>
      ) : (
        <div className="p-3 text-center">
          <Bot className="h-4 w-4 mx-auto text-blue-600" />
        </div>
      )}
    </aside>
  );
};
