import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Calendar, UserX, CheckSquare, Layers, ArrowRight } from 'lucide-react';
import { AnomalyRecord } from '../../types/anomaly';

interface AnomalyOverviewWidgetProps {
  anomalies: AnomalyRecord[];
}

export const AnomalyOverviewWidget: React.FC<AnomalyOverviewWidgetProps> = ({ anomalies }) => {
  const navigate = useNavigate();

  const lateCount = anomalies.filter((a) => a.detected_signal.type === 'habitual_late').length;
  const shortLeaveCount = anomalies.filter(
    (a) => a.detected_signal.type === 'frequent_short_leave'
  ).length;
  const absentCount = anomalies.filter((a) => a.detected_signal.type === 'repeated_absence').length;
  const missingCheckupCount = anomalies.filter(
    (a) => a.detected_signal.type === 'missing_checkup'
  ).length;
  const excessLeaveCount = anomalies.filter(
    (a) => a.detected_signal.type === 'excess_leave_pattern'
  ).length;

  const categories = [
    {
      title: 'Habitual Late Arrival',
      rule: '≥ 4 late sign-ins (>09:30) in 30d',
      count: lateCount,
      icon: Clock,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Frequent Short Leave',
      rule: '≥ 3 single-day leaves in 30d',
      count: shortLeaveCount,
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Repeated Absence',
      rule: '≥ 2 absent rows in 30d',
      count: absentCount,
      icon: UserX,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'Missing Checkup',
      rule: '≥ 3 signed-in without tasks_done in 30d',
      count: missingCheckupCount,
      icon: CheckSquare,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Excess Leave Pattern',
      rule: '≥ 2 excess requests in 90d',
      count: excessLeaveCount,
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Behavioral Anomaly Signals
            </h3>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              Node 5 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Exact 30-day & 90-day threshold monitoring defined in HLD
          </p>
        </div>
        <button
          onClick={() => navigate('/anomalies')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
        >
          <span>View Anomaly Center</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.title}
              onClick={() => navigate('/anomalies')}
              className={`cursor-pointer rounded-xl border p-3 transition-all hover:shadow-xs ${cat.color}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4" />
                <span className="text-lg font-black">{cat.count}</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-900 line-clamp-1">
                {cat.title}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-1">{cat.rule}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
