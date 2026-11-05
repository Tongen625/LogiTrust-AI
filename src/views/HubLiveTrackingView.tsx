import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { getAssignedHub } from '../utils/hubScope';
import { HubManifest, ParcelItem, Shipment } from '../types/logistics';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Package,
  Search,
  Train,
  Truck,
} from 'lucide-react';

type ViewFilter = 'All' | 'Incoming' | 'At Hub' | 'Outgoing' | 'Exception';
type TransportFilter = 'All' | 'Train' | 'Truck' | 'Intermodal';

type LoadLifecycle = 'Incoming' | 'At Hub' | 'Outgoing' | 'Exception';

interface LocalLoadView {
  id: string;
  serviceId: string;
  manifest: HubManifest;
  transportType: 'Train' | 'Truck' | 'Intermodal';
  lifecycle: LoadLifecycle;
  directionLabel: string;
  statusLabel: string;
  routeFrom: string;
  routeTo: string;
  scheduledTime: string;
  dock: string;
  shipmentCount: number;
  parcelCount: number;
  scannedCount: number;
  outstandingCount: number;
  hasException: boolean;
  shipmentItems: Shipment[];
}

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

const compactName = (value?: string) => (value || '—').replace(/\s*\([^)]*\)\s*$/g, '').trim();

const hubNameMatches = (value: string | undefined, hubName: string, hubCode: string) => {
  if (!value) return false;
  const text = value.toLowerCase();
  const plainHub = compactName(hubName).toLowerCase();
  return text.includes(plainHub) || text.includes(hubCode.toLowerCase()) || text.includes('johor bahru');
};

const fallbackParcels = (shipment: Shipment): ParcelItem[] => {
  const ids = shipment.parcelIds?.length
    ? shipment.parcelIds
    : Array.from({ length: shipment.parcelCount || 1 }, (_, i) => `P-${shipment.id}-${String(i + 1).padStart(2, '0')}`);

  return ids.map((id, index) => ({
    id,
    packageType: index % 3 === 0 ? 'Box' : index % 3 === 1 ? 'Satchel' : 'Document',
    weightKg: Number((shipment.weightKg / Math.max(ids.length, 1)).toFixed(1)),
    dimensions: shipment.dimensions,
    handling: shipment.priority === 'High-Value' ? 'High-Value' : shipment.priority === 'Cold-Chain' ? 'Fragile' : 'Normal',
    status: 'Expected',
    currentHub: shipment.currentLocation,
    lastScan: shipment.currentLocation,
  }));
};

const transportIcon = (type: 'Train' | 'Truck' | 'Intermodal', className = 'w-4 h-4') => {
  if (type === 'Train') return <Train className={className} />;
  if (type === 'Truck') return <Truck className={className} />;
  return <Package className={className} />;
};

const lifecycleBadgeClass: Record<LoadLifecycle, string> = {
  Incoming: 'border-sky-200 bg-sky-50 text-sky-700',
  'At Hub': 'border-cyan-200 bg-cyan-50 text-cyan-700',
  Outgoing: 'border-violet-200 bg-violet-50 text-violet-700',
  Exception: 'border-rose-200 bg-rose-50 text-rose-700',
};

const parcelStateClass = (status: ParcelItem['status']) => {
  switch (status) {
    case 'Received':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700';
    case 'Sorting':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'Ready Outbound':
    case 'Loaded':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'Missing':
    case 'Hold':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

const loadProgressPercent = (load: LocalLoadView) => {
  if (load.lifecycle === 'At Hub') return 100;

  const seed = Array.from(load.serviceId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  if (load.lifecycle === 'Incoming') return 38 + (seed % 38);
  if (load.lifecycle === 'Outgoing') return 24 + (seed % 56);
  return 46 + (seed % 18);
};

const estimateRemainingMinutes = (load: LocalLoadView) => {
  if (load.lifecycle === 'At Hub') return 0;

  const progress = loadProgressPercent(load);
  const plannedMinutes = load.transportType === 'Train' ? 95 : load.transportType === 'Intermodal' ? 110 : 65;
  return Math.max(5, Math.round(((100 - progress) / 100) * plannedMinutes / 5) * 5);
};

const routePointAtProgress = (progress: number, direction: 'incoming' | 'outgoing') => {
  const incomingPoints = [
    { x: 9, y: 76 },
    { x: 22, y: 65 },
    { x: 34, y: 67 },
    { x: 46, y: 51 },
    { x: 60, y: 54 },
    { x: 72, y: 38 },
    { x: 88, y: 27 },
  ];

  const points = direction === 'incoming' ? incomingPoints : [...incomingPoints].reverse();
  const clamped = Math.max(0, Math.min(progress, 100));
  const segmentProgress = (clamped / 100) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(segmentProgress));
  const t = segmentProgress - index;
  const start = points[index];
  const end = points[index + 1];

  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
};

const buildParcelStatus = (shipment: Shipment, manifest: HubManifest): ParcelItem[] => {
  const base = shipment.parcels?.length ? shipment.parcels : fallbackParcels(shipment);
  const isIncoming = (manifest.direction || 'Incoming') === 'Incoming';
  const isOutgoing = manifest.direction === 'Outgoing';
  const receivedIds = new Set(manifest.receivedParcelIds || []);
  const manifestExpectedIds = new Set(manifest.expectedParcelIds || []);
  const currentLocation = shipment.currentLocation.toLowerCase();

  return base.map((parcel) => {
    let status: ParcelItem['status'] = parcel.status || 'Expected';

    if (receivedIds.has(parcel.id)) {
      if (isOutgoing) {
        status = manifest.status === 'Matched' ? 'Loaded' : 'Ready Outbound';
      } else if (currentLocation.includes('sorting')) {
        status = 'Sorting';
      } else if (currentLocation.includes('outbound')) {
        status = 'Ready Outbound';
      } else if (currentLocation.includes('exception')) {
        status = 'Hold';
      } else {
        status = 'Received';
      }
    } else if (manifestExpectedIds.has(parcel.id)) {
      if (manifest.status === 'Mismatch') {
        status = 'Missing';
      } else if (isOutgoing) {
        status = 'Ready Outbound';
      } else if (isIncoming) {
        status = 'Expected';
      }
    }

    return {
      ...parcel,
      status,
      lastScan: parcel.lastScan || shipment.currentLocation,
      currentHub: parcel.currentHub || shipment.currentLocation,
    };
  });
};

export const HubLiveTrackingView: React.FC = () => {
  const { shipments, hubs, hubManifests, currentUser, selectedShipmentId, setSelectedShipmentId } = useLogistics();
  const hub = getAssignedHub(hubs, currentUser);

  const [query, setQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('All');
  const [transportFilterValue, setTransportFilterValue] = useState<TransportFilter>('All');
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');

  const localLoads = useMemo<LocalLoadView[]>(() => {
    if (!hub) return [];

    const localManifests = hubManifests.filter((manifest) => manifest.hubId === hub.id);

    return localManifests.map((manifest) => {
      const shipmentItems = manifest.expectedShipmentIds
        .map((shipmentId) => shipments.find((shipment) => shipment.id === shipmentId))
        .filter(Boolean) as Shipment[];

      const parcelCount = shipmentItems.reduce((sum, shipment) => sum + (shipment.parcelIds?.length || shipment.parcelCount || 0), 0);
      const scannedCount = manifest.receivedParcelIds.length;
      const outstandingCount = Math.max(manifest.expectedParcelIds.length - scannedCount, 0);
      const isIncoming = (manifest.direction || 'Incoming') === 'Incoming';
      const hasException =
        manifest.status === 'Mismatch' || shipmentItems.some((shipment) => shipment.status === 'Security Review' || shipment.hasSecurityAlert);

      let lifecycle: LoadLifecycle;
      let statusLabel = 'In progress';

      if (hasException) {
        lifecycle = 'Exception';
        statusLabel = 'Needs attention';
      } else if (isIncoming) {
        if (scannedCount === 0) {
          lifecycle = 'Incoming';
          statusLabel = 'On the way to my hub';
        } else {
          lifecycle = 'At Hub';
          statusLabel = scannedCount < manifest.expectedParcelIds.length ? 'Receiving in progress' : 'Received at my hub';
        }
      } else {
        lifecycle = 'Outgoing';
        statusLabel = manifest.status === 'Matched' ? 'Dispatched / loaded' : 'Preparing dispatch';
      }

      return {
        id: manifest.id,
        serviceId: manifest.serviceId,
        manifest,
        transportType: manifest.transportType,
        lifecycle,
        directionLabel: isIncoming ? 'To My Hub' : 'From My Hub',
        statusLabel,
        routeFrom: manifest.originName || (isIncoming ? 'Upstream hub' : compactName(hub.name)),
        routeTo: manifest.destinationName || (isIncoming ? compactName(hub.name) : 'Downstream hub'),
        scheduledTime: manifest.scheduledTime || manifest.lastUpdated,
        dock: manifest.dock || 'Assigned dock',
        shipmentCount: manifest.expectedShipmentIds.length,
        parcelCount: manifest.expectedParcelIds.length || parcelCount,
        scannedCount,
        outstandingCount,
        hasException,
        shipmentItems,
      };
    });
  }, [hub, hubManifests, shipments]);

  const counts = useMemo(() => {
    const base = { All: localLoads.length, Incoming: 0, 'At Hub': 0, Outgoing: 0, Exception: 0 } as Record<ViewFilter, number>;
    localLoads.forEach((load) => {
      base[load.lifecycle] += 1;
    });
    return base;
  }, [localLoads]);

  const visibleLoads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return localLoads.filter((load) => {
      const matchesFilter = viewFilter === 'All' || load.lifecycle === viewFilter;
      const matchesTransport = transportFilterValue === 'All' || load.transportType === transportFilterValue;
      const matchesQuery =
        !normalized ||
        `${load.serviceId} ${load.routeFrom} ${load.routeTo} ${load.manifest.id} ${load.manifest.expectedShipmentIds.join(' ')}`
          .toLowerCase()
          .includes(normalized);
      return matchesFilter && matchesTransport && matchesQuery;
    });
  }, [localLoads, viewFilter, transportFilterValue, query]);

  const selectedLoad = visibleLoads.find((load) => load.id === selectedLoadId) || visibleLoads[0];

  const selectedLoadShipments = selectedLoad?.shipmentItems || [];
  const selectedShipment =
    selectedLoadShipments.find((shipment) => shipment.id === selectedShipmentId) || selectedLoadShipments[0];

  const selectedShipmentParcels = selectedLoad && selectedShipment ? buildParcelStatus(selectedShipment, selectedLoad.manifest) : [];

  if (!hub) {
    return <div className="p-6 text-rose-600 text-sm">Assigned hub could not be resolved.</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 bg-slate-50 min-h-screen">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">My Hub Live Tracking</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">Track loads relevant to {compactName(hub.name)}. Click a load to see its shipments, then parcels.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
          {([
            { key: 'Incoming', label: 'Incoming Loads' },
            { key: 'At Hub', label: 'At Hub' },
            { key: 'Outgoing', label: 'Outgoing Loads' },
            { key: 'Exception', label: 'Exception' },
          ] as { key: ViewFilter; label: string }[]).map((card) => (
            <button
              key={card.key}
              onClick={() => setViewFilter(card.key)}
              className={cx(
                'rounded-2xl border px-4 py-3 text-left transition',
                viewFilter === card.key ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="text-xs font-medium text-slate-500">{card.label}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{counts[card.key]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search load, shipment or route"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="All">All statuses</option>
              <option value="Incoming">Incoming</option>
              <option value="At Hub">At Hub</option>
              <option value="Outgoing">Outgoing</option>
              <option value="Exception">Exception</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={transportFilterValue}
              onChange={(e) => setTransportFilterValue(e.target.value as TransportFilter)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="All">All transport</option>
              <option value="Truck">Truck</option>
              <option value="Train">Train</option>
              <option value="Intermodal">Intermodal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Hub Loads</div>
              <div className="text-xs text-slate-500">Track by load first, then open shipment details</div>
            </div>
            <div className="text-xs text-slate-500">{visibleLoads.length} loads</div>
          </div>

          <div className="max-h-[760px] overflow-y-auto divide-y divide-slate-100">
            {visibleLoads.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No hub load matches the selected filters.</div>
            ) : (
              visibleLoads.map((load) => (
                <button
                  key={load.id}
                  onClick={() => setSelectedLoadId(load.id)}
                  className={cx(
                    'w-full text-left px-4 py-4 transition hover:bg-slate-50',
                    selectedLoad?.id === load.id && 'bg-blue-50/70'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700">
                          {transportIcon(load.transportType)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{load.serviceId}</div>
                          <div className="text-xs text-slate-500">{load.directionLabel}</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 mt-3 line-clamp-1">{compactName(load.routeFrom)} <ArrowRight className="inline w-3 h-3 mx-1" /> {compactName(load.routeTo)}</div>
                    </div>
                    <span className={cx('shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold', lifecycleBadgeClass[load.lifecycle])}>
                      {load.lifecycle}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <div className="text-slate-500">Shipments</div>
                      <div className="font-semibold text-slate-900 mt-1">{load.shipmentCount}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <div className="text-slate-500">Parcels</div>
                      <div className="font-semibold text-slate-900 mt-1">{load.parcelCount}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <div className="text-slate-500">ETA / Time</div>
                      <div className="font-semibold text-slate-900 mt-1">{load.scheduledTime}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <div className="text-slate-600">{load.statusLabel}</div>
                    <div className="text-slate-500">Dock {load.dock}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="space-y-5">
          {selectedLoad ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-blue-700">
                        {transportIcon(selectedLoad.transportType, 'w-5 h-5')}
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Selected load</div>
                        <div className="text-2xl font-bold text-slate-900">{selectedLoad.serviceId}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={cx('rounded-full border px-2.5 py-1 text-xs font-semibold', lifecycleBadgeClass[selectedLoad.lifecycle])}>
                        {selectedLoad.lifecycle}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{selectedLoad.directionLabel}</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">Dock {selectedLoad.dock}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="text-xs text-slate-500">Shipments</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedLoad.shipmentCount}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="text-xs text-slate-500">Parcels</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedLoad.parcelCount}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="text-xs text-slate-500">Scanned</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedLoad.scannedCount}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="text-xs text-slate-500">Outstanding</div>
                      <div className="font-bold text-slate-900 mt-1">{selectedLoad.outstandingCount}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-slate-200">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Live route to / from my hub</div>
                      <div className="text-xs text-slate-500 mt-0.5">{compactName(selectedLoad.routeFrom)} → {compactName(selectedLoad.routeTo)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500">ETA</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedLoad.scheduledTime}</div>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-wide text-blue-600">Est. remaining</div>
                        <div className="text-sm font-bold text-blue-800 mt-0.5">
                          {estimateRemainingMinutes(selectedLoad) === 0 ? 'At hub' : `~${estimateRemainingMinutes(selectedLoad)} min`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const incomingDirection = (selectedLoad.manifest.direction || 'Incoming') === 'Incoming';
                    const progress = selectedLoad.lifecycle === 'At Hub' ? 100 : loadProgressPercent(selectedLoad);
                    const transportPoint = routePointAtProgress(progress, incomingDirection ? 'incoming' : 'outgoing');
                    const hubPoint = incomingDirection ? { x: 88, y: 27 } : { x: 9, y: 76 };
                    const originPoint = incomingDirection ? { x: 9, y: 76 } : { x: 88, y: 27 };

                    return (
                      <div className="relative h-[360px] sm:h-[420px] overflow-hidden bg-[#edf3f7]">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <rect width="100" height="100" fill="#eef4f7" />
                          <path d="M-5 18 C18 8 29 23 48 16 S82 12 106 3" fill="none" stroke="#dce6ec" strokeWidth="3.4" />
                          <path d="M-8 88 C18 77 24 89 43 79 S74 69 108 82" fill="none" stroke="#d9e4ea" strokeWidth="4.2" />
                          <path d="M14 -6 C9 18 22 31 15 48 S5 78 11 106" fill="none" stroke="#d7e2e9" strokeWidth="3.5" />
                          <path d="M46 -4 C49 20 42 38 51 54 S58 80 53 105" fill="none" stroke="#dce6ec" strokeWidth="2.6" />
                          <path d="M83 -8 C78 19 88 38 78 58 S75 83 88 108" fill="none" stroke="#d5e1e8" strokeWidth="3.2" />
                          <path d="M-8 46 C20 40 35 48 55 39 S87 30 108 39" fill="none" stroke="#ffffff" strokeWidth="3.8" />
                          <path d="M-6 61 C18 58 29 50 47 60 S75 74 107 63" fill="none" stroke="#ffffff" strokeWidth="2.8" />
                          <path d="M30 -5 C27 18 34 31 27 47 S27 80 36 106" fill="none" stroke="#ffffff" strokeWidth="2.6" />
                          <path d="M66 -5 C63 19 69 34 62 51 S59 82 65 105" fill="none" stroke="#ffffff" strokeWidth="3" />

                          <path
                            d={incomingDirection
                              ? 'M9 76 C21 64 29 70 40 59 C51 47 59 60 70 44 C77 34 83 32 88 27'
                              : 'M88 27 C83 32 77 34 70 44 C59 60 51 47 40 59 C29 70 21 64 9 76'}
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="2.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d={incomingDirection
                              ? 'M9 76 C21 64 29 70 40 59 C51 47 59 60 70 44 C77 34 83 32 88 27'
                              : 'M88 27 C83 32 77 34 70 44 C59 60 51 47 40 59 C29 70 21 64 9 76'}
                            fill="none"
                            stroke={selectedLoad.hasException ? '#f43f5e' : '#2563eb'}
                            strokeWidth="1.65"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={selectedLoad.hasException ? '4 2' : undefined}
                          />
                        </svg>

                        <div className="absolute left-[6%] top-[10%] text-[11px] font-medium text-slate-400 rotate-[-8deg]">Southern Corridor</div>
                        <div className="absolute right-[7%] bottom-[9%] text-[11px] font-medium text-slate-400 rotate-[7deg]">Hub Access Road</div>
                        <div className="absolute left-[38%] top-[72%] text-[10px] text-slate-400">Industrial Route</div>

                        <div
                          className="absolute -translate-x-1/2 -translate-y-full"
                          style={{ left: `${originPoint.x}%`, top: `${originPoint.y}%` }}
                        >
                          <div className="max-w-[150px] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-md">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400">{incomingDirection ? 'Origin' : 'Next hub'}</div>
                            <div className="text-xs font-semibold text-slate-800 mt-0.5 leading-tight">{compactName(incomingDirection ? selectedLoad.routeFrom : selectedLoad.routeTo)}</div>
                          </div>
                          <div className="w-3 h-3 mx-auto -mt-1.5 rounded-full bg-slate-700 border-2 border-white shadow" />
                        </div>

                        <div
                          className="absolute -translate-x-1/2 -translate-y-full"
                          style={{ left: `${hubPoint.x}%`, top: `${hubPoint.y}%` }}
                        >
                          <div className="max-w-[170px] rounded-xl border border-blue-200 bg-white px-3 py-2 shadow-lg">
                            <div className="flex items-center gap-1.5 text-blue-700">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="text-[10px] uppercase tracking-wide font-semibold">My Hub</span>
                            </div>
                            <div className="text-xs font-bold text-slate-900 mt-0.5 leading-tight">{compactName(hub.name)}</div>
                          </div>
                          <div className="w-4 h-4 mx-auto -mt-1.5 rounded-full bg-blue-600 border-[3px] border-white shadow" />
                        </div>

                        <div
                          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
                          style={{ left: `${transportPoint.x}%`, top: `${transportPoint.y}%` }}
                        >
                          <div className={cx(
                            'relative w-12 h-12 rounded-full border-4 border-white shadow-xl flex items-center justify-center',
                            selectedLoad.hasException ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'
                          )}>
                            {transportIcon(selectedLoad.transportType, 'w-5 h-5')}
                            <span className="absolute -bottom-7 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow">
                              {selectedLoad.serviceId}
                            </span>
                          </div>
                        </div>

                        <div className="absolute left-4 bottom-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock3 className="w-3.5 h-3.5" />
                            {selectedLoad.statusLabel}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {estimateRemainingMinutes(selectedLoad) === 0
                              ? 'Transport is at this hub'
                              : `${loadProgressPercent(selectedLoad)}% of route completed · ~${estimateRemainingMinutes(selectedLoad)} min remaining`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-[1.25fr_0.95fr] gap-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <div className="text-lg font-bold text-slate-900">Shipments under this load</div>
                    <div className="text-xs text-slate-500 mt-1">Track the shipment first, then open its parcel-level detail.</div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {selectedLoadShipments.map((shipment) => {
                      const isActive = shipment.id === selectedShipment?.id;
                      const parcelTotal = shipment.parcelIds?.length || shipment.parcelCount || 0;
                      return (
                        <button
                          key={shipment.id}
                          onClick={() => setSelectedShipmentId(shipment.id)}
                          className={cx(
                            'w-full px-5 py-4 text-left transition hover:bg-slate-50',
                            isActive && 'bg-blue-50/70'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-blue-700">{shipment.id}</span>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-800 truncate">{shipment.origin} to {shipment.destination}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">{shipment.currentLocation}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs text-slate-500">ETA</div>
                              <div className="font-semibold text-slate-900">{shipment.eta}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <div className="text-slate-500">Status</div>
                              <div className="font-semibold text-slate-900 mt-1">{shipment.status}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <div className="text-slate-500">Transport</div>
                              <div className="font-semibold text-slate-900 mt-1">{shipment.assignedVehicleOrTrain}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <div className="text-slate-500">Parcels</div>
                              <div className="font-semibold text-slate-900 mt-1">{parcelTotal}</div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <div className="text-slate-500">Priority</div>
                              <div className="font-semibold text-slate-900 mt-1">{shipment.priority}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <div className="text-lg font-bold text-slate-900">Parcel detail</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {selectedShipment ? `Now showing parcel detail for ${selectedShipment.id}.` : 'Select a shipment to view parcel detail.'}
                    </div>
                  </div>

                  {selectedShipment ? (
                    <div className="p-5 space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{selectedShipment.id}</div>
                            <div className="text-xs text-slate-500 mt-1">{selectedShipment.currentLocation}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Vehicle / train</div>
                            <div className="text-sm font-semibold text-slate-900">{selectedShipment.assignedVehicleOrTrain}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="text-xs text-slate-500">Parcel count</div>
                          <div className="text-xl font-bold text-slate-900 mt-1">{selectedShipmentParcels.length}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="text-xs text-slate-500">ETA</div>
                          <div className="text-xl font-bold text-slate-900 mt-1">{selectedShipment.eta}</div>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {selectedShipmentParcels.map((parcel) => (
                          <div key={parcel.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 break-all">{parcel.id}</div>
                                <div className="text-xs text-slate-500 mt-1">{parcel.packageType} • {parcel.weightKg} kg • {parcel.dimensions}</div>
                              </div>
                              <span className={cx('rounded-full border px-2.5 py-1 text-[11px] font-semibold', parcelStateClass(parcel.status))}>
                                {parcel.status}
                              </span>
                            </div>
                            <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-3">
                              <span>Handling: {parcel.handling}</span>
                              <span>Last scan: {parcel.lastScan || '—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-semibold text-slate-900 mb-3">Shipment movement history</div>
                        <div className="space-y-3">
                          {selectedShipment.timeline.map((event, index) => (
                            <div key={`${event.location}-${index}`} className="flex items-start gap-3">
                              <div className={cx('w-2.5 h-2.5 rounded-full mt-1.5', event.current ? 'bg-blue-600' : event.completed ? 'bg-emerald-500' : 'bg-slate-300')} />
                              <div>
                                <div className="text-sm text-slate-900">{event.location}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{event.stage} • {event.timestamp}</div>
                                {event.notes && <div className="text-xs text-slate-500 mt-0.5">{event.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-slate-500">No shipment under this load.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
              No relevant load found for this hub.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
