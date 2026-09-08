import React from 'react';
import { StatusColor } from '../../types/common';
import * as LucideIcons from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: StatusColor;
  iconName?: string;
  description?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend,
  color = 'blue',
  iconName = 'Activity',
  description,
  onClick,
}) => {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Activity;

  const colorVariants: Record<StatusColor, { bg: string; text: string; ring: string }> = {
    green: { bg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-700', ring: 'ring-emerald-500/20' },
    red: { bg: 'bg-rose-50 text-rose-600', text: 'text-rose-700', ring: 'ring-rose-500/20' },
    amber: { bg: 'bg-amber-50 text-amber-600', text: 'text-amber-700', ring: 'ring-amber-500/20' },
    blue: { bg: 'bg-blue-50 text-blue-600', text: 'text-blue-700', ring: 'ring-blue-500/20' },
    gray: { bg: 'bg-slate-100 text-slate-600', text: 'text-slate-700', ring: 'ring-slate-400/20' },
  };

  const currentTheme = colorVariants[color] || colorVariants.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${currentTheme.bg}`}>
          <IconComponent className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold ${
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{description}</p>
      )}
    </div>
  );
};
