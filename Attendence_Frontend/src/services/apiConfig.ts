// API Configuration for Attendance Module
// Allows smooth switching between mock and real FastAPI POC server (default port 8001)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

export interface AppSettings {
  nightlySweepTime: string; // "23:30"
  autoCloseHour: number; // 21
  slaWarningDays: number; // 2
  slaBreachDays: number; // 5
  anomalyWindowDays: number; // 30
  excessLeaveWindowDays: number; // 90
  dryRunMode: boolean; // true
  useLiveBackendIfAvailable: boolean; // true
}

export const DEFAULT_SETTINGS: AppSettings = {
  nightlySweepTime: '23:30',
  autoCloseHour: 21,
  slaWarningDays: 2,
  slaBreachDays: 5,
  anomalyWindowDays: 30,
  excessLeaveWindowDays: 90,
  dryRunMode: true,
  useLiveBackendIfAvailable: true,
};

let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };

export const getSettings = (): AppSettings => {
  const saved = localStorage.getItem('attendance_settings');
  if (saved) {
    try {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
  }
  return currentSettings;
};

export const updateSettings = (newSettings: Partial<AppSettings>): AppSettings => {
  currentSettings = { ...currentSettings, ...newSettings };
  localStorage.setItem('attendance_settings', JSON.stringify(currentSettings));
  return currentSettings;
};

export const checkBackendHealth = async (): Promise<{ isLive: boolean; details?: any }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return { isLive: true, details: data };
    }
    return { isLive: false };
  } catch {
    return { isLive: false };
  }
};
