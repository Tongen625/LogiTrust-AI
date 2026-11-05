import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { buildCoordinatorLoads, CoordinatorLoad } from '../data/coordinatorLoadModel';
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ChevronRight,
  CircleDot,
  Clock3,
  Gauge,
  Package,
  Route,
  Train,
  Truck,
} from 'lucide-react';

type MobileSection = 'loads' | 'incidents' | 'overview';
type DetailView =
  | { type: 'load'; id: string }
  | { type: 'incident'; id: string }
  | null;

const statusClass = (status: string) => {
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'Delayed') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Departed') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const timeToMinutes = (value: string) => {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

const priorityScore = (load: CoordinatorLoad) => {
  if (load.status === 'Cancelled') return 0;
  if (load.incidentIds.length > 0 && load.delayMinutes > 0) return 1;
  if (load.incidentIds.length > 0) return 2;
  if (load.status === 'Delayed') return 3;
  if (load.utilisationPct >= 90) return 4;
  return 10;
};

export const TransportCoordinatorAppView: React.FC = () => {
  const { trainSchedules, shipments, incidents } = useLogistics();
  const loads = useMemo(
    () => buildCoordinatorLoads(trainSchedules, shipments, incidents),
    [trainSchedules, shipments, incidents]
  );

  const sortedLoads = useMemo(
    () => [...loads].sort((a, b) => {
      const p = priorityScore(a) - priorityScore(b);
      return p !== 0 ? p : timeToMinutes(a.arrival) - timeToMinutes(b.arrival);
    }),
    [loads]
  );

  const transportIncidents = useMemo(
    () => incidents.filter(
      (incident) =>
        incident.status !== 'Resolved' &&
        (incident.category === 'Transport' || incident.type === 'Hub Congestion' || incident.type === 'Wrong Hub')
    ),
    [incidents]
  );

  const [section, setSection] = useState<MobileSection>('loads');
  const [detail, setDetail] = useState<DetailView>(null);

  const actionLoads = loads.filter((load) => load.requiresCoordinatorAction);
  const selectedLoad = detail?.type === 'load' ? loads.find((load) => load.id === detail.id) : undefined;
  const selectedIncident = detail?.type === 'incident'
    ? transportIncidents.find((incident) => incident.id === detail.id)
    : undefined;

  const openSection = (next: MobileSection) => {
    setSection(next);
    setDetail(null);
  };

  const loadShipments = selectedLoad
    ? shipments.filter((shipment) => selectedLoad.shipmentIds.includes(shipment.id))
    : [];

  const incidentLoad = selectedIncident?.affectedServiceId
    ? loads.find((load) => load.serviceId === selectedIncident.affectedServiceId)
    : undefined;

  return (
    <div className="min-h-full bg-slate-100 p-3 sm:p-5">
      <div className="mx-auto max-w-md min-h-[760px] rounded-[30px] bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <header className="p-5 bg-slate-950 text-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] text-sky-300 font-semibold uppercase tracking-[0.18em]">Transport Coordinator App</div>
              <div className="text-xl font-bold mt-1">
                {detail?.type === 'load' ? 'Load Details' : detail?.type === 'incident' ? 'Incident Details' : 'Network Loads'}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {detail ? 'Mobile operational view' : `${actionLoads.length} load(s) need attention`}
              </div>
            </div>
            {detail && (
              <button
                onClick={() => setDetail(null)}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white">
          {!detail && section === 'loads' && (
            <div>
              <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">Active Loads</div>
                  <div className="text-[11px] text-slate-500">Priority first, then earliest ETA</div>
                </div>
                <span className="text-xs font-semibold text-slate-500">{loads.length}</span>
              </div>
              <div className="divide-y">
                {sortedLoads.map((load) => {
                  const Icon = load.transportType === 'Train' ? Train : Truck;
                  return (
                    <button
                      key={load.id}
                      onClick={() => setDetail({ type: 'load', id: load.id })}
                      className="w-full p-4 text-left flex gap-3 hover:bg-slate-50"
                    >
                      <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 items-start">
                          <div>
                            <div className="font-bold text-slate-950">{load.serviceId}</div>
                            <div className="text-[10px] text-slate-400">{load.id}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusClass(load.status)}`}>
                            {load.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">{load.route}</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-2">
                          <span>ETA {load.arrival}</span>
                          <span>{load.shipmentIds.length} shipments</span>
                          <span>{load.parcelCount} parcels</span>
                        </div>
                        {load.incidentIds.length > 0 && (
                          <div className="mt-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {load.incidentIds.length} active incident{load.incidentIds.length === 1 ? '' : 's'}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 mt-3 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!detail && section === 'incidents' && (
            <div>
              <div className="px-4 py-3 border-b bg-slate-50">
                <div className="text-sm font-bold text-slate-900">Transport Incidents</div>
                <div className="text-[11px] text-slate-500">Open incident and recovery context</div>
              </div>
              <div className="divide-y">
                {transportIncidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setDetail({ type: 'incident', id: incident.id })}
                    className="w-full p-4 text-left flex gap-3 hover:bg-slate-50"
                  >
                    <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-slate-950">{incident.type}</span>
                        <span className="text-[10px] text-slate-400">{incident.affectedServiceId || 'Network'}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{incident.details}</div>
                      <div className="flex gap-2 mt-2 text-[10px]">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{incident.severity}</span>
                        <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">{incident.status}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 mt-3 text-slate-400 shrink-0" />
                  </button>
                ))}
                {!transportIncidents.length && (
                  <div className="p-6 text-sm text-center text-slate-500">No active transport incidents.</div>
                )}
              </div>
            </div>
          )}

          {!detail && section === 'overview' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <Boxes className="w-5 h-5 text-sky-600" />
                  <div className="text-2xl font-bold text-slate-950 mt-3">{loads.length}</div>
                  <div className="text-xs text-slate-500">Active loads</div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                  <div className="text-2xl font-bold text-slate-950 mt-3">{actionLoads.length}</div>
                  <div className="text-xs text-slate-500">Need action</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <Package className="w-5 h-5 text-sky-600" />
                  <div className="text-2xl font-bold text-slate-950 mt-3">
                    {loads.reduce((sum, load) => sum + load.shipmentIds.length, 0)}
                  </div>
                  <div className="text-xs text-slate-500">Assigned shipments</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <Gauge className="w-5 h-5 text-sky-600" />
                  <div className="text-2xl font-bold text-slate-950 mt-3">
                    {loads.length ? Math.round(loads.reduce((sum, load) => sum + load.utilisationPct, 0) / loads.length) : 0}%
                  </div>
                  <div className="text-xs text-slate-500">Avg. utilisation</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b font-bold text-sm">Priority Queue</div>
                <div className="divide-y">
                  {actionLoads.slice(0, 5).map((load) => (
                    <button
                      key={load.id}
                      onClick={() => setDetail({ type: 'load', id: load.id })}
                      className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-sm">{load.serviceId}</div>
                        <div className="text-[11px] text-slate-500">{load.route}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-amber-600">ETA {load.arrival}</div>
                        <div className="text-[10px] text-slate-400">{load.status}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedLoad && (
            <div className="p-4 space-y-4">
              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400">{selectedLoad.id}</div>
                    <div className="text-xl font-bold text-slate-950 mt-0.5">{selectedLoad.serviceId}</div>
                    <div className="text-xs text-slate-500 mt-1">{selectedLoad.route}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusClass(selectedLoad.status)}`}>
                    {selectedLoad.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-slate-400">ETA</div>
                    <div className="font-bold mt-1">{selectedLoad.arrival}</div>
                    {selectedLoad.delayMinutes > 0 && <div className="text-amber-600 mt-1">+{selectedLoad.delayMinutes} min</div>}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-slate-400">Capacity</div>
                    <div className="font-bold mt-1">{selectedLoad.utilisationPct}%</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-slate-400">Shipments</div>
                    <div className="font-bold mt-1">{selectedLoad.shipmentIds.length}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-slate-400">Parcels</div>
                    <div className="font-bold mt-1">{selectedLoad.parcelCount}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                  <div className="font-bold text-sm">Shipments on Load</div>
                  <div className="text-[11px] text-slate-500">Load → Shipment → Parcel</div>
                </div>
                <div className="divide-y">
                  {loadShipments.map((shipment) => (
                    <div key={shipment.id} className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-sm text-sky-700">{shipment.id}</div>
                        <div className="text-[11px] text-slate-500">ETA {shipment.eta || '—'}</div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{shipment.origin} → {shipment.destination}</div>
                      <div className="mt-2 rounded-xl bg-slate-50 p-3">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">Parcels</div>
                        <div className="text-xs text-slate-700 mt-1 break-words">
                          {shipment.parcelIds?.length ? shipment.parcelIds.join(', ') : `${shipment.parcelCount || 1} parcel(s)`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loadShipments.length && <div className="p-4 text-sm text-slate-500">No assigned shipment records.</div>}
                </div>
              </section>

              {selectedLoad.incidentIds.length > 0 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4" /> Active Incident
                  </div>
                  <div className="mt-2 space-y-2">
                    {transportIncidents
                      .filter((incident) => selectedLoad.incidentIds.includes(incident.id))
                      .map((incident) => (
                        <button
                          key={incident.id}
                          onClick={() => setDetail({ type: 'incident', id: incident.id })}
                          className="w-full rounded-xl bg-white/70 border border-amber-200 p-3 text-left"
                        >
                          <div className="font-semibold text-xs">{incident.type}</div>
                          <div className="text-[11px] text-amber-800 mt-1 line-clamp-2">{incident.details}</div>
                        </button>
                      ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {selectedIncident && (
            <div className="p-4 space-y-4">
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-white/80 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-amber-700">{selectedIncident.id}</div>
                    <div className="text-lg font-bold text-slate-950 mt-0.5">{selectedIncident.type}</div>
                    <div className="text-xs text-slate-600 mt-1">{selectedIncident.location}</div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-white/70 p-3 text-xs text-slate-700 leading-relaxed">
                  {selectedIncident.details}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="font-bold text-sm">Incident Context</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-400">Service</div><div className="font-semibold mt-1">{selectedIncident.affectedServiceId || 'Network'}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-400">Severity</div><div className="font-semibold mt-1">{selectedIncident.severity}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-400">Status</div><div className="font-semibold mt-1">{selectedIncident.status}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-slate-400">Affected shipments</div><div className="font-semibold mt-1">{selectedIncident.affectedShipmentIds?.length || 0}</div></div>
                </div>
              </section>

              {selectedIncident.recommendation && (
                <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <div className="text-xs font-bold text-sky-800">Recovery Recommendation</div>
                  <div className="text-xs text-sky-900 mt-2 leading-relaxed">{selectedIncident.recommendation}</div>
                </section>
              )}

              {incidentLoad && (
                <button
                  onClick={() => setDetail({ type: 'load', id: incidentLoad.id })}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Affected Load</div>
                    <div className="font-bold text-sm mt-1">{incidentLoad.serviceId}</div>
                    <div className="text-xs text-slate-500 mt-1">{incidentLoad.route}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          )}
        </main>

        <footer className="grid grid-cols-3 border-t bg-slate-50 shrink-0">
          <button
            onClick={() => openSection('loads')}
            className={`py-3 text-xs font-semibold flex flex-col items-center gap-1 ${section === 'loads' && !detail ? 'text-sky-700' : 'text-slate-500'}`}
          >
            <Route className="w-4 h-4" />
            Loads
          </button>
          <button
            onClick={() => openSection('incidents')}
            className={`py-3 text-xs font-semibold flex flex-col items-center gap-1 ${section === 'incidents' && !detail ? 'text-sky-700' : 'text-slate-500'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Incidents
          </button>
          <button
            onClick={() => openSection('overview')}
            className={`py-3 text-xs font-semibold flex flex-col items-center gap-1 ${section === 'overview' && !detail ? 'text-sky-700' : 'text-slate-500'}`}
          >
            <CircleDot className="w-4 h-4" />
            Overview
          </button>
        </footer>
      </div>
    </div>
  );
};
