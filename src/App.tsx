import React, { useEffect, useState } from 'react';
import { LogisticsProvider, useLogistics, NavigationTab } from './context/LogisticsContext';
import { UserRole } from './types/logistics';
import { SidebarNavigation } from './components/SidebarNavigation';
import { TopNavigation } from './components/TopNavigation';
import { LandingModal } from './components/LandingModal';
import { MobilePublicLanding } from './components/MobilePublicLanding';

import { ControlTowerView } from './views/ControlTowerView';
import { DashboardView } from './views/DashboardView';
import { SecurityDashboardView } from './views/SecurityDashboardView';
import { TransportCoordinatorDashboardView } from './views/TransportCoordinatorDashboardView';
import { HubDashboardView } from './views/HubDashboardView';
import { ShipmentsView } from './views/ShipmentsView';
import { SecurityShipmentsView } from './views/SecurityShipmentsView';
import { HubShipmentsView } from './views/HubShipmentsView';
import { TransportCoordinatorShipmentsView } from './views/TransportCoordinatorShipmentsView';
import { TransportCoordinatorLiveTrackingView } from './views/TransportCoordinatorLiveTrackingView';
import { TransportCoordinatorAuditTrailView } from './views/TransportCoordinatorAuditTrailView';
import { SchedulesView } from './views/SchedulesView';
import { SecurityTrustView } from './views/SecurityTrustView';
import { ApprovalsView } from './views/ApprovalsView';
import { HubOperationsView } from './views/HubOperationsView';
import { AuditTrailView } from './views/AuditTrailView';
import { SecurityAuditTrailView } from './views/SecurityAuditTrailView';
import { HubAuditTrailView } from './views/HubAuditTrailView';
import { UsersAdminView } from './views/UsersAdminView';
import { DriverMobileView } from './views/DriverMobileView';
import { LiveTrackingView } from './views/LiveTrackingView';
import { SecurityLiveTrackingView } from './views/SecurityLiveTrackingView';
import { HubLiveTrackingView } from './views/HubLiveTrackingView';
import { TransportCoordinatorAppView } from './views/TransportCoordinatorAppView';
import { SecurityOfficerAppView } from './views/SecurityOfficerAppView';
import { HubOperatorAppView } from './views/HubOperatorAppView';
import { AdminManagerAppView } from './views/AdminManagerAppView';

import { CheckCircle2, X, Lock } from 'lucide-react';

const MOBILE_APP_TABS: NavigationTab[] = ['driver-view','coordinator-app','security-app','hub-app','manager-app'];

const MainLayout: React.FC = () => {
  const {
    userRole,
    currentUser,
    permittedTabs,
    isTabPermitted,
    activeTab,
    setActiveTab,
    switchRole,
    notification,
    clearNotification,
  } = useLogistics();

  const [isLandingOpen, setIsLandingOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showPublicLanding, setShowPublicLanding] = useState(false);
  const [pendingMobileTab, setPendingMobileTab] = useState<NavigationTab | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const forceConsole = params.get('console') === '1';
    const forceLanding = params.get('landing') === '1';
    const isPhone = window.matchMedia('(max-width: 767px)').matches;
    setShowPublicLanding(forceLanding || (isPhone && !forceConsole));
  }, []);

  useEffect(() => {
    if (!pendingMobileTab) return;
    if (permittedTabs.includes(pendingMobileTab)) {
      setActiveTab(pendingMobileTab);
      setPendingMobileTab(null);
      setShowPublicLanding(false);
    }
  }, [userRole, permittedTabs, pendingMobileTab, setActiveTab]);

  const enterRoleApp = (role: UserRole, tab: NavigationTab) => {
    setPendingMobileTab(tab);
    switchRole(role);
  };

  const enterFullConsole = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('landing');
      url.searchParams.set('console', '1');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    setPendingMobileTab('control-tower');
    switchRole('Logistics Operations Manager');
  };

  const renderActiveView = () => {
    if (!isTabPermitted(activeTab)) {
      return (
        <div className="p-4 sm:p-8 max-w-lg mx-auto my-8 sm:my-16">
          <div className="bg-slate-900/90 border-2 border-rose-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30"><Lock className="w-7 h-7" /></div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-rose-400 bg-rose-950 px-2.5 py-0.5 rounded border border-rose-800">ROLE ACCESS RESTRICTION</span>
              <h2 className="text-lg font-bold text-white mt-2">Unauthorized Operational Console</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Your role as <strong className="text-white">{userRole}</strong> does not have access to <strong className="text-cyan-400">{activeTab}</strong>.</p>
            </div>
            <button onClick={() => setActiveTab(permittedTabs[0])} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl">Return to Authorized Console</button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'control-tower': return <ControlTowerView />;
      case 'dashboard': return userRole === 'Hub Operator' ? <HubDashboardView /> : userRole === 'Transport Coordinator' ? <TransportCoordinatorDashboardView /> : userRole === 'Security / Risk Officer' ? <SecurityDashboardView /> : <DashboardView />;
      case 'shipments': return userRole === 'Hub Operator' ? <HubShipmentsView /> : userRole === 'Transport Coordinator' ? <TransportCoordinatorShipmentsView /> : userRole === 'Security / Risk Officer' ? <SecurityShipmentsView /> : <ShipmentsView />;
      case 'tracking': return userRole === 'Hub Operator' ? <HubLiveTrackingView /> : userRole === 'Transport Coordinator' ? <TransportCoordinatorLiveTrackingView /> : userRole === 'Security / Risk Officer' ? <SecurityLiveTrackingView /> : <LiveTrackingView />;
      case 'schedules': return <SchedulesView />;
      case 'security': return <SecurityTrustView />;
      case 'approvals': return <ApprovalsView />;
      case 'hub-ops': return <HubOperationsView />;
      case 'audit': return userRole === 'Hub Operator' ? <HubAuditTrailView /> : userRole === 'Transport Coordinator' ? <TransportCoordinatorAuditTrailView /> : userRole === 'Security / Risk Officer' ? <SecurityAuditTrailView /> : <AuditTrailView />;
      case 'users': return <UsersAdminView />;
      case 'driver-view': return <DriverMobileView />;
      case 'coordinator-app': return <TransportCoordinatorAppView />;
      case 'security-app': return <SecurityOfficerAppView />;
      case 'hub-app': return <HubOperatorAppView />;
      case 'manager-app': return <AdminManagerAppView />;
      default: return <ControlTowerView />;
    }
  };

  if (showPublicLanding) {
    return (
      <MobilePublicLanding
        onEnterRole={enterRoleApp}
        onEnterFullConsole={enterFullConsole}
      />
    );
  }

  const activeIsMobileApp = MOBILE_APP_TABS.includes(activeTab);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f5f7f6] font-sans text-[#183a34]">
      <SidebarNavigation mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        <TopNavigation
          onOpenLandingModal={() => setIsLandingOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenPublicLanding={() => setShowPublicLanding(true)}
        />

        <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#f5f7f6] relative ${activeIsMobileApp ? 'pb-6' : 'pb-20 lg:pb-28'}`}>

          {notification && (
            <div className="fixed top-16 lg:top-20 left-3 right-3 sm:left-auto sm:right-6 z-50 sm:max-w-md bg-slate-900 border border-cyan-500/50 rounded-2xl p-3.5 shadow-2xl flex items-start justify-between gap-3 text-xs text-slate-200">
              <div className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" /><span>{notification}</span></div>
              <button onClick={clearNotification} className="text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          <div className={activeIsMobileApp ? 'w-full' : 'desktop-console-canvas'}>{renderActiveView()}</div>
        </main>
      </div>

      <LandingModal
        isOpen={isLandingOpen}
        onClose={() => setIsLandingOpen(false)}
        onEnterControlTower={() => {
          if (isTabPermitted('control-tower')) setActiveTab('control-tower');
          else setActiveTab(permittedTabs[0]);
          setIsLandingOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return <LogisticsProvider><MainLayout /></LogisticsProvider>;
}
