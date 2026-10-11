import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { UserRole } from '../types/logistics';
import {
  Search,
  Bell,
  ChevronDown,
  Zap,
  AlertTriangle,
  Info,
  Check,
  UsersRound,
} from 'lucide-react';

interface Props {
  onOpenLandingModal: () => void;
}

const ROLE_OPTIONS: UserRole[] = [
  'Logistics Operations Manager',
  'Transport Coordinator',
  'Security / Risk Officer',
  'Hub Operator',
  'Driver',
  'Administrator',
];

export const TopNavigation: React.FC<Props> = ({ onOpenLandingModal }) => {
  const {
    userRole,
    currentUser,
    switchRole,
    isTabPermitted,
    shipments,
    setSelectedShipmentId,
    setActiveTab,
    securityAlerts,
    recommendations,
  } = useLogistics();

  const [searchVal, setSearchVal] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingApprovalsCount = recommendations.filter((r) => r.status === 'Pending Approval').length;
  const openAlertsCount = securityAlerts.filter((a) => a.status === 'Open' || a.status === 'Verification Requested').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    const match = shipments.find(
      (s) =>
        s.id.toLowerCase().includes(searchVal.toLowerCase()) ||
        s.origin.toLowerCase().includes(searchVal.toLowerCase()) ||
        s.destination.toLowerCase().includes(searchVal.toLowerCase())
    );
    if (match) {
      setSelectedShipmentId(match.id);
      if (isTabPermitted('shipments')) setActiveTab('shipments');
      setSearchVal('');
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Global search: ID (MY102938), Hub, Corridor..."
            className="w-full bg-slate-900 border border-slate-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </form>
      </div>

      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="font-mono text-[11px] font-semibold text-slate-300">
          AGENTIC AI MESH: <span className="text-cyan-400">ACTIVE</span> (5/5 NODES SYNCHRONISED)
        </span>
        <button onClick={onOpenLandingModal} className="text-slate-400 hover:text-cyan-300 ml-1" title="Platform Architecture & Specification">
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        {(isTabPermitted('approvals') || isTabPermitted('security')) && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              <Bell className="w-4 h-4" />
              {(pendingApprovalsCount > 0 || openAlertsCount > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {pendingApprovalsCount + openAlertsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-white">
                  <span>Role Operational Alerts</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Live Stream</span>
                </div>
                <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                  {pendingApprovalsCount > 0 && isTabPermitted('approvals') && (
                    <div onClick={() => { setActiveTab('approvals'); setShowNotifications(false); }} className="p-2 bg-blue-950/40 border border-blue-800/50 rounded-lg cursor-pointer hover:bg-blue-900/30 transition">
                      <div className="font-semibold text-blue-300 flex items-center gap-1.5"><Zap className="w-3 h-3 text-cyan-400" /> Pending AI Approval (MY102938)</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">Reschedule to Train T108 requires operator sign-off.</div>
                    </div>
                  )}
                  {openAlertsCount > 0 && isTabPermitted('security') && (
                    <div onClick={() => { setActiveTab('security'); setShowNotifications(false); }} className="p-2 bg-rose-950/40 border border-rose-800/50 rounded-lg cursor-pointer hover:bg-rose-900/30 transition">
                      <div className="font-semibold text-rose-300 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-rose-400" /> Route Deviation #TR102</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">Vehicle V-889 deviated 18.4 km outside corridor.</div>
                    </div>
                  )}
                  {pendingApprovalsCount === 0 && openAlertsCount === 0 && (
                    <div className="text-center py-4 text-slate-400">No active critical alerts for this role.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 text-xs transition"
            title="Switch role workspace"
          >
            <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-[11px] border border-cyan-500/30">
              {currentUser.avatarInitials}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-[10px] text-slate-400 font-mono leading-none">Current workspace</span>
              <span className="block font-bold text-slate-100 truncate max-w-[150px] leading-tight text-[11px]">{userRole}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-2.5 py-2 mb-1.5 border-b border-slate-800 flex items-center gap-2">
                <UsersRound className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-bold text-white">Switch Role Workspace</div>
                  <div className="text-[10px] text-slate-400">Select a role to view its permitted interface.</div>
                </div>
              </div>
              <div className="space-y-1">
                {ROLE_OPTIONS.map((role) => {
                  const active = role === userRole;
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setShowRoleMenu(false);
                        setShowNotifications(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-center justify-between gap-3 ${active ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200' : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-800/70'}`}
                    >
                      <div>
                        <div className="font-semibold text-[11px]">{role}</div>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
