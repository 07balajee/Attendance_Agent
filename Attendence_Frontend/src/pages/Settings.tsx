import React, { useState } from 'react';
import { getSettings, updateSettings, AppSettings } from '../services/apiConfig';
import { useToast } from '../hooks/useToast';
import { Settings as SettingsIcon, Save, RotateCcw, ShieldCheck, Clock, Layers } from 'lucide-react';

export const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const handleSave = () => {
    updateSettings(settings);
    showToast('success', 'Settings Saved', 'Attendance module automation parameters updated successfully.');
  };

  const handleReset = () => {
    const defaultVals = updateSettings({
      nightlySweepTime: '23:30',
      autoCloseHour: 21,
      slaWarningDays: 2,
      slaBreachDays: 5,
      anomalyWindowDays: 30,
      excessLeaveWindowDays: 90,
      dryRunMode: true,
      useLiveBackendIfAvailable: true,
    });
    setSettings(defaultVals);
    showToast('info', 'Settings Reset', 'Restored default HLD configuration values.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Attendance Automation Settings
              </h2>
              <p className="text-xs text-slate-500">
                Configure deterministic agent tunables strictly supported by the HLD architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="space-y-6 text-xs">
          {/* Section 1: Scheduler & Sign-out Thresholds */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Scheduler & Attendance Auto-Closure (Node 1)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nightly Sweep Time (Local Cadence)
                </label>
                <input
                  type="time"
                  value={settings.nightlySweepTime}
                  onChange={(e) => setSettings({ ...settings, nightlySweepTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  HLD Default: 23:30 local time. Triggers batch LangGraph thread sweep.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Auto-Close Sign-Out Hour (24-Hour Clock)
                </label>
                <input
                  type="number"
                  min={18}
                  max={24}
                  value={settings.autoCloseHour}
                  onChange={(e) => setSettings({ ...settings, autoCloseHour: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  HLD Default: 21 (9:00 PM). Auto-closes unclosed swipes with 21:00:00 timestamp.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: SLA Escalation Thresholds */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>SLA Watchdog Thresholds (Nodes 2 & 4)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  SLA Warning Threshold (Business Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.slaWarningDays}
                  onChange={(e) => setSettings({ ...settings, slaWarningDays: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  HLD Default: 2 business days. Appends approaching warning note.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  SLA Breach Threshold (Business Days)
                </label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={settings.slaBreachDays}
                  onChange={(e) => setSettings({ ...settings, slaBreachDays: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  HLD Default: 5 business days. Auto-escalates & stamps system note.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Anomaly Detection Rolling Windows */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Layers className="h-4 w-4 text-purple-600" />
              <span>Anomaly Detection Rolling Windows (Node 5)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Standard Anomaly Rolling Window (Days)
                </label>
                <input
                  type="number"
                  min={15}
                  max={60}
                  value={settings.anomalyWindowDays}
                  onChange={(e) => setSettings({ ...settings, anomalyWindowDays: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  HLD Default: 30 days. Used for Late Arrival, Frequent Short Leave, Repeated Absence, Missing Checkup.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Excess Leave Pattern Window (Days)
                </label>
                <input
                  type="number"
                  min={60}
                  max={180}
                  value={settings.excessLeaveWindowDays}
                  onChange={(e) => setSettings({ ...settings, excessLeaveWindowDays: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  HLD Default: 90 days. Flags recurring excess-leave pattern if ≥ 2 requests exist in 90 days.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Safety & Dry Run Mode */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Agent Dry Run Mode (Default: ON)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                When enabled, LangGraph subagents execute read-only queries and simulate mutations without committing live writes to the database.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dryRunMode}
                onChange={(e) => setSettings({ ...settings, dryRunMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
