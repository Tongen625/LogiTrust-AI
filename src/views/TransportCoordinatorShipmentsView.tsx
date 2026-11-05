import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { buildCoordinatorLoads, CoordinatorLoad } from '../data/coordinatorLoadModel';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  Package,
  Search,
  Train,
  Truck,
} from 'lucide-react';

const tone = (status: CoordinatorLoad['status']) => {
  if (status === 'Delayed') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'Cancelled') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === 'Departed') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

export const TransportCoordinatorShipmentsView: React.FC = () => {
  const {
    trainSchedules,
    shipments,
    incidents,
    recommendations,
    setSelectedShipmentId,
    setActiveTab,
  } = useLogistics();

  const loads = useMemo(
    () => buildCoordinatorLoads(trainSchedules, shipments, incidents),
    [trainSchedules, shipments, incidents]
  );

  const [query, setQuery] = useState('');
  const [transportFilter, setTransportFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(loads[0]?.id || null);
  const [selectedShipmentIdLocal, setSelectedShipmentIdLocal] = useState<string | null>(null);

  const visibleLoads = loads.filter((load) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [load.serviceId, load.route, load.originHub, load.destinationHub, ...load.shipmentIds]
      .join(' ')
      .toLowerCase()
      .includes(q);
    const matchesTransport = transportFilter === 'All' || load.transportType === transportFilter;
    const matchesStatus = statusFilter === 'All'
      || (statusFilter === 'Needs Action' && load.requiresCoordinatorAction)
      || load.status === statusFilter;
    return matchesQuery && matchesTransport && matchesStatus;
  });

  const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentIdLocal) || null;
  const selectedLoad = selectedShipment
    ? loads.find((load) => load.shipmentIds.includes(selectedShipment.id)) || null
    : null;
  const relatedIncident = selectedShipment
    ? incidents.find((incident) =>
        incident.status !== 'Resolved' &&
        (incident.shipmentId === selectedShipment.id || incident.affectedShipmentIds?.includes(selectedShipment.id))
      )
    : null;
  const relatedRecommendation = selectedShipment
    ? recommendations.find((rec) => rec.shipmentId === selectedShipment.id || rec.incidentId === relatedIncident?.id)
    : null;

  const totalParcels = loads.reduce((sum, load) => sum + load.parcelCount, 0);
  const actionLoads = loads.filter((load) => load.requiresCoordinatorAction);

  const openShipment = (shipmentId: string) => {
    setSelectedShipmentIdLocal(shipmentId);
    setSelectedShipmentId(shipmentId);
  };

  return (
    <div className="p-5 lg:p-7 space-y-5 text-slate-800">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Transport Coordinator</p>
          <h1 className="text-2xl font-bold text-slate-950">Loads & Shipments</h1>
          <p className="mt-1 text-sm text-slate-500">Transport-first view: open a load to see its shipments, then inspect parcel-level detail.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs min-w-[360px]">
          <div className="rounded-xl border bg-white p-3"><div className="text-xl font-bold">{loads.length}</div><div className="text-slate-500">Loads</div></div>
          <div className="rounded-xl border bg-white p-3"><div className="text-xl font-bold">{loads.reduce((s,l)=>s+l.shipmentIds.length,0)}</div><div className="text-slate-500">Shipments</div></div>
          <div className="rounded-xl border bg-white p-3"><div className="text-xl font-bold">{totalParcels}</div><div className="text-slate-500">Parcels</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-4 border-b bg-slate-50/70 flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search load, service, route or shipment" className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-sky-400" />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={transportFilter} onChange={(e)=>setTransportFilter(e.target.value)} className="rounded-xl border border-slate-200 pl-9 pr-8 py-2.5 text-sm bg-white">
                  <option>All</option><option>Train</option><option>Truck</option><option>Intermodal</option>
                </select>
              </div>
              <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white">
                <option>All</option><option>Needs Action</option><option>On Time</option><option>Delayed</option><option>Departed</option><option>Cancelled</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {visibleLoads.map((load) => {
              const expanded = expandedLoadId === load.id;
              const assignedShipments = shipments.filter((shipment) => load.shipmentIds.includes(shipment.id));
              const Icon = load.transportType === 'Train' ? Train : Truck;
              return (
                <div key={load.id}>
                  <button onClick={()=>setExpandedLoadId(expanded ? null : load.id)} className="w-full text-left p-4 hover:bg-slate-50 transition">
                    <div className="grid grid-cols-[26px_1.1fr_1.5fr_.8fr_.8fr_.8fr] gap-3 items-center text-sm">
                      <div>{expanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}</div>
                      <div className="flex items-center gap-2 min-w-0"><span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Icon className="w-4 h-4"/></span><div><div className="font-bold text-slate-950">{load.serviceId}</div><div className="text-xs text-slate-400">{load.transportType} load</div></div></div>
                      <div className="min-w-0"><div className="font-medium truncate">{load.route}</div><div className="text-xs text-slate-400">{load.departure} → {load.arrival}</div></div>
                      <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone(load.status)}`}>{load.status}</span>{load.delayMinutes > 0 && <div className="text-xs text-amber-600 mt-1">+{load.delayMinutes} min</div>}</div>
                      <div><div className="font-semibold">{load.shipmentIds.length} shipments</div><div className="text-xs text-slate-400">{load.parcelCount} parcels</div></div>
                      <div><div className="font-semibold">{load.utilisationPct}%</div>{load.requiresCoordinatorAction && <div className="text-xs text-rose-600 font-medium">Needs action</div>}</div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="bg-slate-50 px-5 pb-4">
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="grid grid-cols-[1fr_1.3fr_.8fr_.8fr_.6fr] gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50">
                          <div>Shipment</div><div>Movement</div><div>ETA</div><div>Priority</div><div>Parcels</div>
                        </div>
                        {assignedShipments.length ? assignedShipments.map((shipment) => (
                          <button key={shipment.id} onClick={()=>openShipment(shipment.id)} className="w-full grid grid-cols-[1fr_1.3fr_.8fr_.8fr_.6fr] gap-3 px-4 py-3 text-left text-sm border-t border-slate-100 hover:bg-sky-50/60">
                            <div className="font-bold text-sky-700">{shipment.id}</div>
                            <div><div>{shipment.origin} → {shipment.destination}</div><div className="text-xs text-slate-400 truncate">{shipment.currentLocation}</div></div>
                            <div>{shipment.eta || '—'}{shipment.delayMinutes > 0 && <div className="text-xs text-amber-600">+{shipment.delayMinutes} min</div>}</div>
                            <div>{shipment.priority || 'Standard'}</div>
                            <div>{shipment.parcelCount || shipment.parcelIds?.length || 1}</div>
                          </button>
                        )) : <div className="p-4 text-sm text-slate-500">No shipment record is currently assigned to this load.</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!visibleLoads.length && <div className="p-8 text-center text-sm text-slate-500">No loads match the current filters.</div>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="font-bold text-slate-950">Load Attention</h2><AlertTriangle className="w-4 h-4 text-amber-500"/></div>
            <div className="mt-3 space-y-2">
              {actionLoads.slice(0,5).map((load)=><button key={load.id} onClick={()=>setExpandedLoadId(load.id)} className="w-full rounded-xl border p-3 text-left hover:bg-slate-50"><div className="flex justify-between gap-2"><span className="font-semibold">{load.serviceId}</span><span className="text-xs text-rose-600">{load.status}</span></div><div className="text-xs text-slate-500 mt-1">{load.incidentTypes.join(', ') || `${load.delayMinutes} min delay`}</div></button>)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 min-h-[280px]">
            <h2 className="font-bold text-slate-950">Shipment Detail</h2>
            {!selectedShipment ? <div className="mt-8 text-center text-sm text-slate-400"><Package className="w-8 h-8 mx-auto mb-2"/>Select a shipment from an expanded load.</div> : (
              <div className="mt-3 space-y-3 text-sm">
                <div><div className="text-xs text-slate-400">Shipment</div><div className="font-bold text-lg">{selectedShipment.id}</div></div>
                <div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">Load</div><div className="font-semibold">{selectedLoad?.serviceId || 'Unassigned'}</div></div><div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">Parcels</div><div className="font-semibold">{selectedShipment.parcelCount || selectedShipment.parcelIds?.length || 1}</div></div></div>
                <div><div className="text-xs text-slate-400">Current location</div><div>{selectedShipment.currentLocation}</div></div>
                {relatedIncident && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="font-semibold text-amber-800">{relatedIncident.type}</div><div className="text-xs text-amber-700 mt-1">{relatedIncident.details}</div></div>}
                {(relatedRecommendation?.recommendation || relatedIncident?.recommendation) && <div className="rounded-xl border border-sky-200 bg-sky-50 p-3"><div className="text-xs font-semibold text-sky-800">Recovery recommendation</div><div className="text-xs text-sky-700 mt-1">{relatedRecommendation?.recommendation || relatedIncident?.recommendation}</div></div>}
                <button onClick={()=>setActiveTab('schedules')} className="w-full rounded-xl bg-slate-950 text-white py-2.5 font-semibold flex items-center justify-center gap-2">Open Schedule & Fleet <ArrowRight className="w-4 h-4"/></button>
                <button onClick={()=>setActiveTab('tracking')} className="w-full rounded-xl border border-slate-200 py-2.5 font-semibold flex items-center justify-center gap-2"><Clock3 className="w-4 h-4"/>Live Tracking</button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
