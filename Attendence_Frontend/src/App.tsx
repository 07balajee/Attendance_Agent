import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ToastProvider } from './hooks/useToast';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { LeaveManagement } from './pages/LeaveManagement';
import { Overtime } from './pages/Overtime';
import { Expenses } from './pages/Expenses';
import { SLAEscalations } from './pages/SLAEscalations';
import { AnomalyCenter } from './pages/AnomalyCenter';
import { AgentOrchestration } from './pages/AgentOrchestration';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="overtime" element={<Overtime />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="sla" element={<SLAEscalations />} />
            <Route path="anomalies" element={<AnomalyCenter />} />
            <Route path="orchestration" element={<AgentOrchestration />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
