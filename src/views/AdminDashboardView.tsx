import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { FileCheck2, LockKeyhole, Settings2, ShieldCheck, Users } from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { auditLogs, setActiveTab } = useLogistics();
  const governanceEvents = auditLogs.slice(0, 6);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Administrator</div>
        <h1 className="text-xl font-extrabold text-slate-900 mt-1">System Governance Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Manage access, platform safeguards and audit governance. This role does not create shipments, reroute loads, verify custody, or approve operational AI decisions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => setActiveTab('users')} className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm text-left hover:border-blue-300 transition">
          <Users className="w-5 h-5 text-blue-600"/><div className="font-bold text-slate-900 mt-3">Users & Access</div><div className="text-xs text-slate-500 mt-1">Review RBAC matrix, role separation and platform safeguards.</div>
        </button>
        <button onClick={() => setActiveTab('audit')} className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm text-left hover:border-blue-300 transition">
          <FileCheck2 className="w-5 h-5 text-blue-600"/><div className="font-bold text-slate-900 mt-3">Governance Audit</div><div className="text-xs text-slate-500 mt-1">Inspect immutable decision and evidence records across the platform.</div>
        </button>
        <button onClick={() => setActiveTab('manager-app')} className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm text-left hover:border-blue-300 transition">
          <Settings2 className="w-5 h-5 text-blue-600"/><div className="font-bold text-slate-900 mt-3">Admin App</div><div className="text-xs text-slate-500 mt-1">Mobile governance shortcuts for access and audit review.</div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-100"><h2 className="font-bold text-slate-900">Recent Governance Records</h2><p className="text-xs text-slate-500">Read-only oversight of consequential system activity.</p></div>
          <div className="divide-y divide-blue-50">
            {governanceEvents.map((log) => (
              <div key={log.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3"><div className="font-semibold text-sm text-slate-900">{log.event}</div><div className="text-[10px] font-mono text-blue-600">{log.timestamp}</div></div>
                <div className="text-xs text-slate-500 mt-1">{log.actor} • {log.role}</div>
                <div className="text-xs text-slate-600 mt-1">{log.result}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600"/><h2 className="font-bold text-slate-900">Enforced Boundaries</h2></div>
          <div className="mt-3 space-y-2 text-xs">
            {['No operational shipment creation','No AI route approval authority','No security case resolution','No hub handoff verification','No driver evidence self-approval'].map((item) => (
              <div key={item} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-start gap-2"><LockKeyhole className="w-3.5 h-3.5 mt-0.5 shrink-0"/>{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
