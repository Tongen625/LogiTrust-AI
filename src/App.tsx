import React, { useState } from 'react';
import { LogisticsProvider, useLogistics } from './context/LogisticsContext';
import { SidebarNavigation } from './components/SidebarNavigation';
import { TopNavigation } from './components/TopNavigation';
import { LandingModal } from './components/LandingModal';

// Views
import { ControlTowerView } from './views/ControlTowerView';
import { DashboardView } from './views/DashboardView';
import { ShipmentsView } from './views/ShipmentsView';
import { SchedulesView } from './views/SchedulesView';
import { SecurityTrustView } from './views/SecurityTrustView';
import { ApprovalsView } from './views/ApprovalsView';
import { HubOperationsView } from './views/HubOperationsView';
import { AuditTrailView } from './views/AuditTrailView';
import { UsersAdminView } from './views/UsersAdminView';
import { DriverMobileView } from './views/DriverMobileView';
import { LiveTrackingView } from './views/LiveTrackingView';
import { TransportCoordinatorAppView } from './views/TransportCoordinatorAppView';
import { SecurityOfficerAppView } from './views/SecurityOfficerAppView';
import { HubOperatorAppView } from './views/HubOperatorAppView';
import { AdminManagerAppView } from './views/AdminManagerAppView';

import { CheckCircle2, AlertTriangle, ShieldAlert, X, Lock } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    userRole,
    currentUser,
    permittedTabs,
    isTabPermitted,
    activeTab,
    setActiveTab,
    notification,
    clearNotification,
  } = useLogistics();

  const [isLandingOpen, setIsLandingOpen] = useState(false);


  const renderActiveView = () => {
    // Strict RBAC boundary check: if user attempts to navigate to unauthorized console
    if (!isTabPermitted(activeTab)) {
      return (
        <div className="p-8 max-w-lg mx-auto my-16 bg-slate-900/90 border-2 border-rose-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-rose-400 bg-rose-950 px-2.5 py-0.5 rounded border border-rose-800">
              ROLE ACCESS RESTRICTION
            </span>
            <h2 className="text-lg font-bold text-white mt-2">
              Unauthorized Operational Console
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Your role as <strong className="text-white">{userRole}</strong> ({currentUser.name}) does not have access to the <strong className="text-cyan-400">"{activeTab}"</strong> console.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
            <span className="font-bold text-slate-300 block uppercase text-[10px]">Your Authorized Functions:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {permittedTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-slate-800 text-[10px] font-mono transition"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab(permittedTabs[0])}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
          >
            Return to Authorized Console ({permittedTabs[0]})
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'control-tower':
        return <ControlTowerView />;
      case 'dashboard':
        return <DashboardView />;
      case 'shipments':
        return <ShipmentsView />;
      case 'tracking':
        return <LiveTrackingView />;
      case 'schedules':
        return <SchedulesView />;
      case 'security':
        return <SecurityTrustView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'hub-ops':
        return <HubOperationsView />;
      case 'audit':
        return <AuditTrailView />;
      case 'users':
        return <UsersAdminView />;
      case 'driver-view':
        return <DriverMobileView />;
      case 'coordinator-app':
        return <TransportCoordinatorAppView />;
      case 'security-app':
        return <SecurityOfficerAppView />;
      case 'hub-app':
        return <HubOperatorAppView />;
      case 'manager-app':
        return <AdminManagerAppView />;
      default:
        return <ControlTowerView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <TopNavigation onOpenLandingModal={() => setIsLandingOpen(true)} />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 bg-grid-pattern relative pb-28">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Toast Notification Banner */}
          {notification && (
            <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-3.5 shadow-2xl flex items-start justify-between gap-3 text-xs text-slate-200 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{notification}</span>
              </div>
              <button onClick={clearNotification} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {renderActiveView()}
        </main>
      </div>

      {/* Platform Specification & Architectural Overview Modal */}
      <LandingModal
        isOpen={isLandingOpen}
        onClose={() => setIsLandingOpen(false)}
        onEnterControlTower={() => {
          if (isTabPermitted('control-tower')) {
            setActiveTab('control-tower');
          } else {
            setActiveTab(permittedTabs[0]);
          }
          setIsLandingOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <LogisticsProvider>
      <MainLayout />
    </LogisticsProvider>
  );
}
