import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { buildCoordinatorLoads } from '../data/coordinatorLoadModel';
import { Clock3, Filter, Search, Train, Truck } from 'lucide-react';

export const TransportCoordinatorAuditTrailView: React.FC = () => {
  const { auditLogs, incidents, trainSchedules, shipments } = useLogistics();
  const loads = useMemo(() => buildCoordinatorLoads(trainSchedules, shipments, incidents), [trainSchedules, shipments, incidents]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const transportTokens = new Set(loads.flatMap((load) => [load.serviceId, load.id, ...load.shipmentIds]));
  const logs = (auditLogs as any[]).filter((log) => {
    const text = [log.actor, log.role, log.action, log.details, log.reason, log.result, log.shipmentId].filter(Boolean).join(' ');
    const coordinatorRelevant = /transport|train|truck|schedule|incident|route|reroute|service|coordinator|delay|capacity|departure/i.test(text)
      || Array.from(transportTokens).some((token) => text.includes(token));
    if (!coordinatorRelevant) return false;
    const q = query.trim().toLowerCase();
    if (q && !text.toLowerCase().includes(q)) return false;
    if (typeFilter === 'Incident' && !/incident|delay|flood|traffic|breakdown|congestion/i.test(text)) return false;
    if (typeFilter === 'Schedule' && !/schedule|service|departure|status|route|reroute/i.test(text)) return false;
    if (typeFilter === 'Load' && !Array.from(transportTokens).some((token) => text.includes(token))) return false;
    return true;
  });

  return (
    <div className="p-5 lg:p-7 space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Transport Coordinator</p><h1 className="text-2xl font-bold text-slate-950">Transport Audit Trail</h1><p className="text-sm text-slate-500 mt-1">Auditable changes to loads, schedules, incidents and recovery decisions.</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search service, load, shipment or action" className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm"/></div>
          <div className="relative"><Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} className="rounded-xl border border-slate-200 pl-9 pr-8 py-2.5 text-sm bg-white"><option>All</option><option>Load</option><option>Schedule</option><option>Incident</option></select></div>
        </div>
        <div className="divide-y">
          {logs.map((log:any, index:number) => {
            const text=[log.action,log.details,log.reason,log.result].filter(Boolean).join(' ');
            const load=loads.find((item)=>text.includes(item.serviceId)||item.shipmentIds.some((id)=>text.includes(id)));
            const Icon=load?.transportType==='Train'?Train:Truck;
            return <div key={log.id || index} className="p-4 grid grid-cols-[38px_150px_minmax(0,1fr)_180px] gap-3 items-start text-sm"><div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">{load?<Icon className="w-4 h-4"/>:<Clock3 className="w-4 h-4"/>}</div><div><div className="text-xs text-slate-400">{log.timestamp || log.time || 'Recorded'}</div><div className="font-semibold mt-1">{load?.serviceId || log.shipmentId || 'Network'}</div></div><div><div className="font-semibold text-slate-900">{log.action || 'Transport activity'}</div><div className="text-xs text-slate-500 mt-1 leading-relaxed">{log.details || log.reason || log.result || 'Audit record stored.'}</div></div><div className="text-xs"><div className="text-slate-400">Actor</div><div className="font-semibold mt-1">{log.actor || log.user || log.role || 'System'}</div></div></div>;
          })}
          {!logs.length && <div className="p-8 text-center text-sm text-slate-500">No matching Transport Coordinator audit records.</div>}
        </div>
      </div>
    </div>
  );
};
