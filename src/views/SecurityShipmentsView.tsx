import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { ShieldAlert, Search, MapPin, Truck, ArrowRight } from 'lucide-react';

export const SecurityShipmentsView: React.FC = () => {
  const { securityAlerts, shipments, setSelectedShipmentId, setActiveTab } = useLogistics();
  const [query, setQuery] = useState('');
  const cases = useMemo(() => securityAlerts.map(alert => ({ alert, shipment: shipments.find(s => s.id === alert.shipmentId) })).filter(x => x.shipment && `${x.alert.id} ${x.alert.shipmentId} ${x.alert.title} ${x.alert.anomalyType}`.toLowerCase().includes(query.toLowerCase())), [securityAlerts, shipments, query]);
  return <div className="p-4 lg:p-6 space-y-5 text-slate-800">
    <div><div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Security Scope</div><h1 className="text-2xl font-extrabold text-slate-900">Risk Cases</h1><p className="text-sm text-slate-500 mt-1">Only consignments that have a security alert or trust anomaly are shown here.</p></div>
    <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search case, shipment or anomaly..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-100 bg-white outline-none focus:ring-2 focus:ring-blue-200" /></div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {cases.map(({ alert, shipment }) => <div key={alert.id} className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-rose-600" /></div><div><div className="font-mono text-sm font-bold text-blue-700">{alert.id} • {shipment!.id}</div><h3 className="font-extrabold text-slate-900 mt-0.5">{alert.title}</h3></div></div><span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-700">{alert.status}</span></div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Vehicle / Service</div><div className="font-bold mt-1 flex items-center gap-1.5"><Truck className="w-4 h-4 text-blue-600" />{shipment!.assignedVehicleOrTrain}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Current Location</div><div className="font-bold mt-1 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-600" />{shipment!.currentLocation}</div></div></div>
        <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-sm text-slate-700"><div className="text-xs font-bold uppercase text-rose-700">Security relevance</div><div className="mt-1">{alert.anomalyType} • {alert.actualMovement}</div></div>
        <div className="mt-4 flex gap-2"><button onClick={() => { setSelectedShipmentId(shipment!.id); setActiveTab('tracking'); }} className="flex-1 py-2 rounded-xl border border-blue-200 text-blue-700 font-bold text-sm">Risk Tracking</button><button onClick={() => { setSelectedShipmentId(shipment!.id); setActiveTab('security'); }} className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-1.5">Investigate <ArrowRight className="w-4 h-4" /></button></div>
      </div>)}
    </div>
  </div>;
};
