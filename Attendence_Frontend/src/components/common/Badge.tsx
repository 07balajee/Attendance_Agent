import React from 'react';
import { StatusColor } from '../../types/common';

interface BadgeProps {
  children: React.ReactNode;
  variant?: StatusColor | 'purple';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variantStyles: Record<StatusColor | 'purple', string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    gray: 'bg-slate-100 text-slate-700 border-slate-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
  };

  const dotColors: Record<StatusColor | 'purple', string> = {
    green: 'bg-emerald-500',
    red: 'bg-rose-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    gray: 'bg-slate-400',
    purple: 'bg-purple-500',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
