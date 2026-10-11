import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MalaysiaLogisticsMap } from '../components/MalaysiaLogisticsMap';
import { Compass, Search, MapPin, Clock, ShieldAlert, Train, Truck } from 'lucide-react';

export const LiveTrackingView: React.FC = () => {
  const { shipments, selectedShipmentId, setSelectedShipmentId, selectedShipment } = useLogistics();
  const [filter, setFilter] = useState<'All'|'Normal'|'Delayed'|'At Risk'|'Security Review'>('All');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => shipments.filter(s => {
    const q = query.trim().toLowerCase();
    const text = `${s.id} ${s.originHub} ${s.destinationHub} ${s.currentLocation}`.toLowerCase();
    const matchesQ = !q || text.includes(q);
    const matchesFilter = filter === 'All' ||
      (filter === 'Normal' && s.riskLevel === 'Low' && s.delayMinutes === 0 && s.status !== 'Security Review') ||
      (filter === 'Delayed' && s.delayMinutes > 0) ||
      (filter === 'At Risk' && ['High','Critical'].includes(s.riskLevel)) ||
      (filter === 'Security Review' && s.status === 'Security Review');
    return matchesQ && matchesFilter;
  }), [shipments, query, filter]);

  return <div className="p-4 lg:p-6 space-y-5">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
      <div><div className="flex items-center gap-2"><Compass className="w-5 h-5 text-cyan-400"/><h1 className="text-xl font-extrabold text-white">Live Shipment Tracking</h1></div><p className="text-xs text-slate-400 mt-1">Operational tracking for Stages 3–7: expected corridor, current movement, hub position, ETA and risk state.</p></div>
      <div className="flex flex-wrap gap-2">{(['All','Normal','Delayed','At Risk','Security Review'] as const).map(x=><button key={x} onClick={()=>setFilter(x)} className={`px-3 py-1.5 rounded-lg text-xs border ${filter===x?'bg-cyan-500/20 text-cyan-300 border-cyan-500/40':'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}>{x}</button>)}</div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
      <aside className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-3 border-b border-slate-800"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search shipment / hub" className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-cyan-500"/></div></div>
        <div className="max-h-[610px] overflow-y-auto divide-y divide-slate-800/80">{filtered.map(s=><button key={s.id} onClick={()=>setSelectedShipmentId(s.id)} className={`w-full p-3 text-left hover:bg-slate-800/60 transition ${selectedShipmentId===s.id?'bg-cyan-950/25 border-l-2 border-cyan-400':'border-l-2 border-transparent'}`}><div className="flex items-center justify-between"><span className="text-xs font-mono font-bold text-cyan-300">{s.id}</span><span className={`text-[10px] font-bold ${s.riskLevel==='High'||s.riskLevel==='Critical'?'text-rose-400':s.riskLevel==='Medium'?'text-amber-400':'text-emerald-400'}`}>{s.riskLevel}</span></div><div className="text-[11px] text-slate-300 mt-1 truncate">{s.currentLocation}</div><div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between"><span>{s.status}</span><span>ETA {s.eta}</span></div></button>)}</div>
      </aside>

      <section className="space-y-4">
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 shadow-xl"><MalaysiaLogisticsMap heightClass="h-[520px]" /></div>
        {selectedShipment && <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800"><span className="text-[10px] uppercase text-slate-500">Current location</span><div className="text-xs text-white mt-1 flex items-start gap-1"><MapPin className="w-3 h-3 text-cyan-400 mt-0.5"/>{selectedShipment.currentLocation}</div></div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800"><span className="text-[10px] uppercase text-slate-500">Movement</span><div className="text-xs text-white mt-1 flex items-center gap-1">{selectedShipment.vehicleType==='Train'?<Train className="w-3 h-3 text-cyan-400"/>:<Truck className="w-3 h-3 text-cyan-400"/>}{selectedShipment.assignedVehicleOrTrain}</div></div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800"><span className="text-[10px] uppercase text-slate-500">ETA</span><div className="text-xs text-white mt-1 flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400"/>{selectedShipment.eta}</div></div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800"><span className="text-[10px] uppercase text-slate-500">Risk score</span><div className="text-xs text-white mt-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-rose-400"/>{selectedShipment.riskScore}/100</div></div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800"><span className="text-[10px] uppercase text-slate-500">Scope</span><div className="text-xs text-white mt-1">Stage 3–7</div><div className="text-[10px] text-slate-500">Trust ends at Stage 6</div></div>
        </div>}
      </section>
    </div>
  </div>;
};
