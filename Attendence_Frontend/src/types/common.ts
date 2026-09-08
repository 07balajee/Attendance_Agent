export type StatusColor = 'green' | 'red' | 'amber' | 'blue' | 'gray';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface KPICardData {
  id: string;
  title: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: StatusColor;
  iconName: string;
  description?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  link?: string;
}

export interface EmployeeBrief {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  role: string;
  email: string;
  overtimeRate?: number;
}
