import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { AlertTriangle, ShieldAlert, ShieldCheck, MapPinned, FileSearch, ArrowRight } from 'lucide-react';

export const SecurityDashboardView: React.FC = () => {
  const { securityAlerts, shipments, auditLogs, setActiveTab, setSelectedShipmentId } = useLogistics();
  const activeAlerts = securityAlerts.filter(a => a.status !== 'Resolved');
  const monitoredIds = new Set(securityAlerts.map(a => a.shipmentId));
  const monitoredShipments = shipments.filter(s => monitoredIds.has(s.id));
  const highRisk = activeAlerts.filter(a => a.riskLevel === 'High' || a.riskLevel === 'Critical').length;
  const verification = activeAlerts.filter(a => a.status === 'Verification Requested' || a.status === 'Investigating').length;
  const securityAudit = auditLogs.filter(l => monitoredIds.has(l.shipmentId || '') || /security|risk|deviation|verification|geofence/i.test(`${l.event} ${l.aiDecision} ${l.humanDecision}`));

  return <div className="p-4 lg:p-6 space-y-5 text-slate-800">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Security Officer Workspace</div>
        <h1 className="text-2xl font-extrabold text-slate-900">Security Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Only security-relevant shipments, anomalies, evidence and investigation activity.</p>
      </div>
      <button onClick={() => setActiveTab('security')} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center gap-2 w-fit">Open Investigations <ArrowRight className="w-4 h-4" /></button>
    </div>

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {[
        ['Active Alerts', activeAlerts.length, ShieldAlert, 'text-rose-600'],
        ['High-Risk Cases', highRisk, AlertTriangle, 'text-amber-600'],
        ['Awaiting Verification', verification, FileSearch, 'text-blue-600'],
        ['Monitored Shipments', monitoredShipments.length, MapPinned, 'text-emerald-600'],
      ].map(([label, value, Icon, cls]: any) => <div key={label} className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase text-slate-500">{label}</span><Icon className={`w-5 h-5 ${cls}`} /></div>
        <div className="mt-3 text-3xl font-extrabold text-slate-900">{value}</div>
      </div>)}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">Priority Security Cases</h2><p className="text-xs text-slate-500">Cases currently requiring Security Officer attention.</p></div><button onClick={() => setActiveTab('security')} className="text-sm font-bold text-blue-600">View all</button></div>
        <div className="divide-y divide-slate-100">
          {activeAlerts.map(alert => {
            const shipment = shipments.find(s => s.id === alert.shipmentId);
            return <button key={alert.id} onClick={() => { setSelectedShipmentId(alert.shipmentId); setActiveTab('security'); }} className="w-full p-4 text-left hover:bg-blue-50/50 transition">
              <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-mono text-sm font-bold text-blue-700">{alert.id}</span><span className="font-mono text-sm text-slate-600">{alert.shipmentId}</span></div><div className="font-bold text-slate-900 mt-1">{alert.title}</div><div className="text-xs text-slate-500 mt-1">{shipment?.assignedVehicleOrTrain} • {alert.detectedAt} • {alert.anomalyType}</div></div><span className={`px-2 py-1 rounded-lg text-xs font-bold ${alert.riskLevel === 'High' || alert.riskLevel === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{alert.riskLevel}</span></div>
            </button>;
          })}
        </div>
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /><h2 className="font-extrabold text-slate-900">Trust Safeguard</h2></div>
        <p className="text-sm text-slate-600 leading-relaxed">AI flags unusual evidence; it does not accuse a driver or operator. Human verification is required before escalation or closure.</p>
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm"><div className="font-bold text-blue-800">Recent security audit activity</div><div className="text-2xl font-extrabold text-slate-900 mt-1">{securityAudit.length}</div><div className="text-xs text-slate-500">security-related audit records</div></div>
        <button onClick={() => setActiveTab('audit')} className="w-full py-2 rounded-xl border border-blue-200 text-blue-700 font-bold text-sm">Open Security Audit Trail</button>
      </div>
    </div>
  </div>;
};
