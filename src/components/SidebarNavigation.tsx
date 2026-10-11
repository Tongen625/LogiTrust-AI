import React from 'react';
import { useLogistics, NavigationTab } from '../context/LogisticsContext';
import {
  Shield,
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
  Lock,
} from 'lucide-react';

export const SidebarNavigation: React.FC = () => {
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
    {
      id: 'security' as NavigationTab,
      label: 'Security & Digital Trust',
      icon: ShieldAlert,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'approvals' as NavigationTab,
      label: 'AI Approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-cyan-500',
    },
    { id: 'hub-ops' as NavigationTab, label: 'Hub Operations', icon: Building2 },
    { id: 'driver-view' as NavigationTab, label: 'Driver Terminal', icon: Smartphone },
    { id: 'audit' as NavigationTab, label: 'Audit Trail', icon: FileText },
    { id: 'users' as NavigationTab, label: 'Users & Admin', icon: Users },
  ];

  // STRICT RBAC FILTER: Only show functions permitted for this role
  const visibleNavItems = allNavItems.filter((item) => permittedTabs.includes(item.id));

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
            LogiTrust <span className="text-cyan-400">AI</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-tight">
            Secure Logistics & Digital Trust
          </p>
        </div>
      </div>

      {/* Current Role Workspace Ticker */}
      <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-800 text-[10px] flex items-center justify-between font-mono">
        <span className="text-slate-400 uppercase">Workspace:</span>
        <span className="text-cyan-400 font-bold truncate max-w-[140px]">
          {userRole}
        </span>
      </div>

      {/* Main Nav Links (STRICTLY ROLE-PARTITIONED) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Permitted Consoles</span>
          <span className="font-mono text-cyan-400">{visibleNavItems.length} Authorized</span>
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                  : item.highlight
                  ? 'text-cyan-300 hover:bg-slate-900 hover:text-white border border-transparent hover:border-slate-800'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-cyan-400' : item.highlight ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`${item.badgeColor} text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-sm`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current Role Workspace */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-cyan-400/90 font-mono truncate leading-tight">
                {userRole.split(' ')[0]} • {currentUser.callsign}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full py-1.5 px-2 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-medium text-center">
          Switch role from the top-right selector
        </div>

        <div className="text-[9px] text-slate-500 flex items-center justify-between font-mono pt-1">
          <span>LogiTrust AI v2.6.4</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> ROLE ACCESS ACTIVE
          </span>
        </div>
      </div>
    </aside>
  );
};
