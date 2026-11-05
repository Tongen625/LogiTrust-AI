import React from 'react';
import { useLogistics, NavigationTab } from '../context/LogisticsContext';
import {
  LayoutDashboard,
  Radio,
  Package,
  Calendar,
  ShieldAlert,
  CheckSquare,
  Building2,
  FileText,
  Users,
  Smartphone,
  Compass,
  X,
} from 'lucide-react';

interface Props {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarNavigation: React.FC<Props> = ({ mobileOpen = false, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    recommendations,
    securityAlerts,
    permittedTabs,
    currentUser,
    userRole,
  } = useLogistics();

  const pendingApprovalsCount = recommendations.filter((r) => r.status === 'Pending Approval').length;
  const activeAlertsCount = securityAlerts.filter((a) => a.status === 'Open' || a.status === 'Verification Requested').length;

  const allNavItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'control-tower' as NavigationTab, label: 'AI Control Tower', icon: Radio, highlight: true },
    { id: 'shipments' as NavigationTab, label: 'Shipments', icon: Package },
    { id: 'tracking' as NavigationTab, label: 'Live Tracking', icon: Compass },
    { id: 'schedules' as NavigationTab, label: 'Schedules & Fleet', icon: Calendar },
    { id: 'security' as NavigationTab, label: 'Security & Digital Trust', icon: ShieldAlert, badge: activeAlertsCount || undefined, badgeColor: 'bg-rose-500' },
    { id: 'approvals' as NavigationTab, label: 'AI Approvals', icon: CheckSquare, badge: pendingApprovalsCount || undefined, badgeColor: 'bg-cyan-500' },
    { id: 'hub-ops' as NavigationTab, label: 'Hub Operations', icon: Building2 },
    { id: 'coordinator-app' as NavigationTab, label: 'Coordinator App', icon: Smartphone },
    { id: 'security-app' as NavigationTab, label: 'Security Officer App', icon: Smartphone },
    { id: 'hub-app' as NavigationTab, label: 'Hub Operator App', icon: Smartphone },
    { id: 'manager-app' as NavigationTab, label: 'Admin / Manager App', icon: Smartphone },
    { id: 'driver-view' as NavigationTab, label: 'Driver App', icon: Smartphone },
    { id: 'audit' as NavigationTab, label: 'Audit Trail', icon: FileText },
    { id: 'users' as NavigationTab, label: 'Users & Admin', icon: Users },
  ];

  const visibleNavItems = allNavItems.filter((item) => permittedTabs.includes(item.id));

  const go = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile?.();
  };

  const sidebar = (
    <aside className="app-sidebar w-[280px] lg:w-64 bg-white border-r border-blue-100 flex flex-col shrink-0 h-full min-h-0 text-slate-700 select-none">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <img src="/logitrust-logo.jpeg" alt="LogiTrust AI" className="w-11 h-11 rounded-xl object-cover bg-white border border-blue-100 shadow-sm" />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[#0f2f57] leading-tight">LogiTrust <span className="text-[#1976d2]">AI</span></div>
          <div className="text-[10px] text-[#7086a0] leading-tight mt-0.5">Secure Logistics & Digital Trust</div>
        </div>
        <button onClick={onCloseMobile} className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900" aria-label="Close navigation">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-3 border-b border-slate-800 text-[10px] font-mono text-slate-500">
        <div className="flex justify-between gap-2">
          <span>WORKSPACE:</span>
          <span className="text-cyan-400 font-bold truncate max-w-[160px]">{userRole}</span>
        </div>
        <div className="flex justify-between mt-2 gap-2">
          <span>PERMITTED CONSOLES</span>
          <span className="text-cyan-400 font-bold">{permittedTabs.length} AUTHORIZED</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border ${active ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'border-transparent text-slate-300 hover:bg-slate-900 hover:text-white'}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active || item.highlight ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
              {item.badge ? <span className={`${item.badgeColor} text-slate-950 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-extrabold`}>{item.badge}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 font-bold font-mono text-xs flex items-center justify-center">{currentUser.avatarInitials}</div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-cyan-400 font-mono truncate">{currentUser.department} • {currentUser.employeeId}</div>
          </div>
        </div>
        <div className="text-[9px] text-slate-600 font-mono">LogiTrust AI v2.7 • ROLE ACCESS ACTIVE</div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block h-screen shrink-0">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden flex">
          <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCloseMobile} aria-label="Close navigation overlay" />
          <div className="relative h-full shadow-2xl animate-in slide-in-from-left duration-200">{sidebar}</div>
        </div>
      )}
    </>
  );
};
