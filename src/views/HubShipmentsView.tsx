import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { getAssignedHub, shipmentCurrentlyAtHub, shipmentTouchesHub } from '../utils/hubScope';
import { ParcelItem, Shipment } from '../types/logistics';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  MapPin,
  Package,
  Search,
  Send,
  ShieldCheck,
  Train,
  Truck,
} from 'lucide-react';

type HubLifecycle = 'Incoming' | 'At Hub' | 'Ready for Dispatch' | 'Dispatched' | 'Exception';
type HubTab = 'All' | HubLifecycle;
type TransportFilter = 'All' | 'Train' | 'Truck' | 'Intermodal';

const fallbackParcels = (shipment: Shipment, isAtHub: boolean): ParcelItem[] => {
  const ids = shipment.parcelIds?.length
    ? shipment.parcelIds
    : Array.from({ length: shipment.parcelCount || 1 }, (_, i) => `P-${shipment.id}-${String(i + 1).padStart(2, '0')}`);

  return ids.map((id, index) => ({
    id,
    packageType: index % 3 === 0 ? 'Box' : index % 3 === 1 ? 'Satchel' : 'Document',
    weightKg: Number((shipment.weightKg / Math.max(ids.length, 1)).toFixed(1)),
    dimensions: shipment.dimensions,
    handling: shipment.priority === 'High-Value' ? 'High-Value' : 'Normal',
    status: isAtHub ? 'Received' : 'Expected',
    currentHub: isAtHub ? shipment.currentLocation : undefined,
    lastScan: shipment.currentLocation,
  }));
};

const parcelIcon = (type: ParcelItem['packageType']) => {
  if (type === 'Document') return FileText;
  if (type === 'Fragile') return ShieldCheck;
  return Box;
};

const hubNameMatches = (value: string | undefined, hubName: string, hubCode: string) => {
  if (!value) return false;
  const text = value.toLowerCase();
  const plainName = hubName.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase();
  return text.includes(plainName) || text.includes(hubCode.toLowerCase()) || text.includes('johor bahru');
};

export const HubShipmentsView: React.FC = () => {
  const {
    shipments,
    hubs,
    hubManifests,
    currentUser,
    selectedShipmentId,
    setSelectedShipmentId,
    setActiveTab,
  } = useLogistics();

  const hub = getAssignedHub(hubs, currentUser);
  const [query, setQuery] = useState('');
  const [activeHubTab, setActiveHubTab] = useState<HubTab>('All');
  const [transportFilter, setTransportFilter] = useState<TransportFilter>('All');

  const localManifests = useMemo(
    () => (hub ? hubManifests.filter((m) => m.hubId === hub.id) : []),
    [hubManifests, hub]
  );

  const isAtCurrentHub = (shipment: Shipment) => {
    if (!hub) return false;
    return shipmentCurrentlyAtHub(shipment, hub) || hubNameMatches(shipment.currentLocation, hub.name, hub.code);
  };

  const getParcelState = (shipment: Shipment, parcel: ParcelItem): ParcelItem['status'] => {
    const relevant = localManifests.filter(
      (m) => m.expectedShipmentIds.includes(shipment.id) || m.expectedParcelIds.includes(parcel.id)
    );

    if (!relevant.length) return parcel.status;

    if (relevant.some((m) => m.receivedParcelIds.includes(parcel.id))) {
      if (shipment.currentLocation.toLowerCase().includes('sorting')) return 'Sorting';
      if (shipment.currentLocation.toLowerCase().includes('outbound')) return 'Ready Outbound';
      if (shipment.currentLocation.toLowerCase().includes('exception')) return 'Hold';
      return 'Received';
    }

    const receivingClosedOrMismatch = relevant.some(
      (m) => m.direction === 'Incoming' && (m.status === 'Mismatch' || m.status === 'Matched')
    );

    return receivingClosedOrMismatch ? 'Missing' : parcel.status;
  };

  const getParcels = (shipment: Shipment) => {
    const base = shipment.parcels?.length
      ? shipment.parcels
      : fallbackParcels(shipment, isAtCurrentHub(shipment));

    return base.map((parcel) => ({ ...parcel, status: getParcelState(shipment, parcel) }));
  };

  const parcelProgress = (shipment: Shipment) => {
    const parcels = getParcels(shipment);
    const received = parcels.filter((p) => ['Received', 'Sorting', 'Ready Outbound', 'Loaded'].includes(p.status)).length;
    const missing = parcels.filter((p) => p.status === 'Missing').length;
    const hold = parcels.filter((p) => p.status === 'Hold').length;
    const sorting = parcels.filter((p) => p.status === 'Sorting').length;
    const ready = parcels.filter((p) => ['Ready Outbound', 'Loaded'].includes(p.status)).length;
    return { total: parcels.length, received, missing, hold, sorting, ready };
  };

  const getManifestState = (shipment: Shipment) => {
    const incomingManifests = localManifests.filter(
      (m) => (m.direction || 'Incoming') === 'Incoming' && m.expectedShipmentIds.includes(shipment.id)
    );
    const outgoingManifests = localManifests.filter(
      (m) => m.direction === 'Outgoing' && m.expectedShipmentIds.includes(shipment.id)
    );

    const shipmentParcelIds = shipment.parcelIds?.length
      ? shipment.parcelIds
      : getParcels(shipment).map((p) => p.id);

    const incomingExpected = new Set(
      incomingManifests.flatMap((m) => m.expectedParcelIds.filter((id) => shipmentParcelIds.includes(id)))
    );
    const incomingReceived = new Set(
      incomingManifests.flatMap((m) => m.receivedParcelIds.filter((id) => incomingExpected.has(id)))
    );

    const outgoingExpected = new Set(
      outgoingManifests.flatMap((m) => m.expectedParcelIds.filter((id) => shipmentParcelIds.includes(id)))
    );
    const outgoingLoaded = new Set(
      outgoingManifests.flatMap((m) => m.receivedParcelIds.filter((id) => outgoingExpected.has(id)))
    );

    const incomingTotal = incomingExpected.size || shipmentParcelIds.length;
    const incomingReceivedCount = incomingReceived.size;
    const incomingPendingWithoutScan = incomingManifests.some(
      (m) => m.status === 'Pending' && m.receivedParcelIds.filter((id) => incomingExpected.has(id)).length === 0
    );
    const incomingClosedWithMissing = incomingManifests.some(
      (m) => (m.status === 'Mismatch' || m.status === 'Matched') && incomingReceivedCount < incomingTotal
    );
    const incomingComplete = incomingManifests.length > 0 && incomingTotal > 0 && incomingReceivedCount >= incomingTotal;

    const outgoingTotal = outgoingExpected.size;
    const outgoingLoadedCount = outgoingLoaded.size;
    const outgoingComplete = outgoingManifests.some((m) => m.status === 'Matched');
    const readyForDispatch = outgoingManifests.length > 0 && !outgoingComplete && outgoingTotal > 0 && outgoingLoadedCount >= outgoingTotal;

    return {
      incomingManifests,
      outgoingManifests,
      incomingTotal,
      incomingReceivedCount,
      incomingPendingWithoutScan,
      incomingClosedWithMissing,
      incomingComplete,
      outgoingTotal,
      outgoingLoadedCount,
      outgoingComplete,
      readyForDispatch,
    };
  };

  const getLifecycle = (shipment: Shipment): HubLifecycle => {
    if (!hub) return 'At Hub';

    const progress = parcelProgress(shipment);
    const manifestState = getManifestState(shipment);
    const location = shipment.currentLocation.toLowerCase();

    const hasException =
      manifestState.incomingClosedWithMissing ||
      progress.missing > 0 ||
      progress.hold > 0 ||
      shipment.status === 'Security Review' ||
      Boolean(shipment.hasSecurityAlert) ||
      location.includes('exception') ||
      location.includes('wrong hub') ||
      location.includes('mismatch');

    if (hasException) return 'Exception';
    if (manifestState.outgoingComplete) return 'Dispatched';
    if (manifestState.readyForDispatch) return 'Ready for Dispatch';

    // The shipment is still on an incoming load and this hub has not scanned any of its parcels yet.
    if (manifestState.incomingManifests.length > 0 && manifestState.incomingReceivedCount === 0) {
      return 'Incoming';
    }

    // Once at least one parcel is scanned by this hub, the shipment is handled as an at-hub shipment.
    if (manifestState.incomingManifests.length > 0 && manifestState.incomingReceivedCount > 0) {
      return 'At Hub';
    }

    // Origin-hub shipments may enter the system directly at this hub without an incoming linehaul manifest.
    if (isAtCurrentHub(shipment)) {
      if (location.includes('outbound') || (progress.total > 0 && progress.ready === progress.total)) {
        return 'Ready for Dispatch';
      }
      return 'At Hub';
    }

    const startsFromThisHub = hubNameMatches(shipment.originHub, hub.name, hub.code);
    if (startsFromThisHub && manifestState.outgoingManifests.length > 0) {
      return manifestState.outgoingComplete ? 'Dispatched' : 'Ready for Dispatch';
    }

    return 'Incoming';
  };

  const getAtHubProcess = (shipment: Shipment) => {
    const progress = parcelProgress(shipment);
    const location = shipment.currentLocation.toLowerCase();

    if (progress.missing > 0 || progress.hold > 0) return 'Exception Review';
    if (location.includes('sorting') || progress.sorting > 0) return 'Sorting';
    if (progress.received > 0 && progress.received < progress.total) return 'Receiving';
    if (progress.received === progress.total && progress.total > 0) return 'Received';
    return 'Receiving';
  };

  const localShipments = useMemo(() => {
    if (!hub) return [];
    const manifestShipmentIds = new Set(localManifests.flatMap((m) => m.expectedShipmentIds));
    return shipments.filter((s) => shipmentTouchesHub(s, hub) || manifestShipmentIds.has(s.id));
  }, [shipments, hub]);

  const lifecycleCounts = useMemo(() => {
    const counts: Record<HubTab, number> = {
      All: localShipments.length,
      Incoming: 0,
      'At Hub': 0,
      'Ready for Dispatch': 0,
      Dispatched: 0,
      Exception: 0,
    };

    localShipments.forEach((shipment) => {
      counts[getLifecycle(shipment)] += 1;
    });

    return counts;
  }, [localShipments, localManifests]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return localShipments.filter((shipment) => {
      const lifecycle = getLifecycle(shipment);
      const matchesTab = activeHubTab === 'All' || lifecycle === activeHubTab;
      const matchesTransport = transportFilter === 'All' || shipment.vehicleType === transportFilter;
      const matchesQuery = !normalized || `${shipment.id} ${shipment.currentLocation} ${shipment.assignedVehicleOrTrain} ${shipment.originHub} ${shipment.destinationHub}`
        .toLowerCase()
        .includes(normalized);

      return matchesTab && matchesTransport && matchesQuery;
    });
  }, [localShipments, activeHubTab, transportFilter, query, localManifests]);

  const selected = visible.find((s) => s.id === selectedShipmentId) || visible[0];

  if (!hub) {
    return <div className="p-6 text-rose-300 text-sm">Assigned hub could not be resolved.</div>;
  }

  const selectedParcels = selected ? getParcels(selected) : [];
  const selectedProgress = selected ? parcelProgress(selected) : { total: 0, received: 0, missing: 0, hold: 0, sorting: 0, ready: 0 };
  const selectedManifestState = selected ? getManifestState(selected) : null;
  const selectedLifecycle = selected ? getLifecycle(selected) : null;
  const selectedAtHubProcess = selected && selectedLifecycle === 'At Hub' ? getAtHubProcess(selected) : null;

  const tabConfig: { key: HubTab; label: string }[] = [
    { key: 'All', label: 'All' },
    { key: 'Incoming', label: 'Incoming' },
    { key: 'At Hub', label: 'At Hub' },
    { key: 'Ready for Dispatch', label: 'Ready for Dispatch' },
    { key: 'Dispatched', label: 'Dispatched' },
    { key: 'Exception', label: 'Exception' },
  ];

  const lifecycleClasses: Record<HubLifecycle, string> = {
    Incoming: 'text-sky-700 border-sky-300 bg-sky-100',
    'At Hub': 'text-cyan-300 border-cyan-800/60 bg-cyan-950/35',
    'Ready for Dispatch': 'text-violet-700 border-violet-300 bg-violet-100',
    Dispatched: 'text-emerald-300 border-emerald-800/60 bg-emerald-950/35',
    Exception: 'text-rose-300 border-rose-800/60 bg-rose-950/35',
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white">My Hub Shipments</h1>
          <p className="text-xs text-slate-400 mt-1">
            {hub.name} · Shipments entering, handled at, or leaving this hub
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          {localShipments.length} shipment(s) today
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto border-b border-slate-800">
          <div className="flex min-w-max px-2 pt-2">
            {tabConfig.map((tab) => {
              const active = activeHubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveHubTab(tab.key)}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                    active
                      ? 'text-cyan-300 border-cyan-400 bg-cyan-950/20'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-cyan-900/50 text-cyan-200' : 'bg-slate-800 text-slate-500'}`}>
                    {lifecycleCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shipment ID, service or route"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-cyan-500"
            />
          </div>

          <div className="relative md:w-48">
            <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={transportFilter}
              onChange={(e) => setTransportFilter(e.target.value as TransportFilter)}
              className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-cyan-500"
            >
              <option value="All">All transport</option>
              <option value="Train">Train</option>
              <option value="Truck">Truck</option>
              <option value="Intermodal">Intermodal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-100">Shipment List</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Status is relative to this hub</div>
            </div>
            <span className="text-[10px] text-slate-500">{visible.length} shown</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[720px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">No shipments match this view.</div>
            ) : visible.map((shipment) => {
              const progress = parcelProgress(shipment);
              const lifecycle = getLifecycle(shipment);
              const process = lifecycle === 'At Hub' ? getAtHubProcess(shipment) : null;
              const manifestState = getManifestState(shipment);
              const receivedAtHub = manifestState.incomingManifests.length > 0
                ? manifestState.incomingReceivedCount
                : progress.received;
              const receivedTotal = manifestState.incomingManifests.length > 0
                ? manifestState.incomingTotal
                : progress.total;
              const receivedLabel = `${receivedAtHub}/${receivedTotal} received at hub`;

              return (
                <button
                  key={shipment.id}
                  onClick={() => setSelectedShipmentId(shipment.id)}
                  className={`w-full p-4 text-left hover:bg-slate-800/55 transition-colors ${
                    selected?.id === shipment.id
                      ? 'bg-cyan-950/20 border-l-2 border-cyan-400'
                      : 'border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300">{shipment.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${lifecycleClasses[lifecycle]}`}>
                          {lifecycle}
                        </span>
                        {process && (
                          <span className="text-[10px] text-slate-400 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800">
                            {process}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-2 truncate">
                        {shipment.originHub} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-600" /> {shipment.destinationHub}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-[10px] text-slate-500">{lifecycle === 'Incoming' ? 'ETA' : lifecycle === 'Dispatched' ? 'Departure / ETA' : 'Service'}</div>
                      <div className="text-[11px] font-semibold text-slate-200 mt-0.5">
                        {lifecycle === 'Incoming' ? shipment.eta : shipment.assignedVehicleOrTrain}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                    <div className="px-2.5 py-2 rounded-xl bg-slate-950/75 border border-slate-800 text-slate-300">
                      <Package className="inline w-3 h-3 mr-1.5 text-cyan-400" />
                      {progress.total} parcels
                    </div>
                    <div className="px-2.5 py-2 rounded-xl bg-slate-950/75 border border-slate-800 text-slate-300">
                      <CheckCircle2 className="inline w-3 h-3 mr-1.5 text-emerald-400" />
                      {receivedLabel}
                    </div>
                    <div className="px-2.5 py-2 rounded-xl bg-slate-950/75 border border-slate-800 text-slate-300">
                      {shipment.vehicleType === 'Train' ? <Train className="inline w-3 h-3 mr-1.5 text-violet-400" /> : <Truck className="inline w-3 h-3 mr-1.5 text-violet-400" />}
                      {shipment.assignedVehicleOrTrain}
                    </div>
                  </div>

                  {(progress.missing > 0 || progress.hold > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {progress.missing > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-rose-950/35 border border-rose-900/50 text-rose-300">
                          {progress.missing} missing
                        </span>
                      )}
                      {progress.hold > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-amber-950/35 border border-amber-900/50 text-amber-300">
                          {progress.hold} on hold
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase text-slate-500">Shipment</span>
                  <div className="text-lg font-extrabold text-white font-mono">{selected.id}</div>
                  {selectedLifecycle && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${lifecycleClasses[selectedLifecycle]}`}>
                        {selectedLifecycle}
                      </span>
                      {selectedAtHubProcess && (
                        <span className="text-[10px] text-slate-400 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800">
                          {selectedAtHubProcess}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Received by this hub</div>
                  <div className={`text-sm font-extrabold ${selectedProgress.missing ? 'text-rose-300' : selectedLifecycle === 'Incoming' ? 'text-sky-700' : 'text-emerald-300'}`}>
                    {selectedManifestState?.incomingManifests.length
                      ? `${selectedManifestState.incomingReceivedCount}/${selectedManifestState.incomingTotal}`
                      : `${selectedProgress.received}/${selectedProgress.total}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500">Current Location</span>
                  <div className="mt-1 text-slate-200 flex gap-1.5 leading-relaxed">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-cyan-400" />
                    {selected.currentLocation}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500">Transport</span>
                  <div className="mt-1 text-slate-200 flex gap-1.5">
                    {selected.vehicleType === 'Train' ? <Train className="w-3 h-3 text-cyan-400" /> : <Truck className="w-3 h-3 text-cyan-400" />}
                    {selected.assignedVehicleOrTrain}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500">Origin Hub</span>
                  <div className="mt-1 text-slate-200 leading-relaxed">{selected.originHub}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500">Destination Hub</span>
                  <div className="mt-1 text-slate-200 leading-relaxed">{selected.destinationHub}</div>
                </div>
              </div>

              {selectedLifecycle === 'Incoming' && (
                <div className="p-3 rounded-xl border border-sky-300 bg-sky-50 flex items-start gap-2.5">
                  <Clock3 className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-sky-800">Incoming to this hub</div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      These parcels are expected but have not been received or scanned by this hub yet. ETA {selected.eta}.
                    </div>
                  </div>
                </div>
              )}

              {selectedLifecycle === 'Dispatched' && (
                <div className="p-3 rounded-xl border border-emerald-900/50 bg-emerald-950/25 flex items-start gap-2.5">
                  <Send className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-200">Completed at this hub</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Hub processing is complete and the shipment has left this hub for the next movement.
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-3 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Parcel Contents</div>
                    <div className="text-[10px] text-slate-500">Individual parcels inside this shipment</div>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded-lg">{selectedParcels.length} parcel(s)</div>
                </div>

                <div className="divide-y divide-slate-800 max-h-[350px] overflow-y-auto">
                  {selectedParcels.map((parcel) => {
                    const Icon = parcelIcon(parcel.packageType);
                    const displayStatus = selectedLifecycle === 'Incoming' ? 'Expected' : parcel.status;
                    const missing = displayStatus === 'Missing';
                    const hold = displayStatus === 'Hold';
                    const expected = displayStatus === 'Expected';

                    return (
                      <div key={parcel.id} className={`p-3 ${missing ? 'bg-rose-950/15' : hold ? 'bg-amber-950/10' : 'bg-slate-950/30'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-2 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              missing
                                ? 'bg-rose-950/50 text-rose-300'
                                : hold
                                  ? 'bg-amber-950/50 text-amber-300'
                                  : expected
                                    ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                    : 'bg-cyan-950/40 text-cyan-300'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] font-bold text-slate-100">{parcel.id}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {parcel.packageType} · {parcel.weightKg} kg · {parcel.dimensions}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Handling: {parcel.handling}</div>
                            </div>
                          </div>

                          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border ${
                            missing
                              ? 'text-rose-300 border-rose-900/50 bg-rose-950/30'
                              : hold
                                ? 'text-amber-300 border-amber-900/50 bg-amber-950/30'
                                : expected
                                  ? 'text-sky-700 border-sky-300 bg-sky-100'
                                  : 'text-emerald-300 border-emerald-900/50 bg-emerald-950/30'
                          }`}>
                            {missing ? <AlertTriangle className="inline w-3 h-3 mr-1" /> : expected ? <Clock3 className="inline w-3 h-3 mr-1" /> : <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                            {displayStatus}
                          </span>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 truncate">
                          {expected ? `Expected at ${hub.name}` : `Last scan: ${parcel.lastScan || selected.currentLocation}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('hub-ops')}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
              >
                Open Hub Operations <ArrowRight className="inline w-3 h-3 ml-1" />
              </button>
            </div>
          ) : (
            <div className="min-h-[320px] flex items-center justify-center text-xs text-slate-500">
              No shipment selected in this view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
