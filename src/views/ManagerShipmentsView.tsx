import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Package,
  Search,
  ShieldAlert,
  Truck,
} from 'lucide-react';

const cleanLabel = (value: string) => value.replace(/^Stage\s*\d+\s*[:\-]?\s*/i, '').trim();

export const ManagerShipmentsView: React.FC = () => {
  const {
    shipments,
    incidents,
    recommendations,
    securityAlerts,
    auditLogs,
    selectedShipmentId,
    setSelectedShipmentId,
    setActiveTab,
  } = useLogistics();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [detailTab, setDetailTab] = useState<'summary' | 'journey' | 'exceptions' | 'audit'>('summary');

  const filtered = useMemo(() => shipments.filter((shipment) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [
      shipment.id,
      shipment.origin,
      shipment.destination,
      shipment.currentLocation,
      shipment.assignedVehicleOrTrain,
    ].some((value) => value.toLowerCase().includes(q));

    return matchesSearch
      && (statusFilter === 'ALL' || shipment.status === statusFilter)
      && (riskFilter === 'ALL' || shipment.riskLevel === riskFilter);
  }), [shipments, search, statusFilter, riskFilter]);

  const selected = shipments.find((shipment) => shipment.id === selectedShipmentId) || filtered[0] || shipments[0];

  const shipmentIncidents = useMemo(() => {
    if (!selected) return [];
    return incidents.filter((incident) => incident.shipmentId === selected.id || incident.affectedShipmentIds.includes(selected.id));
  }, [incidents, selected]);

  const shipmentRecommendations = useMemo(() => {
    if (!selected) return [];
    return recommendations.filter((recommendation) => recommendation.shipmentId === selected.id);
  }, [recommendations, selected]);

  const shipmentAlerts = useMemo(() => {
    if (!selected) return [];
    return securityAlerts.filter((alert) => alert.shipmentId === selected.id);
  }, [securityAlerts, selected]);

  const shipmentAudit = useMemo(() => {
    if (!selected) return [];
    return auditLogs.filter((log) => log.shipmentId === selected.id).slice(0, 10);
  }, [auditLogs, selected]);

  const pendingDecision = shipmentRecommendations.find((item) => item.status === 'Pending Approval');
  const openIncident = shipmentIncidents.find((item) => item.status !== 'Resolved');
  const openSecurity = shipmentAlerts.find((item) => item.status !== 'Resolved');

  if (!selected) {
    return <div className="p-6 text-slate-500">No shipment records available.</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 text-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Network Shipments</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor shipment progress, delays, risk and decisions that need manager attention.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center min-w-[330px]">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2"><div className="text-[10px] uppercase text-slate-500">Active</div><div className="font-extrabold text-slate-900">{shipments.length}</div></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"><div className="text-[10px] uppercase text-amber-700">Delayed</div><div className="font-extrabold text-amber-900">{shipments.filter((s) => s.delayMinutes > 0 || s.status === 'Delayed').length}</div></div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2"><div className="text-[10px] uppercase text-rose-700">High Risk</div><div className="font-extrabold text-rose-900">{shipments.filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Critical').length}</div></div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 flex flex-wrap gap-2 items-center shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shipment, city, location or vehicle..." className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-400" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
          <option value="ALL">All statuses</option>
          {[...new Set(shipments.map((s) => s.status))].map((status) => <option key={status} value={status}>{cleanLabel(status)}</option>)}
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
          <option value="ALL">All risk levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section className="xl:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-slate-900">Shipment list</div>
            <div className="text-[11px] text-slate-400">{filtered.length} shown</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200">
                <tr><th className="px-3 py-2.5">Shipment</th><th className="px-3 py-2.5">Route</th><th className="px-3 py-2.5">Current location</th><th className="px-3 py-2.5">ETA</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Risk</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((shipment) => {
                  const active = shipment.id === selected.id;
                  return (
                    <tr key={shipment.id} onClick={() => { setSelectedShipmentId(shipment.id); setDetailTab('summary'); }} className={`cursor-pointer ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-3 py-3 font-mono font-bold text-blue-700">{shipment.id}</td>
                      <td className="px-3 py-3"><div className="font-semibold text-slate-800">{shipment.origin} - {shipment.destination}</div><div className="text-[10px] text-slate-400">{shipment.assignedVehicleOrTrain}</div></td>
                      <td className="px-3 py-3 text-slate-600 max-w-[150px] truncate">{cleanLabel(shipment.currentLocation)}</td>
                      <td className="px-3 py-3 font-mono text-slate-700">{shipment.eta}</td>
                      <td className="px-3 py-3"><span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">{cleanLabel(shipment.status)}</span></td>
                      <td className="px-3 py-3"><span className={`font-bold ${shipment.riskLevel === 'High' || shipment.riskLevel === 'Critical' ? 'text-rose-600' : shipment.riskLevel === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{shipment.riskLevel}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="xl:col-span-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div><div className="text-[10px] uppercase font-bold text-blue-600">Selected shipment</div><h2 className="font-extrabold text-slate-900 mt-1">{selected.id}</h2><p className="text-xs text-slate-500 mt-1">{selected.origin} to {selected.destination}</p></div>
              <Package className="w-7 h-7 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
              <div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400 block uppercase text-[9px]">Current location</span><strong className="text-slate-800">{cleanLabel(selected.currentLocation)}</strong></div>
              <div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400 block uppercase text-[9px]">Transport</span><strong className="text-slate-800">{selected.assignedVehicleOrTrain}</strong></div>
              <div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400 block uppercase text-[9px]">ETA</span><strong className="text-slate-800">{selected.eta}</strong></div>
              <div className="rounded-xl bg-slate-50 p-2.5"><span className="text-slate-400 block uppercase text-[9px]">Delay</span><strong className={selected.delayMinutes > 0 ? 'text-amber-700' : 'text-emerald-700'}>{selected.delayMinutes > 0 ? `${selected.delayMinutes} min` : 'On plan'}</strong></div>
            </div>
          </div>

          <div className="px-4 pt-3 flex gap-1 overflow-x-auto border-b border-slate-100">
            {[
              ['summary','Summary'],['journey','Journey'],['exceptions','Exceptions'],['audit','Audit']
            ].map(([id,label]) => <button key={id} onClick={() => setDetailTab(id as typeof detailTab)} className={`px-3 py-2 text-[11px] font-bold border-b-2 whitespace-nowrap ${detailTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400'}`}>{label}</button>)}
          </div>

          <div className="p-4 min-h-[360px]">
            {detailTab === 'summary' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`rounded-xl border p-2 ${openIncident ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}><AlertTriangle className={`w-4 h-4 mx-auto ${openIncident ? 'text-amber-600' : 'text-emerald-600'}`} /><div className="text-[9px] uppercase mt-1 text-slate-500">Exception</div><div className="text-[10px] font-bold">{openIncident ? 'Open' : 'Clear'}</div></div>
                  <div className={`rounded-xl border p-2 ${pendingDecision ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}><Clock3 className={`w-4 h-4 mx-auto ${pendingDecision ? 'text-blue-600' : 'text-emerald-600'}`} /><div className="text-[9px] uppercase mt-1 text-slate-500">Decision</div><div className="text-[10px] font-bold">{pendingDecision ? 'Pending' : 'None'}</div></div>
                  <div className={`rounded-xl border p-2 ${openSecurity ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}><ShieldAlert className={`w-4 h-4 mx-auto ${openSecurity ? 'text-rose-600' : 'text-emerald-600'}`} /><div className="text-[9px] uppercase mt-1 text-slate-500">Security</div><div className="text-[10px] font-bold">{openSecurity ? 'Review' : 'Clear'}</div></div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 space-y-2 text-[11px]">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-600"/><span className="text-slate-500">Route</span><strong className="ml-auto text-right">{selected.originHub} to {selected.destinationHub}</strong></div>
                  <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-blue-600"/><span className="text-slate-500">Mode</span><strong className="ml-auto">{selected.transportMode}</strong></div>
                  <div className="flex items-center gap-2"><Package className="w-4 h-4 text-blue-600"/><span className="text-slate-500">Parcels</span><strong className="ml-auto">{selected.parcelCount || selected.parcelIds?.length || 1}</strong></div>
                </div>

                {pendingDecision && <button onClick={() => setActiveTab('approvals')} className="w-full rounded-xl bg-blue-600 text-white font-bold py-2.5 text-xs">Review pending decision</button>}
                {!pendingDecision && openIncident && <button onClick={() => setActiveTab('control-tower')} className="w-full rounded-xl bg-amber-500 text-slate-950 font-bold py-2.5 text-xs">Open exception in Control Tower</button>}
                {openSecurity && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800"><strong>Security Officer handling:</strong> {openSecurity.title}</div>}
                {!pendingDecision && !openIncident && !openSecurity && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>No manager action required for this shipment.</div>}
              </div>
            )}

            {detailTab === 'journey' && (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {selected.timeline.map((item, index) => (
                  <div key={`${item.timestamp}-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2"><strong className="text-xs text-slate-900">{cleanLabel(item.stage)}</strong><span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span></div>
                    <div className="text-[11px] text-slate-600 mt-1">{cleanLabel(item.location)}</div>
                    {item.notes && <div className="text-[10px] text-slate-500 mt-1">{cleanLabel(item.notes)}</div>}
                    {item.verifiedBy && <div className="text-[10px] text-emerald-700 mt-1">Verified by {item.verifiedBy}</div>}
                  </div>
                ))}
              </div>
            )}

            {detailTab === 'exceptions' && (
              <div className="space-y-3">
                {shipmentIncidents.length === 0 && shipmentAlerts.length === 0 && shipmentRecommendations.length === 0 && <div className="text-center text-slate-400 py-8 text-xs">No exception or decision records for this shipment.</div>}
                {shipmentIncidents.map((incident) => <div key={incident.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="flex justify-between gap-2"><strong className="text-amber-900">{incident.type}</strong><span className="text-[10px] font-bold text-amber-700">{incident.status}</span></div><div className="text-[11px] text-amber-900 mt-1">{incident.details}</div></div>)}
                {shipmentRecommendations.map((rec) => <div key={rec.id} className="rounded-xl border border-blue-200 bg-blue-50 p-3"><div className="flex justify-between gap-2"><strong className="text-blue-900">Decision {rec.id}</strong><span className="text-[10px] font-bold text-blue-700">{rec.status}</span></div><div className="text-[11px] text-blue-900 mt-1">{rec.recommendation}</div>{rec.status === 'Pending Approval' && <button onClick={() => setActiveTab('approvals')} className="mt-2 text-[11px] font-bold text-blue-700 underline">Review decision</button>}</div>)}
                {shipmentAlerts.map((alert) => <div key={alert.id} className="rounded-xl border border-rose-200 bg-rose-50 p-3"><div className="flex justify-between gap-2"><strong className="text-rose-900">{alert.title}</strong><span className="text-[10px] font-bold text-rose-700">{alert.status}</span></div><div className="text-[11px] text-rose-900 mt-1">Owned by Security Officer. Manager monitors status only.</div></div>)}
              </div>
            )}

            {detailTab === 'audit' && (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {shipmentAudit.length ? shipmentAudit.map((log) => <div key={log.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600"/><strong className="text-[11px] text-slate-900">{cleanLabel(log.event)}</strong></div><div className="text-[10px] text-slate-400 font-mono mt-1">{log.timestamp} | {log.actor}</div><div className="text-[10px] text-slate-600 mt-1">{cleanLabel(log.result)}</div></div>) : <div className="text-center text-slate-400 py-8 text-xs">No shipment audit entries yet.</div>}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
