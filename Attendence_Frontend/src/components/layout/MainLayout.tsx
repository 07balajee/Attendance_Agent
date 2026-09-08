import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { checkBackendHealth } from '../../services/apiConfig';
import { agentService } from '../../services/agentService';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [hilCount, setHilCount] = useState(2);

  useEffect(() => {
    // Check if backend on port 8001 is active
    checkBackendHealth().then((res) => {
      setIsLiveBackend(res.isLive);
    });

    // Check HIL queue count
    agentService.getHILQueue().then((q) => {
      setHilCount(q.length);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        hilCount={hilCount}
        slaBreachCount={3}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-18' : 'ml-64'
        }`}
      >
        <TopNav
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          isLiveBackend={isLiveBackend}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ selectedDepartment, isLiveBackend, hilCount }} />
        </main>
      </div>
    </div>
  );
};
