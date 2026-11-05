import React, { useMemo, useState } from 'react';
import { useLogistics, NavigationTab, ROLE_ASSIGNABLE_TABS, ROLE_LOCKED_TABS } from '../context/LogisticsContext';
import { Users, Sliders, RotateCcw, Lock, ShieldCheck, Check, X } from 'lucide-react';
import { UserRole } from '../types/logistics';

const TAB_LABELS: Record<NavigationTab, string> = {
  dashboard: 'Dashboard / Overview',
  'control-tower': 'AI Control Tower',
  shipments: 'Shipment / Case Workspace',
  tracking: 'Tracking Workspace',
  schedules: 'Schedules & Fleet',
  security: 'Security Investigation Console',
  approvals: 'AI Decision Approvals',
  'hub-ops': 'Hub Operations',
  audit: 'Audit Trail',
  users: 'Users & Access',
  'driver-view': 'Driver App',
  'manager-app': 'Admin / Manager App',
  'coordinator-app': 'Coordinator App',
  'security-app': 'Security Officer App',
  'hub-app': 'Hub Operator App',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'Logistics Operations Manager': 'Network oversight and approval of consequential AI recommendations.',
  'Transport Coordinator': 'Transport planning, rail updates and operational recovery coordination.',
  'Security / Risk Officer': 'Investigates route, identity, GPS and custody anomalies using evidence.',
  'Hub Operator': 'Manages hub receiving, sorting, custody checks and handoff verification.',
  Driver: 'Uses the driver mobile workspace for assigned movement, scan and evidence tasks.',
  Administrator: 'Controls RBAC, governance settings and audit access without taking operational decisions.',
};

const OPERATIONAL_BOUNDARIES: Record<UserRole, string[]> = {
  'Logistics Operations Manager': ['Can approve / reject consequential AI recommendations', 'Cannot perform hub custody verification', 'Cannot resolve security evidence on behalf of Security'],
  'Transport Coordinator': ['Can maintain schedules and transport recovery', 'Cannot approve consequential AI decisions', 'Cannot verify hub custody'],
  'Security / Risk Officer': ['Can request verification, escalate and resolve security cases', 'Cannot reroute transport services', 'Cannot approve hub handoff'],
  'Hub Operator': ['Can receive, reconcile and verify custody handoffs', 'Cannot change rail schedules', 'Cannot resolve route-security cases'],
  Driver: ['Can submit scans, movement updates and handoff evidence', 'Cannot self-approve custody or security exceptions'],
  Administrator: ['Can manage workspace access privileges', 'Cannot create shipments, reroute loads, approve AI decisions or resolve operational cases'],
};

export const UsersAdminView: React.FC = () => {
  const { userRole, resetAllData, rolePermissions, updateRolePermission, resetRolePermissions } = useLogistics();
  const [requireApprovalForRail, setRequireApprovalForRail] = useState(true);
  const [nonAccusatoryLanguage, setNonAccusatoryLanguage] = useState(true);
  const roles = useMemo<UserRole[]>(() => [
    'Logistics Operations Manager',
    'Transport Coordinator',
    'Security / Risk Officer',
    'Hub Operator',
    'Driver',
    'Administrator',
  ], []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100"><Users className="w-5 h-5" /></span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Administrator</div>
              <h1 className="text-xl font-extrabold text-slate-900">Users, Roles & Access Privileges</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2 max-w-3xl">Workspace privileges are editable here. Operational authority remains role-bound, so granting a console does not let a role bypass protected actions such as AI approval, security resolution or custody verification.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={resetRolePermissions} className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5"/>Reset Privileges</button>
          <button onClick={resetAllData} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition">Reset Demo Data</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-blue-100"><Sliders className="w-4 h-4 text-blue-600"/><h2 className="text-sm font-bold text-slate-900">Platform Safeguards</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 cursor-pointer"><div><span className="font-bold text-slate-900 block">Consequential Schedule Human Gate</span><p className="text-[11px] text-slate-500 mt-1">Disruptive AI route or schedule recommendations require Operations Manager approval before application.</p></div><input type="checkbox" checked={requireApprovalForRail} onChange={(e)=>setRequireApprovalForRail(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600"/></label>
          <label className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 cursor-pointer"><div><span className="font-bold text-slate-900 block">Non-Accusatory Evidentiary Language</span><p className="text-[11px] text-slate-500 mt-1">Anomalies remain “requires verification” until a human Security Officer reviews the evidence.</p></div><input type="checkbox" checked={nonAccusatoryLanguage} onChange={(e)=>setNonAccusatoryLanguage(e.target.checked)} className="mt-1 w-4 h-4 accent-blue-600"/></label>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"><div className="font-bold text-emerald-900">Driver Self-Approval Prohibition</div><div className="text-[11px] text-emerald-700 mt-1">ENFORCED — driver evidence always requires another authorized role for verification.</div></div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"><div className="font-bold text-emerald-900">Audit Reference Integrity</div><div className="text-[11px] text-emerald-700 mt-1">ENABLED — consequential RBAC changes are written into the audit trail.</div></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div><h2 className="text-sm font-bold text-slate-900">Role-Based Access Control</h2><p className="text-xs text-slate-500">Toggle the consoles each role may open. Required privileges are locked to prevent accidental lockout or broken role flows.</p></div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5"/>Operational actions still enforce role separation</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {roles.map((role) => {
            const isCurrent = userRole === role;
            const allowedTabs = ROLE_ASSIGNABLE_TABS[role];
            const enabledTabs = rolePermissions[role] || [];
            return (
              <div key={role} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${isCurrent ? 'border-blue-300 ring-1 ring-blue-100' : 'border-blue-100'}`}>
                <div className="p-4 border-b border-blue-50 flex items-start justify-between gap-3">
                  <div><div className="flex items-center gap-2"><h3 className="text-sm font-extrabold text-slate-900">{role}</h3>{isCurrent && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-100">CURRENT</span>}</div><p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p></div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 whitespace-nowrap">{enabledTabs.length}/{allowedTabs.length} ACTIVE</span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Workspace Privileges</div>
                  {allowedTabs.map((tab) => {
                    const enabled = enabledTabs.includes(tab);
                    const locked = ROLE_LOCKED_TABS[role].includes(tab);
                    return (
                      <button
                        key={tab}
                        onClick={() => !locked && updateRolePermission(role, tab, !enabled)}
                        disabled={locked}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${enabled ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'} ${locked ? 'cursor-not-allowed opacity-80' : 'hover:border-blue-300'}`}
                      >
                        <div className="min-w-0"><div className={`text-xs font-semibold ${enabled ? 'text-blue-800' : 'text-slate-600'}`}>{TAB_LABELS[tab]}</div>{locked && <div className="text-[9px] text-slate-400 mt-0.5">Required for this role</div>}</div>
                        <span className={`w-9 h-5 rounded-full p-0.5 flex items-center transition ${enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}><span className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">{enabled ? <Check className="w-2.5 h-2.5 text-blue-600"/> : <X className="w-2.5 h-2.5 text-slate-400"/>}</span></span>
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 pb-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">Operational Authority</div>{OPERATIONAL_BOUNDARIES[role].map((line) => <div key={line} className="text-[10px] text-slate-600 flex items-start gap-1.5 mt-1"><ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5"/><span>{line}</span></div>)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-2 text-xs text-blue-900"><ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"/><span><strong>Scope safeguard:</strong> LogiTrust covers logistics Stages 3–7. The Trust / Handoff Agent ends at Stage 6 (Destination Hub); Stage 7 is operational last-mile dispatch tracking only.</span></div>
    </div>
  );
};
