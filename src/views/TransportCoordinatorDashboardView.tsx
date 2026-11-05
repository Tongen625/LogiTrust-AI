import React, { useEffect, useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock3,
  Gauge,
  MapPin,
  Package,
  Route,
  Train,
  Truck,
} from 'lucide-react';
import {
  COORDINATOR_NETWORK_ROUTES,
  COORDINATOR_ROAD_SERVICES,
  CoordinatorServiceStatus,
} from '../data/transportCoordinatorDemoData';

type UnifiedService = {
  id: string;
  transportType: 'Train' | 'Truck' | 'Intermodal';
  route: string;
  departure: string;
  arrival: string;
  status: CoordinatorServiceStatus;
  delayMinutes: number;
  utilisationPct: number;
  capacityAvailable: boolean;
  affectedShipmentIds: string[];
  dataSource: string;
};

const statusColor: Record<CoordinatorServiceStatus, string> = {
  'On Time': 'bg-emerald-500',
  Delayed: 'bg-amber-500',
  Departed: 'bg-blue-500',
  Cancelled: 'bg-rose-500',
};

const statusTone: Record<CoordinatorServiceStatus, string> = {
  'On Time': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Delayed: 'border-amber-200 bg-amber-50 text-amber-700',
  Departed: 'border-blue-200 bg-blue-50 text-blue-700',
  Cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

const incidentTone = (type: string) => {
  if (type === 'Hub Congestion') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (type === 'Train Delay') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (type === 'Flood' || type === 'Accident' || type === 'Vehicle Breakdown') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (type === 'Traffic') return 'border-orange-200 bg-orange-50 text-orange-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const transportIcon = (type: UnifiedService['transportType']) => {
  if (type === 'Train') return Train;
  return Truck;
};

export const TransportCoordinatorDashboardView: React.FC = () => {
  const {
    trainSchedules,
    shipments,
    incidents,
    agents,
    recommendations,
    setActiveTab,
    setSelectedShipmentId,
  } = useLogistics();

  const [chartProgress, setChartProgress] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setChartProgress(1), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const allServices = useMemo<UnifiedService[]>(() => {
    const railServices: UnifiedService[] = trainSchedules.map((service) => ({
      id: service.id,
      transportType: 'Train',
      route: service.route,
      departure: service.departure,
      arrival: service.arrival,
      status: service.status,
      delayMinutes: service.delayMinutes,
      utilisationPct: service.currentUtilisationPct,
      capacityAvailable: service.capacityAvailable,
      affectedShipmentIds: shipments
        .filter((shipment) => shipment.assignedVehicleOrTrain === service.id)
        .map((shipment) => shipment.id),
      dataSource: service.dataSource || 'External Schedule Feed',
    }));

    const roadServices: UnifiedService[] = COORDINATOR_ROAD_SERVICES.map((service) => ({
      id: service.id,
      transportType: service.transportType,
      route: service.route,
      departure: service.departure,
      arrival: service.arrival,
      status: service.status,
      delayMinutes: service.delayMinutes,
      utilisationPct: service.utilisationPct,
      capacityAvailable: service.capacityAvailable,
      affectedShipmentIds: service.affectedShipmentIds,
      dataSource: service.dataSource,
    }));

    const railIds = new Set(railServices.map((service) => service.id));
    return [...railServices, ...roadServices.filter((service) => !railIds.has(service.id))];
  }, [trainSchedules, shipments]);

  const activeIncidents = useMemo(
    () => incidents.filter((incident) => incident.status !== 'Resolved'),
    [incidents]
  );

  const transportIncidents = useMemo(
    () => activeIncidents.filter((incident) => incident.category === 'Transport' || incident.type === 'Hub Congestion'),
    [activeIncidents]
  );

  const affectedShipmentIds = useMemo(() => {
    const ids = new Set<string>();
    transportIncidents.forEach((incident) => {
      incident.affectedShipmentIds?.forEach((id) => ids.add(id));
      if (incident.shipmentId) ids.add(incident.shipmentId);
    });
    allServices
      .filter((service) => service.status === 'Delayed' || service.status === 'Cancelled')
      .forEach((service) => service.affectedShipmentIds.forEach((id) => ids.add(id)));
    shipments
      .filter((shipment) => shipment.delayMinutes > 0)
      .forEach((shipment) => ids.add(shipment.id));
    return ids;
  }, [transportIncidents, allServices, shipments]);

  const activeServices = allServices.filter((service) => service.status !== 'Departed' && service.status !== 'Cancelled');
  const disruptedServices = allServices.filter((service) => service.status === 'Delayed' || service.status === 'Cancelled');
  const capacityWatch = allServices.filter((service) => !service.capacityAvailable || service.utilisationPct >= 80);
  const hubCongestionAlerts = activeIncidents.filter((incident) => incident.type === 'Hub Congestion');
  const pendingActions = transportIncidents.filter((incident) => ['Open', 'Analysing', 'Escalated'].includes(incident.status));

  const serviceStatus = useMemo(() => {
    const count: Record<CoordinatorServiceStatus, number> = {
      'On Time': 0,
      Delayed: 0,
      Departed: 0,
      Cancelled: 0,
    };
    allServices.forEach((service) => {
      count[service.status] += 1;
    });
    return count;
  }, [allServices]);

  const totalServices = Math.max(allServices.length, 1);
  const circumference = 2 * Math.PI * 46;
  let runningOffset = 0;
  const donutSegments = [
    { label: 'On Time' as const, value: serviceStatus['On Time'], stroke: '#10b981' },
    { label: 'Delayed' as const, value: serviceStatus.Delayed, stroke: '#f59e0b' },
    { label: 'Departed' as const, value: serviceStatus.Departed, stroke: '#3b82f6' },
    { label: 'Cancelled' as const, value: serviceStatus.Cancelled, stroke: '#f43f5e' },
  ].map((segment) => {
    const fraction = segment.value / totalServices;
    const dash = circumference * fraction * chartProgress;
    const offset = -runningOffset * circumference;
    runningOffset += fraction;
    return { ...segment, dash, offset };
  });

  const serviceMap = useMemo(() => new Map(allServices.map((service) => [service.id, service])), [allServices]);

  const activeRoutes = useMemo(() => {
    return COORDINATOR_NETWORK_ROUTES.map((route) => {
      const services = route.serviceIds.map((id) => serviceMap.get(id)).filter(Boolean) as UnifiedService[];
      const delayedCount = services.filter((service) => service.status === 'Delayed').length;
      const cancelledCount = services.filter((service) => service.status === 'Cancelled').length;
      const highCapacityCount = services.filter((service) => service.utilisationPct >= 80).length;
      const status = cancelledCount > 0 ? 'Disrupted' : delayedCount > 0 ? 'Delayed' : highCapacityCount > 0 ? 'Capacity Watch' : 'Normal';
      return { ...route, services, delayedCount, cancelledCount, highCapacityCount, status };
    });
  }, [serviceMap]);

  const getIncidentSupport = (incident: (typeof transportIncidents)[number]) => {
    const support: string[] = [];
    if (['Train Delay', 'Flood', 'Traffic', 'Vehicle Breakdown', 'Accident', 'Hub Congestion'].includes(incident.type)) {
      support.push('Disruption Agent');
      support.push('Scheduling Agent');
    }
    if (incident.recommendation && incident.recommendation.trim() && incident.recommendation !== '—') {
      support.push('Decision Agent');
    }
    return support;
  };

  const pendingRecommendations = recommendations.filter((rec) => rec.status === 'Pending Approval');

  const kpis = [
    {
      label: 'Active Services',
      value: activeServices.length,
      helper: 'Train and truck services still operating today',
      icon: Activity,
      action: () => setActiveTab('schedules'),
    },
    {
      label: 'Active Routes',
      value: activeRoutes.length,
      helper: 'Cross-hub corridors currently coordinated',
      icon: Route,
      action: () => setActiveTab('tracking'),
    },
    {
      label: 'Delayed / Disrupted',
      value: disruptedServices.length,
      helper: 'Services needing schedule attention',
      icon: Clock3,
      action: () => setActiveTab('schedules'),
    },
    {
      label: 'Affected Loads',
      value: disruptedServices.length,
      helper: `${affectedShipmentIds.size} shipment(s) inside disrupted loads`,
      icon: Package,
      action: () => setActiveTab('shipments'),
    },
    {
      label: 'Capacity Watch',
      value: capacityWatch.length,
      helper: 'Services at or above 80% utilisation',
      icon: Gauge,
      action: () => setActiveTab('schedules'),
    },
    {
      label: 'Pending Actions',
      value: pendingActions.length,
      helper: 'Incidents waiting for coordinator action',
      icon: AlertTriangle,
      action: () => setActiveTab('schedules'),
    },
  ];

  const openAffectedShipment = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setActiveTab('shipments');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Transport Coordination Dashboard</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">Coordinate transport services and routes between hubs, respond to disruptions and review rerouting options.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('tracking')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition"
          >
            Live Tracking
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            Open Schedule & Fleet <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              onClick={kpi.action}
              className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-3">{kpi.value}</div>
              <div className="text-[11px] leading-4 text-slate-500 mt-1">{kpi.helper}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.35fr] gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Transport Service Status</h2>
              <p className="text-xs text-slate-500 mt-1">Train and truck service status for today.</p>
            </div>
            <button onClick={() => setActiveTab('schedules')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View schedules</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5 items-center mt-5">
            <div className="relative w-40 h-40 mx-auto">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="46" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                {donutSegments.map((segment) => (
                  <circle
                    key={segment.label}
                    cx="60"
                    cy="60"
                    r="46"
                    fill="none"
                    stroke={segment.stroke}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${segment.dash} ${circumference}`}
                    strokeDashoffset={segment.offset}
                    style={{ transition: 'stroke-dasharray 1.4s ease' }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-slate-900">{allServices.length}</div>
                <div className="text-xs text-slate-500">Services today</div>
              </div>
            </div>

            <div className="space-y-3">
              {donutSegments.map((segment) => (
                <div key={segment.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.stroke }} />
                    <span className="text-sm text-slate-700">{segment.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{segment.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Service Capacity Watch</h2>
              <p className="text-xs text-slate-500 mt-1">Capacity matters when choosing a replacement service or reroute.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">80% watch threshold</span>
          </div>

          <div className="mt-5 space-y-4 max-h-[310px] overflow-y-auto pr-1">
            {[...allServices].sort((a, b) => b.utilisationPct - a.utilisationPct).slice(0, 9).map((service) => {
              const utilisation = Math.max(0, Math.min(service.utilisationPct, 100));
              const high = utilisation >= 80 || !service.capacityAvailable;
              const Icon = transportIcon(service.transportType);
              return (
                <div key={service.id}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-sm font-semibold text-slate-900">{service.id}</span>
                      <span className="text-xs text-slate-500 truncate">{service.route}</span>
                    </div>
                    <span className={high ? 'text-sm font-bold text-amber-700' : 'text-sm font-bold text-slate-700'}>{utilisation}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={high ? 'h-full rounded-full bg-amber-500 transition-all duration-1000' : 'h-full rounded-full bg-blue-500 transition-all duration-1000'}
                      style={{ width: `${utilisation * chartProgress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Routes</h2>
            <p className="text-xs text-slate-500 mt-1">Cross-hub corridors and the services currently assigned to them.</p>
          </div>
          <button onClick={() => setActiveTab('tracking')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Open live tracking →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-5">
          {activeRoutes.map((route) => {
            const tone = route.status === 'Normal'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : route.status === 'Capacity Watch'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-rose-200 bg-rose-50 text-rose-700';
            return (
              <button
                key={route.id}
                onClick={() => setActiveTab('tracking')}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">{route.corridor}</div>
                    <div className="font-bold text-slate-900 mt-1">{route.name}</div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{route.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="text-slate-500">Services</div>
                    <div className="font-bold text-slate-900 mt-1">{route.services.length}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="text-slate-500">Delayed</div>
                    <div className="font-bold text-slate-900 mt-1">{route.delayedCount}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="text-slate-500">High capacity</div>
                    <div className="font-bold text-slate-900 mt-1">{route.highCapacityCount}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Priority Action Queue</h2>
              <p className="text-xs text-slate-500 mt-1">Only disruptions that need transport or schedule action appear here.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{transportIncidents.length} active</span>
          </div>

          {transportIncidents.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-sm font-semibold text-slate-800 mt-3">No active transport incident</div>
              <div className="text-xs text-slate-500 mt-1">New delay, breakdown, traffic, flood or hub congestion alerts will appear here.</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transportIncidents.slice(0, 7).map((incident) => (
                <div key={incident.id} className="p-5 hover:bg-slate-50 transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${incidentTone(incident.type)}`}>{incident.type}</span>
                        <span className="text-xs font-mono text-slate-500">{incident.id}</span>
                        <span className="text-xs text-slate-500">{incident.status}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-2">{incident.location}</div>
                      <div className="text-xs text-slate-600 mt-1 leading-5">{incident.details}</div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-3">
                        {incident.affectedServiceId && (
                          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Service {incident.affectedServiceId}</span>
                        )}
                        <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {incident.affectedShipmentIds?.length || 0} shipment(s)</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {incident.severity}</span>
                      </div>

                      {getIncidentSupport(incident).length > 0 && (
                        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Analysis support</div>
                          <div className="text-xs text-slate-700 mt-1 leading-5">
                            {getIncidentSupport(incident).join(' + ')}
                            {incident.recommendation ? ` · ${incident.recommendation}` : ''}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveTab('schedules')}
                      className="shrink-0 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                    >
                      Review Schedule
                    </button>
                  </div>

                  {incident.affectedShipmentIds?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {incident.affectedShipmentIds.slice(0, 5).map((shipmentId) => (
                        <button
                          key={shipmentId}
                          onClick={() => openAffectedShipment(shipmentId)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-300"
                        >
                          {shipmentId}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-violet-600" />
                  <h2 className="text-lg font-bold text-slate-900">Hub Congestion Alerts</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Alerts sent by hub operations when utilisation reaches the configured threshold.</p>
              </div>
              <div className="text-2xl font-bold text-slate-900">{hubCongestionAlerts.length}</div>
            </div>

            <div className="mt-4 space-y-3">
              {hubCongestionAlerts.slice(0, 3).map((incident) => (
                <div key={incident.id} className="rounded-2xl border border-violet-200 bg-violet-50 p-3.5">
                  <div className="text-sm font-semibold text-violet-900">{incident.location}</div>
                  <div className="text-xs text-violet-700 mt-1 leading-5">{incident.details}</div>
                  <button onClick={() => setActiveTab('schedules')} className="text-xs font-semibold text-violet-800 mt-2 hover:underline">Review transport schedule →</button>
                </div>
              ))}
              {hubCongestionAlerts.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">No hub congestion alert is waiting for transport action.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recommendations for Review</h2>
                <p className="text-xs text-slate-500 mt-1">Coordinator reviews the option before any required manager approval.</p>
              </div>
              <div className="text-2xl font-bold text-slate-900">{pendingRecommendations.length}</div>
            </div>

            <div className="mt-4 space-y-3">
              {pendingRecommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => openAffectedShipment(rec.shipmentId)} className="text-sm font-semibold text-blue-700 hover:underline">{rec.shipmentId}</button>
                    <span className="text-[11px] font-semibold text-amber-700">Review Required</span>
                  </div>
                  <div className="text-xs text-slate-700 mt-2 leading-5">{rec.recommendation}</div>
                  <button onClick={() => setActiveTab('schedules')} className="mt-3 text-xs font-semibold text-blue-700 hover:underline">Review in Schedule & Fleet →</button>
                </div>
              ))}

              {pendingRecommendations.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">No recommendation is waiting for coordinator review.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today’s Transport Services</h2>
            <p className="text-xs text-slate-500 mt-1">Train and truck schedule, delay and capacity snapshot.</p>
          </div>
          <button onClick={() => setActiveTab('schedules')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Manage schedules →</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Departure</th>
                <th className="px-5 py-3">Arrival</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Utilisation</th>
                <th className="px-5 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allServices.map((service) => {
                const Icon = transportIcon(service.transportType);
                return (
                  <tr key={service.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-semibold text-blue-700">{service.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700"><Icon className="w-4 h-4" /> {service.transportType}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{service.route}</td>
                    <td className="px-5 py-3 text-slate-700">{service.departure}</td>
                    <td className="px-5 py-3 text-slate-700">{service.arrival}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[service.status]}`}>
                        <span className={`w-2 h-2 rounded-full ${statusColor[service.status]}`} />
                        {service.status}{service.status === 'Delayed' && service.delayMinutes ? ` +${service.delayMinutes} min` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={service.utilisationPct >= 80 ? 'font-semibold text-amber-700' : 'font-semibold text-slate-700'}>{service.utilisationPct}%</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{service.dataSource}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
