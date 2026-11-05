import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock3,
  FileSearch,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const {
    recommendations,
    approveRecommendation,
    rejectRecommendation,
    shipments,
    incidents,
    setSelectedShipmentId,
    setActiveTab,
  } = useLogistics();

  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [actionRecId, setActionRecId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const pending = useMemo(
    () => recommendations.filter((rec: any) => rec.status === 'Pending Approval'),
    [recommendations]
  );
  const history = useMemo(
    () => recommendations.filter((rec: any) => ['Approved', 'Rejected'].includes(rec.status)),
    [recommendations]
  );
  const selectedRec = recommendations.find((rec: any) => rec.id === selectedRecId);
  const actionRec = recommendations.find((rec: any) => rec.id === actionRecId);

  const openAction = (recId: string, type: 'approve' | 'reject') => {
    const rec = recommendations.find((item: any) => item.id === recId);
    setActionRecId(recId);
    setActionType(type);
    setActionNotes(type === 'approve'
      ? `Approved after reviewing ETA, capacity, cost, security and SLA evidence for ${rec?.shipmentId || 'shipment'}.`
      : 'Reject this recommendation and return the case to the Transport Coordinator for revised review.');
  };

  const confirmAction = () => {
    if (!actionRec || !actionType) return;
    if (actionType === 'approve') approveRecommendation(actionRec.id, actionNotes.trim() || 'Approved by Operations Manager');
    else rejectRecommendation(actionRec.id, actionNotes.trim() || 'Rejected by Operations Manager');
    setActionRecId(null);
    setActionType(null);
    setActionNotes('');
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-blue-600">Logistics Operations Manager</div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">AI Decision Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Approve or reject only consequential transport changes submitted by the Transport Coordinator. Specialist security, custody and routine schedule actions remain with their assigned roles.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800"><strong>{pending.length}</strong> Pending</div>
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600"><strong>{history.length}</strong> Processed</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-slate-900 text-sm">Human decision gate</div>
          <p className="text-xs text-slate-600 mt-1">A pending item reaches this queue only after the Transport Coordinator has reviewed feasibility and classified the change as consequential. Approval executes the recovery plan and records the audit outcome; rejection returns the case for revised coordinator review.</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-blue-100 text-center shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="font-bold text-slate-900 mt-2">No pending manager decisions</div>
          <p className="text-xs text-slate-500 mt-1">All submitted consequential recommendations have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((rec: any) => {
            const shipment = shipments.find((s) => s.id === rec.shipmentId);
            const incident = incidents.find((i) => i.id === rec.incidentId || i.affectedShipmentIds.includes(rec.shipmentId) && i.status === 'Pending Approval');
            return (
              <div key={rec.id} className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-blue-100 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-700">{rec.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">Pending Manager Approval</span>
                    </div>
                    <div className="font-extrabold text-slate-900 mt-2">{rec.recommendation}</div>
                    <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase text-slate-400">Confidence</div>
                    <div className="text-2xl font-extrabold text-blue-700">{rec.confidence}%</div>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50"><span className="text-[10px] uppercase text-slate-400">Shipment</span><div className="font-bold mt-1">{rec.shipmentId}</div></div>
                  <div className="p-3 rounded-xl bg-slate-50"><span className="text-[10px] uppercase text-slate-400">Current service</span><div className="font-bold mt-1">{shipment?.assignedVehicleOrTrain || '-'}</div></div>
                  <div className="p-3 rounded-xl bg-slate-50"><span className="text-[10px] uppercase text-slate-400">Expected recovery</span><div className="font-bold mt-1">{rec.expectedImprovementMins ? `${rec.expectedImprovementMins} min` : 'Recalculated'}</div></div>
                  <div className="p-3 rounded-xl bg-slate-50"><span className="text-[10px] uppercase text-slate-400">Capacity</span><div className="font-bold mt-1">{rec.capacityStatus || 'Reviewed'}</div></div>
                  <div className="p-3 rounded-xl bg-slate-50"><span className="text-[10px] uppercase text-slate-400">Linked case</span><div className="font-bold mt-1">{incident?.id || 'Direct decision'}</div></div>
                </div>

                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  <button onClick={() => setSelectedRecId(rec.id)} className="px-3 py-2 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 text-xs font-bold flex items-center gap-1.5"><FileSearch className="w-4 h-4"/> Review Evidence</button>
                  <button onClick={() => { setSelectedShipmentId(rec.shipmentId); setActiveTab('shipments'); }} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white text-xs font-bold">Open Shipment</button>
                  <div className="flex-1" />
                  <button onClick={() => openAction(rec.id, 'reject')} className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-white text-xs font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Reject</button>
                  <button onClick={() => openAction(rec.id, 'approve')} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5"><CheckSquare className="w-4 h-4"/> Approve & Execute</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-blue-100"><h2 className="font-bold text-slate-900">Decision History</h2><p className="text-xs text-slate-500 mt-1">Processed manager decisions remain auditable after execution.</p></div>
        <div className="divide-y divide-blue-50">
          {history.slice(0, 8).map((rec: any) => (
            <div key={rec.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0"><div className="font-semibold text-sm text-slate-900">{rec.id} <span className="font-normal text-slate-400">- {rec.shipmentId}</span></div><div className="text-xs text-slate-500 truncate mt-1">{rec.recommendation}</div></div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${rec.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{rec.status}</span>
            </div>
          ))}
          {!history.length && <div className="p-5 text-sm text-slate-500">No processed decisions yet.</div>}
        </div>
      </div>

      {selectedRec && (
        <div className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3"><div><div className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Decision Evidence</div><h3 className="text-lg font-bold text-slate-900 mt-1">{selectedRec.id} - {selectedRec.shipmentId}</h3></div><button onClick={() => setSelectedRecId(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-4 h-4"/></button></div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><div className="font-bold text-amber-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>Detected event</div><p className="text-sm text-amber-900 mt-1">{selectedRec.detectedEvent}</p><p className="text-xs text-amber-800 mt-2">{selectedRec.impact}</p></div>
              <div><div className="text-xs font-bold uppercase text-slate-500 mb-2">Evidence bundle</div><div className="space-y-2">{(selectedRec.evidence || []).map((item: string, idx: number) => <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700"><span className="font-mono text-blue-600 mr-2">{idx + 1}.</span>{item}</div>)}</div></div>
              <div><div className="text-xs font-bold uppercase text-slate-500 mb-2">Alternatives considered</div><div className="space-y-2">{(selectedRec.alternativesConsidered || []).map((alt: any, idx: number) => <div key={idx} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3"><div><div className="font-bold text-slate-900">{alt.name}</div><div className="text-xs text-slate-500 mt-1">ETA {alt.eta} | Capacity {alt.capacity} | Risk {alt.risk}</div></div><div className="text-sm font-extrabold text-blue-700">{alt.score}/100</div></div>)}</div></div>
            </div>
          </div>
        </div>
      )}

      {actionRec && actionType && (
        <div className="fixed inset-0 z-[95] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200"><div className="flex items-center gap-2">{actionType === 'approve' ? <CheckCircle2 className="w-5 h-5 text-emerald-600"/> : <AlertTriangle className="w-5 h-5 text-rose-600"/>}<h3 className="font-bold text-slate-900">{actionType === 'approve' ? 'Confirm approval and execution' : 'Reject recommendation'}</h3></div><p className="text-xs text-slate-500 mt-2">{actionRec.id} - {actionRec.shipmentId}. This decision will be written to the audit trail.</p></div>
            <div className="p-5"><label className="text-xs font-bold text-slate-700">Manager decision notes</label><textarea value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"/></div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2"><button onClick={() => { setActionRecId(null); setActionType(null); }} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold">Cancel</button><button onClick={confirmAction} className={`px-4 py-2 rounded-xl text-white text-sm font-bold ${actionType === 'approve' ? 'bg-blue-600' : 'bg-rose-600'}`}>{actionType === 'approve' ? 'Approve & Execute' : 'Reject & Return to Coordinator'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
