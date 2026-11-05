import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MobileTabBar, MobileProfileCard } from '../components/MobileTabBar';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Package,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';

export const AdminManagerAppView: React.FC = () => {
  const {
    userRole,
    recommendations,
    auditLogs,
    currentUser,
    shipments,
    incidents,
    securityAlerts,
    approveRecommendation,
    rejectRecommendation,
  } = useLogistics();

  const isManager = userRole === 'Logistics Operations Manager';
  const tabs = isManager ? ['Overview', 'Approvals', 'Exceptions', 'Audit', 'Profile'] : ['Governance', 'Access', 'Audit', 'Profile'];
  const [tab, setTab] = useState(tabs[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [mobileScreen, setMobileScreen] = useState<'root' | 'governance-overview' | 'access-detail' | 'audit-detail' | 'approval-detail' | 'exception-detail'>('root');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [rejectMode, setRejectMode] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');

  const pending = useMemo(() => recommendations.filter((r: any) => r.status === 'Pending Approval'), [recommendations]);
  const openIncidents = useMemo(() => incidents.filter((i) => i.status !== 'Resolved'), [incidents]);
  const delayed = useMemo(() => shipments.filter((s) => s.delayMinutes > 0 || s.status === 'Delayed'), [shipments]);
  const activeSecurity = useMemo(() => securityAlerts.filter((a) => a.status !== 'Resolved'), [securityAlerts]);
  const selectedApproval = recommendations.find((r: any) => r.id === selectedApprovalId) || pending[0];
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || openIncidents[0];

  const notify = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage((current) => current === msg ? null : current), 3500);
  };

  const changeTab = (nextTab: string) => {
    setTab(nextTab);
    setMobileScreen('root');
    setRejectMode(false);
    setDecisionNote('');
  };

  const backToTab = () => {
    setMobileScreen('root');
    setRejectMode(false);
    setDecisionNote('');
  };

  const openApproval = (id: string) => {
    setSelectedApprovalId(id);
    setRejectMode(false);
    setDecisionNote('');
    setMobileScreen('approval-detail');
  };

  const processApproval = (type: 'approve' | 'reject') => {
    if (!selectedApproval) return;
    if (type === 'approve') {
      approveRecommendation(selectedApproval.id, decisionNote.trim() || 'Approved from Manager mobile app after evidence review.');
      notify(`${selectedApproval.id} approved and execution recorded.`);
    } else {
      rejectRecommendation(selectedApproval.id, decisionNote.trim() || 'Rejected from Manager mobile app; return to Transport Coordinator for revised review.');
      notify(`${selectedApproval.id} rejected and returned for revised review.`);
    }
    setRejectMode(false);
    setDecisionNote('');
    setMobileScreen('root');
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-white rounded-[34px] border-4 border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-[700px] text-slate-800 relative">
        <div className="bg-slate-50 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-blue-100">
          <span>11:02 AM</span><div className="w-16 h-3 bg-slate-200 rounded-full"></div><span className="text-blue-600">5G | 97%</span>
        </div>

        {message && <div className="bg-blue-600 text-white font-semibold px-4 py-2 text-[11px] flex items-center justify-between"><span>{message}</span><button onClick={() => setMessage(null)}>x</button></div>}

        <div className="bg-white p-4 border-b border-blue-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-600">{isManager ? 'Operations Manager' : 'Administrator'}</div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{isManager ? 'Manager Oversight App' : 'Admin Governance App'}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{isManager ? 'Approvals, exceptions and network oversight' : 'RBAC, safeguards and audit oversight'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">{currentUser.avatarInitials}</div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50">
          {mobileScreen !== 'root' && (
            <button onClick={backToTab} className="inline-flex items-center gap-1.5 text-blue-700 font-bold text-[11px] mb-1">
              <ArrowLeft className="w-3.5 h-3.5"/> Back
            </button>
          )}

          {isManager && mobileScreen === 'approval-detail' && selectedApproval && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-blue-600">Manager Approval Detail</div>
                <div className="font-extrabold text-slate-900 mt-1">{selectedApproval.id}</div>
                <div className="text-[11px] text-slate-500 mt-1">Shipment {selectedApproval.shipmentId} | Confidence {selectedApproval.confidence}%</div>
                <p className="text-[12px] font-semibold text-slate-800 mt-3">{selectedApproval.recommendation}</p>
                <p className="text-[11px] text-slate-500 mt-1">{selectedApproval.reason}</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="font-bold text-amber-900 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/>Detected Event</div>
                <div className="text-[11px] text-amber-900 mt-1">{selectedApproval.detectedEvent}</div>
              </div>

              <div className="space-y-2">
                {(selectedApproval.evidence || []).map((item: string, idx: number) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200"><span className="font-mono text-blue-600 mr-1.5">{idx + 1}.</span>{item}</div>
                ))}
              </div>

              <textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} rows={3} placeholder={rejectMode ? 'Reason for rejection...' : 'Optional manager approval notes...'} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[11px] outline-none focus:border-blue-500"/>

              {!rejectMode ? (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setRejectMode(true)} className="py-2.5 bg-white border border-rose-200 text-rose-700 font-bold rounded-xl flex items-center justify-center gap-1"><XCircle className="w-4 h-4"/>Reject</button>
                  <button onClick={() => processApproval('approve')} className="py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/>Approve</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">Rejecting does not close the incident. It returns the case to the Transport Coordinator for a revised plan.</div>
                  <div className="grid grid-cols-2 gap-2"><button onClick={() => setRejectMode(false)} className="py-2.5 bg-white border border-slate-200 font-bold rounded-xl">Cancel</button><button onClick={() => processApproval('reject')} className="py-2.5 bg-rose-600 text-white font-bold rounded-xl">Confirm Reject</button></div>
                </div>
              )}
            </div>
          )}

          {isManager && mobileScreen === 'exception-detail' && selectedIncident && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-blue-600">Exception Detail</div>
                <div className="font-extrabold text-slate-900 mt-1">{selectedIncident.id} - {selectedIncident.type}</div>
                <div className="text-[11px] text-slate-500 mt-1">{selectedIncident.location} | {selectedIncident.status}</div>
                <p className="text-[11px] text-slate-600 mt-3">{selectedIncident.details}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-100 rounded-xl"><div className="text-[10px] uppercase text-slate-500">Severity</div><div className="font-bold mt-1">{selectedIncident.severity}</div></div>
                <div className="p-3 bg-slate-100 rounded-xl"><div className="text-[10px] uppercase text-slate-500">Affected</div><div className="font-bold mt-1">{selectedIncident.affectedShipmentIds.length} shipment(s)</div></div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><div className="font-bold text-blue-900">Recommended Recovery</div><p className="text-[11px] text-blue-800 mt-1">{selectedIncident.recommendation}</p></div>
              <div className="p-3 bg-white rounded-xl border border-slate-200"><div className="font-bold text-slate-900">Manager boundary</div><p className="text-[11px] text-slate-500 mt-1">Monitor the case and decide only when a consequential recommendation reaches the approval queue. Operational recovery remains with the Transport Coordinator; security and custody actions remain with their specialist roles.</p></div>
            </div>
          )}

          {!isManager && mobileScreen === 'governance-overview' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm"><div className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Governance Overview</div><div className="font-extrabold text-slate-900 mt-1">Platform Control Boundaries</div><p className="text-[11px] text-slate-500 mt-1">Administrator controls access, safeguards and auditability without taking over operational decisions.</p></div>
              {[
                ['RBAC Separation', 'Each role only receives workspaces relevant to its responsibilities.'],
                ['Human Approval Gate', 'Major route or schedule changes require Operations Manager approval.'],
                ['Security Authority', 'Security cases are investigated and resolved only by the Security / Risk Officer.'],
                ['Custody Authority', 'Hub receiving and handoff verification remain with the Hub Operator.'],
                ['Driver Boundary', 'Drivers can submit evidence and movement updates but cannot self-approve verification.'],
              ].map(([title, desc]) => <div key={title} className="p-3 bg-white rounded-xl border border-slate-200"><div className="font-bold text-slate-900">{title}</div><div className="text-[11px] text-slate-500 mt-1">{desc}</div></div>)}
              <button onClick={() => { setTab('Access'); setMobileScreen('root'); }} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold">Review Access Privileges</button>
            </div>
          )}

          {!isManager && mobileScreen === 'access-detail' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm"><Users className="w-5 h-5 text-blue-600"/><div className="font-extrabold text-slate-900 mt-2">Access Governance Detail</div><p className="text-[11px] text-slate-500 mt-1">Use the Access tab in this mobile app to review role boundaries. Full privilege toggles remain an Administrator function and do not grant protected operational authority.</p></div>
              {['Operations Manager - approvals & oversight','Transport Coordinator - schedules & recovery','Security Officer - risk investigation','Hub Operator - custody & handoff','Driver - assigned movement & evidence','Administrator - RBAC & governance'].map((x) => <div key={x} className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 font-semibold">{x}</div>)}
            </div>
          )}

          {mobileScreen === 'audit-detail' && (
            <div className="space-y-2">
              <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm"><FileText className="w-5 h-5 text-blue-600"/><div className="font-extrabold text-slate-900 mt-2">Audit Detail</div><p className="text-[11px] text-slate-500 mt-1">Recent governance and operational decisions remain visible here without leaving the mobile app.</p></div>
              {auditLogs.slice(0, 12).map((log) => <div key={log.id} className="p-3 bg-white rounded-xl border border-blue-100"><div className="font-semibold text-slate-900">{log.event}</div><div className="text-[10px] text-blue-600 font-mono mt-1">{log.timestamp}</div><div className="text-[11px] text-slate-500 mt-1">{log.result}</div></div>)}
            </div>
          )}

          {mobileScreen === 'root' && tab === 'Profile' && <MobileProfileCard />}

          {mobileScreen === 'root' && isManager && tab === 'Overview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => changeTab('Approvals')} className="p-3 bg-white rounded-2xl border border-blue-100 text-left"><span className="text-[10px] text-slate-500 uppercase block">Pending Decisions</span><strong className="text-2xl text-slate-900">{pending.length}</strong></button>
                <button onClick={() => changeTab('Exceptions')} className="p-3 bg-white rounded-2xl border border-blue-100 text-left"><span className="text-[10px] text-slate-500 uppercase block">Open Exceptions</span><strong className="text-2xl text-slate-900">{openIncidents.length}</strong></button>
                <div className="p-3 bg-white rounded-2xl border border-blue-100"><span className="text-[10px] text-slate-500 uppercase block">Delayed Loads</span><strong className="text-2xl text-slate-900">{delayed.length}</strong></div>
                <div className="p-3 bg-white rounded-2xl border border-blue-100"><span className="text-[10px] text-slate-500 uppercase block">Security Alerts</span><strong className="text-2xl text-slate-900">{activeSecurity.length}</strong><div className="text-[9px] text-slate-400 mt-0.5">Security Officer owned</div></div>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900"><div className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/>Approval Control</div><p className="text-[11px] mt-1 text-blue-800">Major route or schedule changes require manager approval. Specialist actions stay with the responsible role.</p></div>
            </div>
          )}

          {mobileScreen === 'root' && isManager && tab === 'Approvals' && (
            <div className="space-y-2.5">
              {pending.map((rec: any) => (
                <button key={rec.id} onClick={() => openApproval(rec.id)} className="w-full p-3.5 bg-white rounded-2xl border border-blue-200 shadow-sm text-left">
                  <div className="flex items-center justify-between"><span className="text-[10px] uppercase font-bold text-blue-600">Pending Approval</span><span className="font-mono font-bold text-slate-800">{rec.id}</span></div>
                  <div className="font-semibold text-slate-800 mt-2">{rec.recommendation}</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mt-2"><div className="p-2 rounded-xl bg-slate-50"><span className="text-slate-500 block uppercase">Shipment</span><strong>{rec.shipmentId}</strong></div><div className="p-2 rounded-xl bg-slate-50"><span className="text-slate-500 block uppercase">Confidence</span><strong>{rec.confidence}%</strong></div></div>
                  <div className="text-[11px] font-bold text-blue-700 mt-2">Tap to review evidence and decide</div>
                </button>
              ))}
              {!pending.length && <div className="p-5 bg-white rounded-2xl border border-blue-100 text-center text-slate-500"><CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2"/>No pending approvals.</div>}
            </div>
          )}

          {mobileScreen === 'root' && isManager && tab === 'Exceptions' && (
            <div className="space-y-2.5">
              {openIncidents.map((incident) => (
                <button key={incident.id} onClick={() => { setSelectedIncidentId(incident.id); setMobileScreen('exception-detail'); }} className="w-full p-3.5 bg-white rounded-2xl border border-slate-200 text-left">
                  <div className="flex items-center justify-between gap-2"><span className="font-bold text-slate-900">{incident.type}</span><span className="text-[10px] font-bold text-blue-700">{incident.status}</span></div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">{incident.id} | {incident.location}</div>
                  <div className="text-[11px] text-slate-500 mt-2 line-clamp-2">{incident.details}</div>
                </button>
              ))}
              {!openIncidents.length && <div className="p-5 bg-white rounded-2xl border border-blue-100 text-center text-slate-500">No open operational exceptions.</div>}
            </div>
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
