import React, { useEffect, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { ShieldCheck, ShieldAlert, Send, CheckCircle2, Siren, MapPinned, Fingerprint, Radio, FileText } from 'lucide-react';

export const SecurityTrustView: React.FC = () => {
  const { securityAlerts, shipments, requestDriverVerification, resolveSecurityAlert, escalateSecurityAlert, selectedShipmentId, setSelectedShipmentId } = useLogistics();
  const [selectedAlertId, setSelectedAlertId] = useState(securityAlerts[0]?.id || '');

  useEffect(() => {
    const match = securityAlerts.find(a => a.shipmentId === selectedShipmentId);
    if (match) setSelectedAlertId(match.id);
  }, [selectedShipmentId, securityAlerts]);

  const selectedAlert = securityAlerts.find(a => a.id === selectedAlertId) || securityAlerts[0];
  if (!selectedAlert) return <div className="p-6 text-slate-600">No security alerts available.</div>;
  const shipment = shipments.find(s => s.id === selectedAlert.shipmentId);

  return <div className="p-4 lg:p-6 space-y-5 text-slate-800">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div><div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Security & Digital Trust</div><h1 className="text-2xl font-extrabold text-slate-900">Investigation Console</h1><p className="text-sm text-slate-500 mt-1">Review anomaly evidence, verify the driver or operator, then resolve or escalate.</p></div>
      <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Non-accusatory AI safeguard active</div>
    </div>

    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" /><div><div className="font-bold text-slate-900">Human-controlled security decision</div><div className="text-sm text-slate-600 mt-1">AI detects inconsistent evidence and recommends verification. The Security Officer remains responsible for clearing or escalating the case.</div></div></div>

    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <div className="xl:col-span-4 space-y-3"><div className="flex items-center justify-between px-1"><h2 className="font-extrabold text-slate-900">Security Cases</h2><span className="text-xs font-bold text-rose-600">{securityAlerts.filter(a => a.status !== 'Resolved').length} active</span></div>{securityAlerts.map(alert => <button key={alert.id} onClick={() => { setSelectedAlertId(alert.id); setSelectedShipmentId(alert.shipmentId); }} className={`w-full text-left p-4 rounded-2xl border transition ${alert.id === selectedAlert.id ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-blue-100 hover:border-blue-200'}`}><div className="flex items-center justify-between"><span className="font-mono font-bold text-blue-700">{alert.id} • {alert.shipmentId}</span><span className={`text-xs font-bold ${alert.status === 'Resolved' ? 'text-emerald-600' : 'text-rose-600'}`}>{alert.status}</span></div><div className="font-bold text-slate-900 mt-2">{alert.title}</div><div className="text-xs text-slate-500 mt-2">{alert.detectedAt} • {alert.anomalyType}</div></button>)}</div>

      <div className="xl:col-span-8 bg-white border border-blue-100 rounded-2xl shadow-sm p-4 lg:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 border-b border-slate-100 pb-4"><div><div className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-600" /><h2 className="text-lg font-extrabold text-slate-900">{selectedAlert.title}</h2></div><div className="text-sm text-slate-500 mt-1">Case {selectedAlert.id} • Shipment {selectedAlert.shipmentId}{shipment ? ` • ${shipment.assignedVehicleOrTrain}` : ''}</div></div><span className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{selectedAlert.riskLevel} Risk</span></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5"><MapPinned className="w-4 h-4" />Approved route</div><div className="text-sm text-slate-700 mt-1">{selectedAlert.expectedRoute}</div></div><div className="rounded-xl bg-rose-50 p-3 border border-rose-100"><div className="text-xs font-bold uppercase text-rose-700 flex items-center gap-1.5"><Radio className="w-4 h-4" />Observed movement</div><div className="text-sm text-slate-700 mt-1">{selectedAlert.actualMovement}</div>{selectedAlert.deviationKm && <div className="text-sm font-extrabold text-rose-700 mt-1">+{selectedAlert.deviationKm} km deviation</div>}</div></div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4"><div className="text-xs font-bold uppercase text-blue-700">Route Risk Agent assessment</div><div className="text-sm text-slate-700 mt-2 leading-relaxed">{selectedAlert.aiAssessment}</div><div className="mt-3 pt-3 border-t border-blue-100 text-sm"><span className="text-slate-500">Recommended: </span><strong className="text-blue-800">{selectedAlert.recommendedAction}</strong></div></div>

        <div><div className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5"><Fingerprint className="w-4 h-4" />Digital evidence timeline</div><div className="space-y-2">{selectedAlert.evidence.map((item, idx) => <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-start justify-between gap-3"><div className="flex gap-3"><span className="font-mono text-xs font-bold text-blue-700">{item.time}</span><div><div className="text-sm font-bold text-slate-800">{item.event}</div><div className="text-xs text-slate-500 mt-1">{item.details}</div><div className="text-[11px] text-slate-400 mt-1">Source: {item.sensor}</div></div></div><span className={`text-xs font-bold ${item.status === 'Anomaly' ? 'text-rose-600' : item.status === 'Warning' ? 'text-amber-600' : 'text-emerald-600'}`}>{item.status}</span></div>)}</div></div>

        {selectedAlert.status === 'Resolved' ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /><div><div className="font-bold text-emerald-800">Case resolved</div><div className="text-sm text-slate-600 mt-1">{selectedAlert.verificationNotes || 'Evidence was reviewed and the anomaly was cleared.'}</div></div></div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1"><button onClick={() => requestDriverVerification(selectedAlert.id, `Verification requested for ${selectedAlert.shipmentId}; confirm route, stop reason and telematics evidence.`)} className="py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2"><Send className="w-4 h-4" />Request Verification</button><button onClick={() => resolveSecurityAlert(selectedAlert.id, 'Security Officer reviewed telemetry and supporting evidence; anomaly cleared with human verification.')} className="py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Resolve Case</button><button onClick={() => escalateSecurityAlert(selectedAlert.id, 'Evidence remains inconsistent after review; escalated for formal security investigation.')} className="py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center justify-center gap-2"><Siren className="w-4 h-4" />Escalate</button></div>}

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500 flex items-start gap-2"><FileText className="w-4 h-4 mt-0.5 text-blue-600" />All verification, resolution and escalation actions are recorded in the Security Audit Trail for explainability and accountability.</div>
      </div>
    </div>
  </div>;
};
