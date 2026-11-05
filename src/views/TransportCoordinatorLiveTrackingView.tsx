import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { buildCoordinatorLoads, CoordinatorLoad } from '../data/coordinatorLoadModel';
import {
  AlertTriangle,
  ArrowDownUp,
  Clock3,
  MapPin,
  Package,
  Route,
  Train,
  Truck,
} from 'lucide-react';

type SortMode = 'priority' | 'eta';

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
  if (load.requiresCoordinatorAction) return 5;
  return 10;
};

const progressFor = (load: CoordinatorLoad) => {
  if (load.status === 'Departed') return 100;
  if (load.status === 'Cancelled') return 0;
  if (load.status === 'Delayed') return 58;
  return 72;
};

const statusClass = (status: string) => {
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'Delayed') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Departed') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

export const TransportCoordinatorLiveTrackingView: React.FC = () => {
  const { trainSchedules, shipments, incidents, setSelectedShipmentId, setActiveTab } = useLogistics();
  const loads = useMemo(
    () => buildCoordinatorLoads(trainSchedules, shipments, incidents),
    [trainSchedules, shipments, incidents]
  );
  const [selectedLoadId, setSelectedLoadId] = useState(loads[0]?.id || '');
  const [sortMode, setSortMode] = useState<SortMode>('priority');

  const sortedLoads = useMemo(() => {
    return [...loads].sort((a, b) => {
      if (sortMode === 'eta') return timeToMinutes(a.arrival) - timeToMinutes(b.arrival);
      const scoreDiff = priorityScore(a) - priorityScore(b);
      if (scoreDiff !== 0) return scoreDiff;
      return timeToMinutes(a.arrival) - timeToMinutes(b.arrival);
    });
  }, [loads, sortMode]);

  const load = loads.find((item) => item.id === selectedLoadId) || sortedLoads[0];
  const assignedShipments = load
    ? shipments.filter((shipment) => load.shipmentIds.includes(shipment.id))
    : [];
  const relatedIncidents = load
    ? incidents.filter(
        (incident) => incident.status !== 'Resolved' && incident.affectedServiceId === load.serviceId
      )
    : [];

  if (!load) {
    return <div className="p-6 text-sm text-slate-500">No active transport loads are available.</div>;
  }

  const progress = progressFor(load);
  const Icon = load.transportType === 'Train' ? Train : Truck;
  const actionCount = loads.filter((item) => item.requiresCoordinatorAction).length;

  return (
    <div className="p-5 lg:p-7 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Transport Coordinator</p>
          <h1 className="text-2xl font-bold text-slate-950">Live Load Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track each transport load between hubs, then drill into its shipments and parcels.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 font-semibold text-amber-700">
            {actionCount} load{actionCount === 1 ? '' : 's'} need attention
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">Active Loads</h2>
                <p className="text-xs text-slate-500 mt-1">Train, truck and intermodal movement</p>
              </div>
              <ArrowDownUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3 grid grid-cols-2 rounded-xl bg-white border border-slate-200 p-1">
              <button
                onClick={() => setSortMode('priority')}
                className={`rounded-lg py-1.5 text-xs font-semibold ${
                  sortMode === 'priority' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Priority
              </button>
              <button
                onClick={() => setSortMode('eta')}
                className={`rounded-lg py-1.5 text-xs font-semibold ${
                  sortMode === 'eta' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                ETA
              </button>
            </div>
          </div>

          <div className="divide-y max-h-[720px] overflow-y-auto">
            {sortedLoads.map((item) => {
              const ItemIcon = item.transportType === 'Train' ? Train : Truck;
              const selected = item.id === load.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedLoadId(item.id)}
                  className={`w-full p-4 text-left transition-colors hover:bg-slate-50 ${
                    selected ? 'bg-sky-50 border-l-4 border-sky-500' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <ItemIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 items-start">
                        <div>
                          <div className="font-bold text-slate-950">{item.serviceId}</div>
                          <div className="text-[11px] text-slate-400">{item.id}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2 truncate">{item.route}</div>
                      <div className="flex items-center justify-between gap-2 mt-2 text-xs">
                        <span className="text-slate-400">ETA {item.arrival}</span>
                        {item.delayMinutes > 0 && (
                          <span className="font-semibold text-amber-600">+{item.delayMinutes} min</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {item.shipmentIds.length} shipments · {item.parcelCount} parcels
                      </div>
                      {item.incidentIds.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                          <AlertTriangle className="w-3 h-3" />
                          {item.incidentIds.length} active incident{item.incidentIds.length === 1 ? '' : 's'}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-lg text-slate-950">{load.serviceId}</h2>
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusClass(load.status)}`}>
                      {load.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{load.route}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Planned arrival</div>
                  <div className="font-semibold text-slate-900">{load.arrival}</div>
                </div>
                {load.delayMinutes > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Delay</div>
                    <div className="font-semibold text-amber-600">+{load.delayMinutes} min</div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative h-[430px] overflow-hidden bg-[#edf3f6]">
              <div
                className="absolute inset-0 opacity-55"
                style={{
                  backgroundImage:
                    'linear-gradient(25deg, transparent 48%, rgba(148,163,184,.18) 49%, rgba(148,163,184,.18) 51%, transparent 52%), linear-gradient(155deg, transparent 48%, rgba(148,163,184,.13) 49%, rgba(148,163,184,.13) 51%, transparent 52%)',
                  backgroundSize: '72px 72px',
                }}
              />

              <div className="absolute left-[7%] top-[12%] w-[20%] h-[22%] rounded-[45%_55%_60%_40%] bg-emerald-100/70" />
              <div className="absolute right-[8%] bottom-[10%] w-[25%] h-[24%] rounded-[60%_40%_45%_55%] bg-emerald-100/60" />
              <div className="absolute left-[34%] bottom-[6%] w-[18%] h-[18%] rounded-[45%] bg-sky-100/60" />

              <svg viewBox="0 0 1000 430" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path
                  d="M115 310 C 225 255, 280 330, 385 245 S 585 155, 680 210 S 795 250, 875 120"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="13"
                  strokeLinecap="round"
                />
                <path
                  d="M115 310 C 225 255, 280 330, 385 245 S 585 155, 680 210 S 795 250, 875 120"
                  fill="none"
                  stroke={load.status === 'Delayed' ? '#f59e0b' : '#0284c7'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={load.status === 'Delayed' ? '18 10' : undefined}
                />
              </svg>

              <div className="absolute left-[7%] top-[66%] flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-950 ring-4 ring-white shadow" />
                <div className="rounded-xl bg-white/95 border border-slate-200 shadow-sm px-3 py-2 max-w-[190px]">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Origin hub</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{load.originHub}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Depart {load.departure}</div>
                </div>
              </div>

              <div className="absolute right-[7%] top-[16%] flex flex-row-reverse items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-600 ring-4 ring-white shadow" />
                <div className="rounded-xl bg-white/95 border border-slate-200 shadow-sm px-3 py-2 max-w-[190px] text-right">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Next / destination hub</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{load.destinationHub}</div>
                  <div className="text-[11px] text-slate-500 mt-1">ETA {load.arrival}</div>
                </div>
              </div>

              <div
                className="absolute transition-all duration-500"
                style={{ left: `${10 + progress * 0.74}%`, top: `${67 - progress * 0.48}%` }}
              >
                <div
                  className={`relative w-11 h-11 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white ${
                    load.status === 'Delayed' ? 'bg-amber-500' : 'bg-sky-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {load.incidentIds.length > 0 && (
                    <span className="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                      !
                    </span>
                  )}
                </div>
              </div>

              <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-5 py-3 text-center shadow-sm min-w-[220px]">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Route progress</div>
                <div className="font-bold text-2xl text-slate-950">{progress}%</div>
                <div className="text-xs text-slate-500 mt-1">
                  {load.shipmentIds.length} shipments · {load.parcelCount} parcels
                </div>
              </div>

              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <div className="rounded-xl bg-white/95 border border-slate-200 px-3 py-2 shadow-sm text-xs flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-sky-600" />
                  <span><strong>ETA</strong> {load.arrival}</span>
                </div>
                <div className="rounded-xl bg-white/95 border border-slate-200 px-3 py-2 shadow-sm text-xs flex items-center gap-2">
                  <Route className="w-4 h-4 text-sky-600" />
                  <span><strong>Capacity</strong> {load.utilisationPct}%</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-bold text-slate-950">Shipments on {load.serviceId}</h2>
                <p className="text-xs text-slate-500 mt-1">Load → Shipment → Parcel drill-down</p>
              </div>
              <div className="divide-y">
                {assignedShipments.map((shipment) => (
                  <button
                    key={shipment.id}
                    onClick={() => {
                      setSelectedShipmentId(shipment.id);
                      setActiveTab('shipments');
                    }}
                    className="w-full grid grid-cols-1 md:grid-cols-[.8fr_1.6fr_.7fr_.6fr] gap-2 md:gap-3 p-4 text-left hover:bg-slate-50 text-sm"
                  >
                    <div className="font-bold text-sky-700">{shipment.id}</div>
                    <div>
                      <div>{shipment.origin} → {shipment.destination}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{shipment.currentLocation}</div>
                    </div>
                    <div className="text-slate-700">ETA {shipment.eta || '—'}</div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Package className="w-3.5 h-3.5" />
                      {shipment.parcelCount || shipment.parcelIds?.length || 1}
                    </div>
                  </button>
                ))}
                {!assignedShipments.length && (
                  <div className="p-5 text-sm text-slate-500">No shipment records assigned to this load.</div>
                )}
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-bold text-slate-950">Selected Load</h2>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-400">Load ID</div>
                  <div className="font-semibold">{load.id}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-400">Capacity</div>
                  <div className="font-semibold">{load.utilisationPct}% utilised</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-400">Data source</div>
                  <div className="font-semibold">{load.dataSource}</div>
                </div>
              </div>

              {relatedIncidents.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    Active Incident
                  </div>
                  {relatedIncidents.map((incident) => (
                    <div key={incident.id} className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
                      <div className="font-semibold">{incident.type}</div>
                      <div className="mt-1 text-amber-700">{incident.details}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setActiveTab('schedules')}
                className="mt-4 w-full rounded-xl bg-slate-950 text-white py-2.5 text-sm font-semibold"
              >
                Open Schedule & Fleet
              </button>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
