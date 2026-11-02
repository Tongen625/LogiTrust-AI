import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Users, Sliders, CheckCircle2, RotateCcw, Lock, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types/logistics';

export const UsersAdminView: React.FC = () => {
  const { userRole, resetAllData } = useLogistics();
  const [requireApprovalForRail, setRequireApprovalForRail] = useState(true);
  const [nonAccusatoryLanguage, setNonAccusatoryLanguage] = useState(true);

  const rolesList: { role: UserRole; desc: string; perms: string[] }[] = [
    { role: 'Logistics Operations Manager', desc: 'Oversees the network and decides whether consequential AI schedule recommendations may be applied.', perms: ['AI Control Tower', 'Approve / reject AI rerouting', 'View shipments, tracking and schedules'] },
    { role: 'Transport Coordinator', desc: 'Maintains road / rail schedules and handles manual provider updates when an external railway API is unavailable.', perms: ['Add rail timetable', 'Update service status / delay', 'View route and intermodal planning'] },
    { role: 'Security / Risk Officer', desc: 'Investigates route, GPS, timestamp and custody anomalies using evidence before escalation or resolution.', perms: ['Security & Digital Trust', 'Request verification', 'Escalate / resolve alerts'] },
    { role: 'Hub Operator', desc: 'Performs the five-point custody check and verifies handoffs through the destination hub boundary.', perms: ['Hub Operations', 'Verify custody handoff', 'Review trust score and evidence'] },
    { role: 'Driver', desc: 'Uses the mobile operations workspace to scan, report movement and submit handoff evidence for hub review.', perms: ['Driver mobile workspace', 'Submit handoff evidence', 'Report incident; cannot self-approve'] },
    { role: 'Administrator', desc: 'Reviews RBAC, platform safeguards and audit records without taking operational decisions on behalf of other roles.', perms: ['RBAC governance', 'System baseline controls', 'Audit oversight'] },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"><Users className="w-4 h-4" /></span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">Users & Agentic Governance Administration</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">RBAC READ-ONLY MATRIX</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Role separation, human approval safeguards and audit governance. Use the global top-right selector to inspect another role workspace.</p>
        </div>
        <button onClick={resetAllData} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />Reset Platform Baseline</button>
      </div>

      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800"><Sliders className="w-4 h-4 text-cyan-400"/><h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Operational Safeguards & Constraints</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3"><div><span className="font-bold text-white block">Consequential Schedule Human Gate</span><p className="text-[11px] text-slate-400 mt-0.5">AI may recommend a disruptive route or schedule change, but an Operations Manager must approve it before application.</p></div><input type="checkbox" checked={requireApprovalForRail} onChange={(e)=>setRequireApprovalForRail(e.target.checked)} className="mt-1 w-4 h-4 accent-cyan-500 rounded"/></div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3"><div><span className="font-bold text-white block">Non-Accusatory Evidentiary Language</span><p className="text-[11px] text-slate-400 mt-0.5">Anomalies are labelled as inconsistent / requires verification rather than automatically accusing a person.</p></div><input type="checkbox" checked={nonAccusatoryLanguage} onChange={(e)=>setNonAccusatoryLanguage(e.target.checked)} className="mt-1 w-4 h-4 accent-cyan-500 rounded"/></div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3"><div><span className="font-bold text-white block">Driver Self-Approval Prohibition</span><p className="text-[11px] text-slate-400 mt-0.5">Driver evidence is submitted for review; a driver cannot verify their own high-risk exception or custody handoff.</p></div><span className="text-[10px] font-mono font-bold text-emerald-400 mt-1">ENFORCED</span></div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3"><div><span className="font-bold text-white block">Audit Reference Integrity</span><p className="text-[11px] text-slate-400 mt-0.5">Every consequential action receives a unique audit reference and full event/evidence/decision/outcome record.</p></div><span className="text-[10px] font-mono font-bold text-emerald-400 mt-1">ENABLED</span></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Role-Based Access Control Matrix</h2><div className="text-[10px] text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3"/>Use the top-right role selector to inspect another workspace</div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rolesList.map((item) => {
            const isCurrent = userRole === item.role;
            return <div key={item.role} className={`p-4 rounded-2xl border flex flex-col justify-between ${isCurrent ? 'bg-cyan-950/30 border-cyan-500/60' : 'bg-slate-900/80 border-slate-800'}`}>
              <div><div className="flex items-center justify-between mb-1.5"><span className="text-xs font-bold text-white">{item.role}</span>{isCurrent && <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">Current Workspace</span>}</div><p className="text-[11px] text-slate-400 leading-relaxed mb-3">{item.desc}</p></div>
              <div className="pt-2 border-t border-slate-800 space-y-1"><span className="text-[10px] uppercase font-bold text-slate-500 block">Privileges</span>{item.perms.map((perm)=><div key={perm} className="text-[10px] text-slate-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0"/><span>{perm}</span></div>)}</div>
            </div>;
          })}
        </div>
      </div>

      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start gap-2 text-[11px] text-slate-400"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0"/><span>Scope safeguard: the system covers logistics Stages 3–7 only. The Trust / Handoff Agent ends at Stage 6 (Destination Hub). Stage 7 is operational last-mile dispatch tracking only.</span></div>
    </div>
  );
};
