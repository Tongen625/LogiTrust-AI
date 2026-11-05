import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { getAssignedHub, shipmentCurrentlyAtHub, shipmentTouchesHub } from '../utils/hubScope';
import {
  Building2,
  Package,
  Download,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Upload,
  Truck,
  Train,
  ArrowRight,
  CheckCircle2,
  Activity,
  CircleAlert,
  Send,
  X,
  BellRing,
} from 'lucide-react';

const parcelToShipmentId = (parcelId: string) => parcelId.replace(/^P-/, '').replace(/-\d+$/, '');

type ShipmentFilter = 'all' | 'completed' | 'progress' | 'exception';

const parseHour = (value?: string) => {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  return Number.isFinite(hour) ? hour : null;
};

export const HubDashboardView: React.FC = () => {
  const {
    currentUser,
    hubs,
    shipments,
    hubManifests,
    handoffs,
    setActiveTab,
    setSelectedShipmentId,
    addIncident,
  } = useLogistics();
  const [chartReady, setChartReady] = useState(false);
  const [flowChartReady, setFlowChartReady] = useState(false);
  const [hoveredFlowIndex, setHoveredFlowIndex] = useState<number | null>(null);
  const flowChartRef = useRef<HTMLElement | null>(null);
  const [drawerFilter, setDrawerFilter] = useState<ShipmentFilter | null>(null);
  const [congestionNotified, setCongestionNotified] = useState(false);
  const hub = getAssignedHub(hubs, currentUser);

  useEffect(() => {
    const timer = window.setTimeout(() => setChartReady(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const target = flowChartRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFlowChartReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!hub) {
    return <div className="p-6 text-sm text-rose-300">Assigned hub could not be resolved for this operator.</div>;
  }

  const incoming = hubManifests.filter((m) => m.hubId === hub.id && (m.direction || 'Incoming') === 'Incoming');
  const outgoingManifests = hubManifests.filter((m) => m.hubId === hub.id && m.direction === 'Outgoing');
  const localShipments = shipments.filter((s) => shipmentTouchesHub(s, hub));
  const atHub = shipments.filter((s) => shipmentCurrentlyAtHub(s, hub));
  const localHandoffs = handoffs.filter((h) => h.hubId === hub.id);

  // "Incoming" means the transport is still travelling to this hub.
  const incomingInTransit = incoming.filter((m) => m.hubStatus === 'In Transit');
  const incomingLoads = incomingInTransit.length;
  const incomingShipmentIds = new Set(incomingInTransit.flatMap((m) => m.expectedShipmentIds));
  const incomingShipments = incomingShipmentIds.size;
  const incomingParcels = incomingInTransit.reduce((sum, m) => sum + m.expectedParcelIds.length, 0);

  // "Awaiting Receiving" means the load has physically arrived and receiving is not fully closed yet.
  const awaitingReceivingManifests = incoming.filter((m) => m.hubStatus === 'Arrived' || m.hubStatus === 'Receiving');
  const awaitingReceivingLoads = awaitingReceivingManifests.length;
  const awaitingReceivingShipments = new Set(awaitingReceivingManifests.flatMap((m) => m.expectedShipmentIds)).size;
  const awaitingReceivingParcels = awaitingReceivingManifests.reduce((sum, m) => sum + m.expectedParcelIds.length, 0);

  // Parcels on transports that are still in transit are not "missing" yet.
  const reconciledIncoming = incoming.filter((m) => m.status === 'Mismatch');
  const missingCount = reconciledIncoming.reduce(
    (sum, m) => sum + m.expectedParcelIds.filter((id) => !m.receivedParcelIds.includes(id)).length,
    0,
  );
  const unexpectedCount = reconciledIncoming.reduce(
    (sum, m) => sum + m.receivedParcelIds.filter((id) => !m.expectedParcelIds.includes(id)).length,
    0,
  );
  const mismatchCount = missingCount + unexpectedCount;
  const handoffReview = localHandoffs.filter((h) => h.status !== 'VERIFIED').length;
  const sortingQueue = atHub
    .filter((s) => (s.timeline[0]?.notes || '').toLowerCase().includes('sorting pending'))
    .reduce((n, s) => n + (s.parcelCount || 1), 0);

  const readyForDispatchManifests = outgoingManifests.filter((m) => m.hubStatus === 'Ready for Dispatch');
  const readyForDispatchLoads = readyForDispatchManifests.length;
  const readyForDispatchShipments = new Set(readyForDispatchManifests.flatMap((m) => m.expectedShipmentIds)).size;
  const readyForDispatchParcels = readyForDispatchManifests.reduce((n, m) => n + m.expectedParcelIds.length, 0);

  const dispatchedManifests = outgoingManifests.filter((m) => m.hubStatus === 'Departed');
  const dispatchedLoads = dispatchedManifests.length;
  const dispatchedShipments = new Set(dispatchedManifests.flatMap((m) => m.expectedShipmentIds)).size;
  const dispatchedParcels = dispatchedManifests.reduce((n, m) => n + m.expectedParcelIds.length, 0);

  const todaysShipmentIds = useMemo(() => {
    const ids = new Set<string>();
    [...incoming, ...outgoingManifests].forEach((m) => m.expectedShipmentIds.forEach((id) => ids.add(id)));
    return ids;
  }, [incoming, outgoingManifests]);

  const completedShipmentIds = useMemo(() => {
    const ids = new Set<string>();
    dispatchedManifests.forEach((m) => m.expectedShipmentIds.forEach((id) => ids.add(id)));
    return ids;
  }, [dispatchedManifests]);

  const exceptionShipmentIds = useMemo(() => {
    const ids = new Set<string>();
    incoming.forEach((m) => {
      const missing = m.expectedParcelIds.filter((id) => !m.receivedParcelIds.includes(id));
      missing.forEach((parcelId) => ids.add(parcelToShipmentId(parcelId)));
      const unexpected = m.receivedParcelIds.filter((id) => !m.expectedParcelIds.includes(id));
      unexpected.forEach((parcelId) => ids.add(parcelToShipmentId(parcelId)));
    });
    localHandoffs.forEach((h) => {
      if (h.status !== 'VERIFIED' && h.shipmentId) ids.add(h.shipmentId);
    });
    return ids;
  }, [incoming, localHandoffs]);

  const totalShipments = todaysShipmentIds.size;
  const completedShipments = [...completedShipmentIds].filter((id) => todaysShipmentIds.has(id)).length;
  const exceptionShipments = [...exceptionShipmentIds].filter(
    (id) => todaysShipmentIds.has(id) && !completedShipmentIds.has(id),
  ).length;
  const inProgressShipments = Math.max(0, totalShipments - completedShipments - exceptionShipments);

  const todayShipments = useMemo(
    () => shipments.filter((shipment) => todaysShipmentIds.has(shipment.id)),
    [shipments, todaysShipmentIds],
  );

  const drawerShipments = useMemo(() => {
    if (!drawerFilter) return [];
    if (drawerFilter === 'all') return todayShipments;
    if (drawerFilter === 'completed') return todayShipments.filter((s) => completedShipmentIds.has(s.id));
    if (drawerFilter === 'exception') {
      return todayShipments.filter((s) => exceptionShipmentIds.has(s.id) && !completedShipmentIds.has(s.id));
    }
    return todayShipments.filter(
      (s) => !completedShipmentIds.has(s.id) && !exceptionShipmentIds.has(s.id),
    );
  }, [drawerFilter, todayShipments, completedShipmentIds, exceptionShipmentIds]);

  const drawerTitle: Record<ShipmentFilter, string> = {
    all: "Today's Shipments",
    completed: 'Completed Shipments',
    progress: 'In Progress Shipments',
    exception: 'Exception Shipments',
  };

  const getExceptionReason = (shipmentId: string) => {
    const reasons: string[] = [];
    incoming.forEach((manifest) => {
      const missingForShipment = manifest.expectedParcelIds.filter(
        (parcelId) => parcelToShipmentId(parcelId) === shipmentId && !manifest.receivedParcelIds.includes(parcelId),
      );
      if (missingForShipment.length) reasons.push(`${missingForShipment.length} missing parcel(s)`);
    });
    if (localHandoffs.some((h) => h.shipmentId === shipmentId && h.status !== 'VERIFIED')) reasons.push('handoff review');
    return reasons.join(' · ') || 'operational exception';
  };

  const openHubSection = (focus: string) => {
    sessionStorage.setItem('hubOpsFocus', focus);
    setActiveTab('hub-ops');
  };

  const openShipmentDetail = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setDrawerFilter(null);
    setActiveTab('shipments');
  };

  const shipmentCards: Array<{
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    filter: ShipmentFilter;
  }> = [
    { label: "Today's Shipments", value: totalShipments, icon: Package, tone: 'cyan', filter: 'all' },
    { label: 'Completed', value: completedShipments, icon: CheckCircle2, tone: 'emerald', filter: 'completed' },
    { label: 'In Progress', value: inProgressShipments, icon: Activity, tone: 'violet', filter: 'progress' },
    { label: 'Exception', value: exceptionShipments, icon: CircleAlert, tone: 'rose', filter: 'exception' },
  ];

  const operationCards = [
    {
      label: 'Incoming',
      primary: `${incomingLoads} loads`,
      secondary: `${incomingShipments} shipments · ${incomingParcels} parcels`,
      icon: Download,
      tone: 'cyan',
      focus: 'incoming',
    },
    {
      label: 'Awaiting Receiving',
      primary: `${awaitingReceivingLoads} loads`,
      secondary: `${awaitingReceivingShipments} shipments · ${awaitingReceivingParcels} parcels`,
      icon: Package,
      tone: 'amber',
      focus: 'receiving',
    },
    {
      label: 'Missing / Mismatch',
      primary: `${mismatchCount} parcels`,
      secondary: `${missingCount} missing · ${unexpectedCount} unexpected`,
      icon: AlertTriangle,
      tone: 'rose',
      focus: 'reconciliation',
    },
    {
      label: 'Handoff Review',
      primary: `${handoffReview} records`,
      secondary: 'Require operator review',
      icon: ShieldCheck,
      tone: 'amber',
      focus: 'custody',
    },
    {
      label: 'Sorting Queue',
      primary: `${sortingQueue} parcels`,
      secondary: 'Waiting for sorting',
      icon: Layers,
      tone: 'violet',
      focus: 'sorting',
    },
    {
      label: 'Ready for Dispatch',
      primary: `${readyForDispatchLoads} loads`,
      secondary: `${readyForDispatchShipments} shipments · ${readyForDispatchParcels} parcels`,
      icon: Upload,
      tone: 'emerald',
      focus: 'outgoing',
    },
    {
      label: 'Dispatched Today',
      primary: `${dispatchedLoads} loads`,
      secondary: `${dispatchedShipments} shipments · ${dispatchedParcels} parcels`,
      icon: Send,
      tone: 'cyan',
      focus: 'outgoing',
    },
  ];

  const tones: Record<string, string> = {
    cyan: 'border-cyan-500/30 hover:border-cyan-400/70 bg-gradient-to-br from-cyan-500/10 to-slate-900/80 text-cyan-300',
    amber: 'border-amber-500/30 hover:border-amber-400/70 bg-gradient-to-br from-amber-500/10 to-slate-900/80 text-amber-300',
    rose: 'border-rose-500/30 hover:border-rose-400/70 bg-gradient-to-br from-rose-500/10 to-slate-900/80 text-rose-300',
    violet: 'border-violet-500/30 hover:border-violet-400/70 bg-gradient-to-br from-violet-500/10 to-slate-900/80 text-violet-300',
    emerald: 'border-emerald-500/30 hover:border-emerald-400/70 bg-gradient-to-br from-emerald-500/10 to-slate-900/80 text-emerald-300',
  };

  const chartSegments = [
    { key: 'completed', label: 'Completed', value: completedShipments, stroke: '#34d399' },
    { key: 'progress', label: 'In Progress', value: inProgressShipments, stroke: '#8b5cf6' },
    { key: 'exception', label: 'Exception', value: exceptionShipments, stroke: '#fb7185' },
  ];
  const circumference = 2 * Math.PI * 42;
  let runningOffset = 0;

  const parcelFlow = useMemo(() => {
    const buckets = [8, 10, 12, 14, 16, 18];
    return buckets.map((hour, index) => {
      const nextHour = buckets[index + 1] ?? 24;
      const received = incoming
        .filter((m) => {
          const manifestHour = parseHour(m.scheduledTime);
          return manifestHour !== null && manifestHour >= hour && manifestHour < nextHour;
        })
        .reduce((sum, m) => sum + m.receivedParcelIds.length, 0);
      const dispatched = dispatchedManifests
        .filter((m) => {
          const manifestHour = parseHour(m.scheduledTime);
          return manifestHour !== null && manifestHour >= hour && manifestHour < nextHour;
        })
        .reduce((sum, m) => sum + m.expectedParcelIds.length, 0);
      return { hour: `${hour}:00`, received, dispatched };
    });
  }, [incoming, dispatchedManifests]);

  const rawFlowMax = Math.max(1, ...parcelFlow.flatMap((point) => [point.received, point.dispatched]));
  const flowMax = Math.max(10, Math.ceil(rawFlowMax / 10) * 10);
  const flowChart = { width: 760, height: 220, left: 52, right: 18, top: 22, bottom: 38 };
  const flowPlotWidth = flowChart.width - flowChart.left - flowChart.right;
  const flowPlotHeight = flowChart.height - flowChart.top - flowChart.bottom;
  const flowX = (index: number) => flowChart.left + (index / Math.max(1, parcelFlow.length - 1)) * flowPlotWidth;
  const flowY = (value: number) => flowChart.top + flowPlotHeight - (value / flowMax) * flowPlotHeight;
  const flowPoints = (key: 'received' | 'dispatched') =>
    parcelFlow.map((point, index) => `${flowX(index)},${flowY(point[key])}`).join(' ');
  const flowTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(flowMax * ratio),
    y: flowY(flowMax * ratio),
  }));

  const currentBacklog = awaitingReceivingParcels + sortingQueue;
  const activeWorkload = awaitingReceivingParcels + sortingQueue + readyForDispatchParcels;
  const hubProcessingCapacity = 110;
  const congestionThresholdPct = 80;
  const hubUtilisationPct = Math.round((activeWorkload / hubProcessingCapacity) * 100);
  const canNotifyCoordinator = hubUtilisationPct >= congestionThresholdPct;
  const congestionSeverity: 'Low' | 'Medium' | 'High' =
    hubUtilisationPct >= 100 ? 'High' : hubUtilisationPct >= congestionThresholdPct ? 'Medium' : 'Low';

  const notifyCoordinator = () => {
    if (!canNotifyCoordinator || congestionNotified) return;
    addIncident({
      type: 'Hub Congestion',
      location: hub.name,
      severity: congestionSeverity,
      affectedHubId: hub.id,
      details: `${hub.name} reached ${hubUtilisationPct}% hub utilisation (alert threshold: ${congestionThresholdPct}%). Active workload: ${activeWorkload}/${hubProcessingCapacity} parcels. Awaiting receiving: ${awaitingReceivingLoads} load(s) / ${awaitingReceivingParcels} parcel(s). Sorting queue: ${sortingQueue} parcel(s). Ready for dispatch: ${readyForDispatchLoads} load(s) / ${readyForDispatchParcels} parcel(s). Transport Coordinator requested to review transport timing and outbound capacity.`,
    });
    setCongestionNotified(true);
  };

  const outgoingGroups = Object.values(
    outgoingManifests.reduce<
      Record<string, { service: string; type: string; count: number; next: string; time: string; dock: string; status: string }>
    >((acc, m) => {
      acc[m.serviceId] = {
        service: m.serviceId,
        type: m.transportType,
        count: m.expectedParcelIds.length,
        next: m.destinationName || 'Next hub',
        time: m.scheduledTime || 'Pending',
        dock: m.dock || 'Bay pending',
        status: m.status,
      };
      return acc;
    }, {}),
  ) as Array<{ service: string; type: string; count: number; next: string; time: string; dock: string; status: string }>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-extrabold text-white">My Hub Today</h1>
          </div>
          <div className="text-sm text-slate-300 mt-1">{hub.name}</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2">
            <div className="text-[9px] uppercase text-slate-500">Hub Code</div>
            <b className="text-cyan-300 text-xs">{hub.code}</b>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2">
            <div className="text-[9px] uppercase text-slate-500">Operator</div>
            <b className="text-white text-xs">{currentUser.name}</b>
          </div>
          <div className={`rounded-xl border px-4 py-2 ${
            hubUtilisationPct >= 100
              ? 'border-rose-500/40 bg-rose-500/10'
              : hubUtilisationPct >= congestionThresholdPct
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-emerald-500/30 bg-emerald-500/10'
          }`}>
            <div className="text-[9px] uppercase text-slate-500">Hub Utilisation</div>
            <b className={`text-xs font-mono ${hubUtilisationPct >= 100 ? 'text-rose-300' : hubUtilisationPct >= congestionThresholdPct ? 'text-amber-300' : 'text-emerald-300'}`}>
              {hubUtilisationPct}%
            </b>
            <div className="text-[9px] text-slate-500 mt-0.5">{activeWorkload}/{hubProcessingCapacity} active parcels · alert at {congestionThresholdPct}%</div>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Today's Shipments</h2>
          <div className="text-[11px] text-slate-500">Shipment progress for this hub today</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {shipmentCards.map(({ label, value, icon: Icon, tone, filter }) => (
              <button
                key={label}
                onClick={() => setDrawerFilter(filter)}
                className={`group p-4 rounded-2xl border shadow-lg text-left transition hover:-translate-y-0.5 ${tones[tone]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wide">{label}</span>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-3 text-3xl font-extrabold text-white font-mono">{value}</div>
                <div className="mt-2 text-[10px] text-slate-500 group-hover:text-slate-300 flex items-center gap-1">
                  View list <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setDrawerFilter('all')}
            className="xl:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl text-left hover:border-cyan-500/40 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-bold text-white">Shipment Progress</div>
                <div className="text-[10px] text-slate-500">Completed, in progress and exception</div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center gap-5">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="10" />
                  {chartSegments.map((segment) => {
                    const fraction = totalShipments > 0 ? segment.value / totalShipments : 0;
                    const length = circumference * fraction;
                    const offset = runningOffset;
                    runningOffset += length;
                    return (
                      <circle
                        key={segment.key}
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={segment.stroke}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${chartReady ? length : 0} ${circumference}`}
                        strokeDashoffset={-offset}
                        style={{ transition: 'stroke-dasharray 2200ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-extrabold text-white font-mono">{totalShipments}</div>
                  <div className="text-[9px] uppercase text-slate-500">shipments</div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {chartSegments.map((segment) => {
                  const pct = totalShipments > 0 ? Math.round((segment.value / totalShipments) * 100) : 0;
                  return (
                    <div key={segment.key}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">{segment.label}</span>
                        <span className="font-mono font-bold text-white">{segment.value} · {pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: chartReady ? `${pct}%` : '0%',
                            backgroundColor: segment.stroke,
                            transition: 'width 2200ms cubic-bezier(0.22, 1, 0.36, 1)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Hub Operations</h2>
          <div className="text-[11px] text-slate-500">Today's receiving, sorting and dispatch workload</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
          {operationCards.map(({ label, primary, secondary, icon: Icon, tone, focus }) => (
            <button
              key={label}
              onClick={() => openHubSection(focus)}
              className={`group p-4 rounded-2xl border shadow-lg text-left transition hover:-translate-y-0.5 ${tones[tone]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wide leading-tight">{label}</span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <div className="mt-3 text-lg font-extrabold text-white font-mono">{primary}</div>
              <div className="text-[10px] text-slate-500 mt-1 min-h-[28px]">{secondary}</div>
              <div className="mt-2 text-[10px] text-slate-500 group-hover:text-slate-300 flex items-center gap-1">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section ref={flowChartRef} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Parcel Flow Today</h2>
            <div className="text-[10px] text-slate-500 mt-1">Received vs dispatched by time — use this to spot a growing hub backlog.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-[10px] text-slate-400">
              Current backlog <b className="text-white font-mono ml-1">{currentBacklog}</b> parcels
            </div>
            <button
              onClick={notifyCoordinator}
              disabled={!canNotifyCoordinator || congestionNotified}
              title={!canNotifyCoordinator ? `Available when hub utilisation reaches ${congestionThresholdPct}%` : undefined}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                congestionNotified
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 cursor-default'
                  : !canNotifyCoordinator
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              <BellRing className="w-4 h-4" />
              {congestionNotified ? 'Coordinator Notified' : 'Notify Transport Coordinator'}
            </button>
          </div>
          <div className={`text-[10px] mt-2 lg:text-right ${canNotifyCoordinator ? 'text-amber-300' : 'text-slate-500'}`}>
            {canNotifyCoordinator
              ? `Hub utilisation is ${hubUtilisationPct}% — coordinator notification is available.`
              : `Notification becomes available at ${congestionThresholdPct}% hub utilisation.`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-9 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-2 text-slate-300"><span className="w-2 h-2 rounded-full bg-cyan-400" />Received</span>
                <span className="flex items-center gap-2 text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-400" />Dispatched</span>
              </div>
              <div className="text-[10px] text-slate-500">Parcels per time window</div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/70 px-2 py-2">
              <svg
                viewBox={`0 0 ${flowChart.width} ${flowChart.height}`}
                className="w-full h-auto max-h-[250px]"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Received and dispatched parcels by time"
                onMouseLeave={() => setHoveredFlowIndex(null)}
              >
                <defs>
                  <linearGradient id="receivedGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <text x="10" y="16" fill="#64748b" fontSize="11" fontWeight="600">Parcels</text>

                {flowTicks.map((tick) => (
                  <g key={tick.value}>
                    <line
                      x1={flowChart.left}
                      x2={flowChart.width - flowChart.right}
                      y1={tick.y}
                      y2={tick.y}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray={tick.value === 0 ? undefined : '4 6'}
                    />
                    <text
                      x={flowChart.left - 12}
                      y={tick.y + 4}
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {tick.value}
                    </text>
                  </g>
                ))}

                <line
                  x1={flowChart.left}
                  x2={flowChart.left}
                  y1={flowChart.top}
                  y2={flowChart.height - flowChart.bottom}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <line
                  x1={flowChart.left}
                  x2={flowChart.width - flowChart.right}
                  y1={flowChart.height - flowChart.bottom}
                  y2={flowChart.height - flowChart.bottom}
                  stroke="#334155"
                  strokeWidth="1"
                />

                <polygon
                  points={`${flowChart.left},${flowChart.height - flowChart.bottom} ${flowPoints('received')} ${flowChart.width - flowChart.right},${flowChart.height - flowChart.bottom}`}
                  fill="url(#receivedGlow)"
                  style={{ opacity: flowChartReady ? 1 : 0, transition: 'opacity 900ms ease 900ms' }}
                />

                <polyline
                  points={flowPoints('received')}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={flowChartReady ? 0 : 1}
                  style={{ transition: 'stroke-dashoffset 2200ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
                <polyline
                  points={flowPoints('dispatched')}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={flowChartReady ? 0 : 1}
                  style={{ transition: 'stroke-dashoffset 2500ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                />

                {parcelFlow.map((point, index) => {
                  const x = flowX(index);
                  const yReceived = flowY(point.received);
                  const yDispatched = flowY(point.dispatched);
                  const active = hoveredFlowIndex === index;
                  return (
                    <g key={point.hour}>
                      <rect
                        x={x - flowPlotWidth / Math.max(1, parcelFlow.length - 1) / 2}
                        y={flowChart.top}
                        width={flowPlotWidth / Math.max(1, parcelFlow.length - 1)}
                        height={flowPlotHeight}
                        fill="transparent"
                        onMouseEnter={() => setHoveredFlowIndex(index)}
                      />
                      {active && (
                        <line
                          x1={x}
                          x2={x}
                          y1={flowChart.top}
                          y2={flowChart.height - flowChart.bottom}
                          stroke="#475569"
                          strokeWidth="1"
                          strokeDasharray="3 5"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={yReceived}
                        r={active ? 5 : 3.5}
                        fill="#0f172a"
                        stroke="#22d3ee"
                        strokeWidth="2.5"
                        style={{ opacity: flowChartReady ? 1 : 0, transition: `opacity 350ms ${900 + index * 100}ms, r 150ms ease` }}
                      />
                      <circle
                        cx={x}
                        cy={yDispatched}
                        r={active ? 5 : 3.5}
                        fill="#0f172a"
                        stroke="#34d399"
                        strokeWidth="2.5"
                        style={{ opacity: flowChartReady ? 1 : 0, transition: `opacity 350ms ${1050 + index * 100}ms, r 150ms ease` }}
                      />
                      <text
                        x={x}
                        y={flowChart.height - 14}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {point.hour}
                      </text>
                    </g>
                  );
                })}

                {hoveredFlowIndex !== null && (() => {
                  const point = parcelFlow[hoveredFlowIndex];
                  const x = flowX(hoveredFlowIndex);
                  const tooltipWidth = 126;
                  const tooltipX = Math.min(
                    Math.max(x - tooltipWidth / 2, flowChart.left),
                    flowChart.width - flowChart.right - tooltipWidth,
                  );
                  return (
                    <g pointerEvents="none">
                      <rect
                        x={tooltipX}
                        y="26"
                        width={tooltipWidth}
                        height="52"
                        rx="10"
                        fill="#0f172a"
                        stroke="#334155"
                      />
                      <text x={tooltipX + 12} y="43" fill="#cbd5e1" fontSize="10" fontWeight="700">{point.hour}</text>
                      <circle cx={tooltipX + 14} cy="56" r="3" fill="#22d3ee" />
                      <text x={tooltipX + 23} y="59" fill="#94a3b8" fontSize="9">Received</text>
                      <text x={tooltipX + tooltipWidth - 12} y="59" fill="#e2e8f0" fontSize="10" textAnchor="end" fontWeight="700">{point.received}</text>
                      <circle cx={tooltipX + 14} cy="69" r="3" fill="#34d399" />
                      <text x={tooltipX + 23} y="72" fill="#94a3b8" fontSize="9">Dispatched</text>
                      <text x={tooltipX + tooltipWidth - 12} y="72" fill="#e2e8f0" fontSize="10" textAnchor="end" fontWeight="700">{point.dispatched}</text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[9px] uppercase text-slate-500">Awaiting Receiving</div>
              <div className="text-xl font-extrabold font-mono text-amber-300 mt-1">{awaitingReceivingParcels}</div>
              <div className="text-[10px] text-slate-500">parcels</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[9px] uppercase text-slate-500">Sorting Queue</div>
              <div className="text-xl font-extrabold font-mono text-violet-300 mt-1">{sortingQueue}</div>
              <div className="text-[10px] text-slate-500">parcels</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[9px] uppercase text-slate-500">Hub Utilisation</div>
                <div className="text-[9px] text-slate-500">Threshold {congestionThresholdPct}%</div>
              </div>
              <div className={`text-xl font-extrabold font-mono mt-1 ${hubUtilisationPct >= 100 ? 'text-rose-300' : hubUtilisationPct >= congestionThresholdPct ? 'text-amber-300' : 'text-emerald-300'}`}>{hubUtilisationPct}%</div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${hubUtilisationPct >= 100 ? 'bg-rose-400' : hubUtilisationPct >= congestionThresholdPct ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(100, hubUtilisationPct)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{activeWorkload}/{hubProcessingCapacity} active parcels</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 col-span-2 lg:col-span-1">
              <div className="text-[9px] uppercase text-slate-500">Alert Severity</div>
              <div className={`text-sm font-extrabold mt-1 ${congestionSeverity === 'High' ? 'text-rose-300' : congestionSeverity === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>
                {congestionSeverity}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Based on hub utilisation threshold</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <section className="xl:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Incoming to Hub</h2>
            <button onClick={() => openHubSection('incoming')} className="text-[11px] text-cyan-400 font-semibold">
              View all <ArrowRight className="inline w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {incomingInTransit.slice(0, 6).map((m) => {
              const missing = m.expectedParcelIds.filter((id) => !m.receivedParcelIds.includes(id));
              return (
                <button
                  key={m.id}
                  onClick={() => openHubSection('receiving')}
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500/40 flex items-center justify-between gap-3 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-white">
                      {m.transportType === 'Train' ? (
                        <Train className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Truck className="w-4 h-4 text-cyan-400" />
                      )}
                      {m.serviceId}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {m.originName} • ETA {m.scheduledTime} • {m.dock}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${missing.length ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {m.expectedShipmentIds.length} shipment{m.expectedShipmentIds.length === 1 ? '' : 's'}
                    </div>
                    <div className="text-[9px] text-slate-500">{m.expectedParcelIds.length} parcels expected</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="xl:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Dispatch Loads</h2>
            <button onClick={() => openHubSection('outgoing')} className="text-[11px] text-cyan-400 font-semibold">
              Open outbound <ArrowRight className="inline w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outgoingGroups.map((g) => (
              <button
                key={g.service}
                onClick={() => openHubSection('outgoing')}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 text-left"
              >
                <div className="flex justify-between gap-3">
                  <div className="font-bold text-white">{g.service}</div>
                  <div className="font-mono font-bold text-emerald-300">{g.count} parcels</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{g.type} • {g.time} • {g.dock}</div>
                <div className="text-[10px] text-slate-400 mt-1">{g.next}</div>
                <div className="text-[9px] mt-2 uppercase font-bold text-slate-500">{g.status === 'Matched' ? 'Dispatched' : 'Preparing'}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <button
        onClick={() => setDrawerFilter('all')}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-cyan-500/40 p-4 text-left flex items-center justify-between"
      >
        <div>
          <div className="text-sm font-bold text-white">Hub Shipments</div>
          <div className="text-[11px] text-slate-500">{localShipments.length} shipments linked to this hub</div>
        </div>
        <ArrowRight className="w-4 h-4 text-cyan-400" />
      </button>

      {drawerFilter && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close shipment list"
            onClick={() => setDrawerFilter(null)}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          />
          <aside className="relative w-full max-w-xl h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-[slideIn_.22s_ease-out]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-white">{drawerTitle[drawerFilter]}</div>
                <div className="text-xs text-slate-500 mt-1">{drawerShipments.length} shipment(s)</div>
              </div>
              <button onClick={() => setDrawerFilter(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerShipments.map((shipment) => {
                const isException = exceptionShipmentIds.has(shipment.id) && !completedShipmentIds.has(shipment.id);
                const isCompleted = completedShipmentIds.has(shipment.id);
                return (
                  <button
                    key={shipment.id}
                    onClick={() => openShipmentDetail(shipment.id)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/70 hover:border-cyan-500/40 p-4 text-left transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono font-extrabold text-cyan-300">{shipment.id}</div>
                        <div className="text-xs text-slate-300 mt-1">{shipment.originHub} → {shipment.destinationHub}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : isException
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                      }`}>
                        {isCompleted ? 'Completed' : isException ? 'Exception' : 'In Progress'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
                      <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                        <div className="text-slate-500">Parcels</div>
                        <b className="text-white font-mono">{shipment.parcelCount || shipment.parcelIds?.length || 1}</b>
                      </div>
                      <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                        <div className="text-slate-500">Service</div>
                        <b className="text-white">{shipment.assignedVehicleOrTrain}</b>
                      </div>
                      <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
                        <div className="text-slate-500">ETA</div>
                        <b className="text-white">{shipment.eta}</b>
                      </div>
                    </div>
                    {isException && <div className="mt-3 text-[10px] text-rose-300">{getExceptionReason(shipment.id)}</div>}
                    <div className="mt-3 text-[10px] text-cyan-400 flex items-center gap-1">Open shipment <ArrowRight className="w-3 h-3" /></div>
                  </button>
                );
              })}
              {drawerShipments.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">No shipments in this category.</div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
