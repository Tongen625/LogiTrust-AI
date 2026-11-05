import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MobileTabBar, MobileProfileCard } from '../components/MobileTabBar';
import { ArrowLeft, CheckCircle2, FileText, ShieldCheck, Users, ArrowUpRight, LockKeyhole } from 'lucide-react';

export const AdminManagerAppView: React.FC = () => {
  const { userRole, recommendations, auditLogs, currentUser, approveRecommendation } = useLogistics();
  const isManager = userRole === 'Logistics Operations Manager';
  const tabs = isManager ? ['Overview', 'Approvals', 'Audit', 'Profile'] : ['Governance', 'Access', 'Audit', 'Profile'];
  const [tab, setTab] = useState(tabs[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [mobileScreen, setMobileScreen] = useState<'root' | 'governance-overview' | 'access-detail' | 'audit-detail' | 'approval-detail'>('root');
  const pending = useMemo(() => recommendations.filter((r) => r.status === 'Pending Approval'), [recommendations]);
  const primaryRec = pending[0];

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage((current) => current === msg ? null : current), 3500);
  };

  const changeTab = (nextTab: string) => {
    setTab(nextTab);
    setMobileScreen('root');
  };

  const backToTab = () => setMobileScreen('root');

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-white rounded-[34px] border-4 border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-[700px] text-slate-800 relative">
        <div className="bg-slate-50 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-blue-100">
          <span>11:02 AM</span><div className="w-16 h-3 bg-slate-200 rounded-full"></div><span className="text-blue-600">5G | 97%</span>
        </div>

        {message && <div className="bg-blue-600 text-white font-semibold px-4 py-2 text-[11px] flex items-center justify-between"><span>{message}</span><button onClick={() => setMessage(null)}>x</button></div>}

        <div className="bg-white p-4 border-b border-blue-100">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[10px] uppercase font-bold tracking-wider text-blue-600">{isManager ? 'Operations Manager' : 'Administrator'}</div><h2 className="text-base font-extrabold text-slate-900 mt-0.5">{isManager ? 'Manager Oversight App' : 'Admin Governance App'}</h2><p className="text-[11px] text-slate-500 mt-0.5">{isManager ? 'Approvals, exceptions and network oversight' : 'RBAC, safeguards and audit oversight'}</p></div>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">{currentUser.avatarInitials}</div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50">
          {mobileScreen !== 'root' && (
            <button onClick={backToTab} className="inline-flex items-center gap-1.5 text-blue-700 font-bold text-[11px] mb-1">
              <ArrowLeft className="w-3.5 h-3.5"/> Back
            </button>
          )}

          {mobileScreen === 'governance-overview' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
                <div className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Governance Overview</div>
                <div className="font-extrabold text-slate-900 mt-1">Platform Control Boundaries</div>
                <p className="text-[11px] text-slate-500 mt-1">Administrator controls access, safeguards and auditability without taking over operational decisions.</p>
              </div>
              {[
                ['RBAC Separation', 'Each role only receives workspaces relevant to its responsibilities.'],
                ['Human Approval Gate', 'Consequential AI route or schedule changes remain with the Operations Manager.'],
                ['Security Authority', 'Security cases are investigated and resolved only by the Security / Risk Officer.'],
                ['Custody Authority', 'Hub receiving and handoff verification remain with the Hub Operator.'],
                ['Driver Boundary', 'Drivers can submit evidence and movement updates but cannot self-approve verification.'],
              ].map(([title, desc]) => (
                <div key={title} className="p-3 bg-white rounded-xl border border-slate-200"><div className="font-bold text-slate-900">{title}</div><div className="text-[11px] text-slate-500 mt-1">{desc}</div></div>
              ))}
              <button onClick={() => { setTab('Access'); setMobileScreen('root'); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold">Review Access Privileges</button>
            </div>
          )}

          {mobileScreen === 'access-detail' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm"><Users className="w-5 h-5 text-blue-600"/><div className="font-extrabold text-slate-900 mt-2">Access Governance Detail</div><p className="text-[11px] text-slate-500 mt-1">Use the Access tab in this mobile app to review role boundaries. Full privilege toggles remain an Administrator function and do not grant protected operational authority.</p></div>
              <div className="grid grid-cols-1 gap-2">
                {['Operations Manager - approvals & oversight','Transport Coordinator - schedules & recovery','Security Officer - risk investigation','Hub Operator - custody & handoff','Driver - assigned movement & evidence','Administrator - RBAC & governance'].map((x) => <div key={x} className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 font-semibold">{x}</div>)}
              </div>
            </div>
          )}

          {mobileScreen === 'audit-detail' && (
            <div className="space-y-2">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm"><FileText className="w-5 h-5 text-blue-600"/><div className="font-extrabold text-slate-900 mt-2">Audit Detail</div><p className="text-[11px] text-slate-500 mt-1">Recent governance and approval actions remain visible here without leaving the mobile app.</p></div>
              {auditLogs.slice(0, 10).map((log) => <div key={log.id} className="p-3 bg-white rounded-xl border border-blue-100"><div className="font-semibold text-slate-900">{log.event}</div><div className="text-[10px] text-blue-600 font-mono mt-1">{log.timestamp}</div><div className="text-[11px] text-slate-500 mt-1">{log.result}</div></div>)}
            </div>
          )}

          {mobileScreen === 'approval-detail' && primaryRec && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm"><div className="text-[10px] uppercase font-bold text-blue-600">Approval Detail</div><div className="font-extrabold text-slate-900 mt-1">{primaryRec.id}</div><p className="text-[11px] text-slate-600 mt-2">{primaryRec.recommendation}</p></div>
              <div className="grid grid-cols-2 gap-2"><div className="p-3 rounded-xl bg-slate-100"><span className="text-[10px] text-slate-500 uppercase">Shipment</span><div className="font-bold mt-1">{primaryRec.shipmentId}</div></div><div className="p-3 rounded-xl bg-slate-100"><span className="text-[10px] text-slate-500 uppercase">Confidence</span><div className="font-bold mt-1">{primaryRec.confidence}%</div></div></div>
              <button onClick={() => { approveRecommendation(primaryRec.id, 'Approved from Manager mobile app'); notify('Recommendation approved and written to audit trail.'); backToTab(); }} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl">Approve Recommendation</button>
            </div>
          )}

          {mobileScreen === 'root' && tab === 'Profile' && <MobileProfileCard />}

          {mobileScreen === 'root' && isManager && tab === 'Overview' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white rounded-2xl border border-blue-100"><span className="text-[10px] text-slate-500 uppercase block">Pending Decisions</span><strong className="text-2xl text-slate-900">{pending.length}</strong></div>
                <div className="p-3 bg-white rounded-2xl border border-blue-100"><span className="text-[10px] text-slate-500 uppercase block">Audit Records</span><strong className="text-2xl text-slate-900">{auditLogs.length}</strong></div>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900"><div className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/>Human Decision Gate</div><p className="text-[11px] mt-1 text-blue-800">Consequential AI route or schedule changes require Operations Manager approval before execution.</p></div>
            </>
          )}

          {mobileScreen === 'root' && isManager && tab === 'Approvals' && (
            primaryRec ? <div className="p-3.5 bg-white rounded-2xl border border-blue-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between"><span className="text-[10px] uppercase font-bold text-blue-600">Pending Approval</span><span className="font-mono font-bold text-slate-800">{primaryRec.id}</span></div>
              <div className="font-semibold text-slate-800">{primaryRec.recommendation}</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]"><div className="p-2 rounded-xl bg-slate-50"><span className="text-slate-500 block uppercase">Shipment</span><strong>{primaryRec.shipmentId}</strong></div><div className="p-2 rounded-xl bg-slate-50"><span className="text-slate-500 block uppercase">Confidence</span><strong>{primaryRec.confidence}%</strong></div></div>
              <button onClick={() => { approveRecommendation(primaryRec.id, 'Approved from Manager mobile app'); notify('Recommendation approved and written to audit trail.'); }} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4"/>Approve Recommendation</button>
              <button onClick={() => setMobileScreen('approval-detail')} className="w-full py-2 bg-white text-blue-700 border border-blue-200 font-bold rounded-xl flex items-center justify-center gap-1.5"><ArrowUpRight className="w-4 h-4"/>Open Approval Details</button>
            </div> : <div className="p-5 bg-white rounded-2xl border border-blue-100 text-center text-slate-500">No pending AI approvals.</div>
          )}

          {mobileScreen === 'root' && !isManager && tab === 'Governance' && (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-blue-100"><div className="font-bold text-slate-900 flex items-center gap-1.5"><LockKeyhole className="w-4 h-4 text-blue-600"/>Administrator Boundary</div><p className="text-[11px] text-slate-500 mt-1">Admin governs access and safeguards only. Operational approvals, shipment actions, security resolution and custody verification remain with their assigned roles.</p></div>
              <button onClick={() => setMobileScreen('governance-overview')} className="w-full p-3 bg-blue-50 border border-blue-100 rounded-2xl text-left"><div className="font-bold text-blue-800">Open Governance Overview</div><div className="text-[11px] text-blue-700 mt-0.5">Review platform controls and role separation</div></button>
            </div>
          )}

          {mobileScreen === 'root' && !isManager && tab === 'Access' && (
            <button onClick={() => setMobileScreen('access-detail')} className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-left shadow-sm"><Users className="w-5 h-5 text-blue-600"/><div className="font-bold text-slate-900 mt-2">Users & Access Governance</div><div className="text-[11px] text-slate-500 mt-1">Review RBAC matrix, human gates and system safeguard controls.</div></button>
          )}

          {mobileScreen === 'root' && tab === 'Audit' && (
            <div className="space-y-2">
              <button onClick={() => setMobileScreen('audit-detail')} className="w-full p-3 bg-blue-50 border border-blue-100 rounded-2xl text-left"><FileText className="w-4 h-4 text-blue-600"/><div className="font-bold text-blue-800 mt-1">Open Audit Details</div></button>
              {auditLogs.slice(0, 6).map((log) => <div key={log.id} className="p-3 bg-white rounded-xl border border-blue-100"><div className="font-semibold text-slate-900">{log.event}</div><div className="text-[10px] text-blue-600 font-mono mt-1">{log.timestamp}</div><div className="text-[11px] text-slate-500 mt-1">{log.result}</div></div>)}
            </div>
          )}
        </div>
        <MobileTabBar tabs={tabs} active={tab} onChange={changeTab} />
      </div>
    </div>
  );
};
