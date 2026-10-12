import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Shield, Users, CheckCircle2, FileText, Smartphone, Settings2, ArrowUpRight } from 'lucide-react';

export const AdminManagerAppView: React.FC = () => {
  const { userRole, recommendations, auditLogs, currentUser, approveRecommendation, setActiveTab } = useLogistics();
  const [message, setMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage((current) => (current === msg ? null : current)), 4200);
  };

  const primaryRec = useMemo(() => recommendations.find((rec) => rec.status === 'Pending Approval') || recommendations[0], [recommendations]);
  const isManager = userRole === 'Logistics Operations Manager';

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-slate-950 rounded-[36px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[700px] text-slate-100 relative">
        <div className="bg-slate-900 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800">
          <span>11:02 AM</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
          <span className="text-cyan-400">5G • 97%</span>
        </div>

        {message && (
          <div className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-[11px] flex items-center justify-between shadow-lg">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="font-extrabold ml-2">✕</button>
          </div>
        )}

        <div className="bg-slate-900/90 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Admin / Manager App</h2>
              <p className="text-[11px] text-slate-400">Oversight, approvals, audit and role governance</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              {currentUser.avatarInitials}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Role Mode</span>
              <strong className="text-white text-sm">{isManager ? 'Manager' : 'Admin'}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Audit Logs</span>
              <strong className="text-cyan-300 text-base">{auditLogs.length}</strong>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {isManager && primaryRec && (
            <div className="p-3.5 bg-slate-900 rounded-2xl border border-cyan-500/40 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Pending Approval</span>
                <span className="font-mono text-xs font-bold text-white">{primaryRec.id}</span>
              </div>
              <div className="text-slate-200 font-semibold">{primaryRec.recommendation}</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Shipment</span><strong className="text-slate-200">{primaryRec.shipmentId}</strong></div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Confidence</span><strong className="text-emerald-300">{primaryRec.confidence}%</strong></div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    approveRecommendation(primaryRec.id, 'Approved from Admin/Manager app');
                    notify('Recommendation approved. Execution and audit trail updated.');
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] shadow transition"
                >
                  <CheckCircle2 className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => {
                    setActiveTab('approvals');
                    notify('Opening full AI Approvals console.');
                  }}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] transition"
                >
                  <ArrowUpRight className="w-3 h-3" /> Review Console
                </button>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Governance Shortcuts</span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button onClick={() => { setActiveTab('audit'); notify('Opening audit trail.'); }} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-left hover:border-cyan-500/40 transition"><FileText className="w-4 h-4 text-cyan-400 mb-1" /><div className="font-semibold text-white">Audit Trail</div><div className="text-slate-500 mt-0.5">Review system decisions</div></button>
              <button onClick={() => { setActiveTab('users'); notify('Opening users & admin console.'); }} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-left hover:border-cyan-500/40 transition"><Users className="w-4 h-4 text-cyan-400 mb-1" /><div className="font-semibold text-white">Users & Access</div><div className="text-slate-500 mt-0.5">Role workspace controls</div></button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Recent Audit Events</span>
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{log.event}</div>
                  <span className="text-[10px] text-cyan-300 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{log.result}</div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-cyan-950/25 rounded-xl border border-cyan-500/30 text-[10px] text-cyan-100 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-300" /> Operational Governance
            </div>
            <p>
              This app is for supervisory oversight only. It does not replace the full console for deep investigation, but provides fast approval, audit and role-management shortcuts.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-2 flex justify-around text-[10px] text-slate-400 font-medium">
          <span className="text-cyan-400 font-bold">Overview</span>
          <span>Approvals</span>
          <span>Audit</span>
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
};
