import React, { useEffect, useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { getAssignedHub } from '../utils/hubScope';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Layers,
  MapPin,
  PackageSearch,
  ScanLine,
  ShieldCheck,
  Train,
  Truck,
  Upload,
} from 'lucide-react';

const shipmentIdFromParcelId = (parcelId: string) => {
  const match = parcelId.match(/^P-(MY\d+)-/);
  return match?.[1] || parcelId.replace(/^P-/, '').replace(/-\d+$/, '');
};

export const HubOperationsView: React.FC = () => {
  const {
    currentUser,
    hubs,
    hubManifests,
    handoffs,
    shipments,
    incidents,
    verifyHandoffAction,
    reportManifestReceipt,
    completeManifestReceiving,
    markManifestReadyForDispatch,
    markManifestDeparted,
    addIncident,
  } = useLogistics();

  const hub = getAssignedHub(hubs, currentUser);
  const [transportFilter, setTransportFilter] = useState('ALL');
  const [operationalFilter, setOperationalFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [exceptionFilter, setExceptionFilter] = useState('ALL');
  const [receivingManifestId, setReceivingManifestId] = useState('');
  const [scanParcel, setScanParcel] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const show = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? null : current)), 4500);
  };

  useEffect(() => {
    const focus = sessionStorage.getItem('hubOpsFocus');
    if (!focus) return;
    sessionStorage.removeItem('hubOpsFocus');
    requestAnimationFrame(() =>
      document.getElementById(`hub-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  }, []);

  if (!hub) {
    return <div className="p-6 text-sm text-rose-600">Assigned hub could not be resolved.</div>;
  }

  const incomingAll = hubManifests.filter(
    (manifest) => manifest.hubId === hub.id && (manifest.direction || 'Incoming') === 'Incoming'
  );
  const outgoingAll = hubManifests.filter(
    (manifest) => manifest.hubId === hub.id && manifest.direction === 'Outgoing'
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const manifestMatchesSearch = (manifest: typeof hubManifests[number]) => {
    if (!normalizedSearch) return true;
    return [
      manifest.serviceId,
      manifest.originName,
      manifest.destinationName,
      ...(manifest.expectedShipmentIds || []),
      ...(manifest.expectedParcelIds || []),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  };

  const manifestHasException = (manifest: typeof hubManifests[number]) => {
    if (manifest.hubStatus !== 'Received') return false;
    const missing = manifest.expectedParcelIds.some((id) => !manifest.receivedParcelIds.includes(id));
    const unexpected = manifest.receivedParcelIds.some((id) => !manifest.expectedParcelIds.includes(id));
    return missing || unexpected || manifest.status === 'Mismatch';
  };

  const manifestMatchesOperationalFilter = (manifest: typeof hubManifests[number]) => {
    if (operationalFilter === 'ALL') return true;
    if (operationalFilter === 'NEEDS_ACTION') {
      return ['Arrived', 'Receiving', 'Preparing Dispatch', 'Ready for Dispatch'].includes(manifest.hubStatus || '') || manifestHasException(manifest);
    }
    if (operationalFilter === 'IN_PROGRESS') {
      return ['In Transit', 'Arrived', 'Receiving', 'Preparing Dispatch', 'Ready for Dispatch'].includes(manifest.hubStatus || '');
    }
    if (operationalFilter === 'COMPLETED') {
      return ['Received', 'Departed'].includes(manifest.hubStatus || '') && !manifestHasException(manifest);
    }
    if (operationalFilter === 'EXCEPTION') return manifestHasException(manifest);
    return true;
  };

  const incomingManifests = incomingAll
    .filter((manifest) => transportFilter === 'ALL' || manifest.transportType === transportFilter)
    .filter(manifestMatchesSearch)
    .filter(manifestMatchesOperationalFilter);
  const outgoingManifests = outgoingAll
    .filter((manifest) => transportFilter === 'ALL' || manifest.transportType === transportFilter)
    .filter(manifestMatchesSearch)
    .filter(manifestMatchesOperationalFilter);

  const inTransitLoads = incomingAll.filter((manifest) => manifest.hubStatus === 'In Transit');
  const receivingLoadsAll = incomingAll.filter(
    (manifest) => manifest.hubStatus === 'Arrived' || manifest.hubStatus === 'Receiving'
  );
  const receivingLoads = receivingLoadsAll
    .filter((manifest) => transportFilter === 'ALL' || manifest.transportType === transportFilter)
    .filter(manifestMatchesSearch)
    .filter(manifestMatchesOperationalFilter);
  const completedReceivingLoads = incomingAll.filter((manifest) => manifest.hubStatus === 'Received');

  const handoffMatchesOperationalFilter = (handoff: typeof handoffs[number]) => {
    if (operationalFilter === 'ALL') return true;
    if (operationalFilter === 'NEEDS_ACTION' || operationalFilter === 'EXCEPTION') return handoff.status !== 'VERIFIED';
    if (operationalFilter === 'IN_PROGRESS') return handoff.status !== 'VERIFIED';
    if (operationalFilter === 'COMPLETED') return handoff.status === 'VERIFIED';
    return true;
  };

  const localHandoffs = handoffs
    .filter((handoff) => handoff.hubId === hub.id)
    .filter((handoff) => transportFilter === 'ALL' || handoff.transportType === transportFilter)
    .filter((handoff) => statusFilter === 'ALL' || handoff.status === statusFilter)
    .filter((handoff) => !normalizedSearch || [handoff.id, handoff.parcelId, handoff.fromParty, handoff.toParty].some((value) => String(value || '').toLowerCase().includes(normalizedSearch)))
    .filter(handoffMatchesOperationalFilter);

  const selectedReceivingManifest = receivingLoads.find((manifest) => manifest.id === receivingManifestId);

  useEffect(() => {
    if (!receivingManifestId && receivingLoads.length > 0) {
      setReceivingManifestId(receivingLoads[0].id);
    } else if (receivingManifestId && !receivingLoads.some((manifest) => manifest.id === receivingManifestId)) {
      setReceivingManifestId(receivingLoads[0]?.id || '');
    }
  }, [receivingManifestId, receivingLoads]);

  const allParcelOptions = useMemo(
    () =>
      shipments.flatMap((shipment) =>
        (shipment.parcelIds || [`P-${shipment.id}-01`]).map((parcelId) => ({ parcelId, shipment }))
      ),
    [shipments]
  );

  const confirmedMissing = completedReceivingLoads.flatMap((manifest) =>
    manifest.expectedParcelIds.filter((id) => !manifest.receivedParcelIds.includes(id))
  );
  const confirmedUnexpected = completedReceivingLoads.flatMap((manifest) =>
    manifest.receivedParcelIds.filter((id) => !manifest.expectedParcelIds.includes(id))
  );
  const reviewCount = handoffs.filter((handoff) => handoff.hubId === hub.id && handoff.status !== 'VERIFIED').length;
  const wrongHubCount = incidents.filter(
    (incident) => incident.affectedHubId === hub.id && incident.type === 'Wrong Hub' && incident.status !== 'Resolved'
  ).length;

  const handleScan = () => {
    if (!selectedReceivingManifest) {
      show('Select a load that has arrived at the hub.');
      return;
    }
    const option = allParcelOptions.find((item) => item.parcelId === scanParcel);
    if (!option) {
      show('Select a parcel to scan.');
      return;
    }

    const { parcelId, shipment } = option;
    const isExpectedHere = selectedReceivingManifest.expectedParcelIds.includes(parcelId);
    if (isExpectedHere) {
      reportManifestReceipt(selectedReceivingManifest.id, parcelId);
      show(`${parcelId} scanned under ${selectedReceivingManifest.serviceId}.`);
      return;
    }

    const plannedOtherLoad = incomingAll.find((manifest) => manifest.expectedParcelIds.includes(parcelId));
    if (plannedOtherLoad) {
      addIncident({
        type: 'Invalid Scan',
        location: hub.name,
        severity: 'Medium',
        shipmentId: shipment.id,
        affectedHubId: hub.id,
        affectedServiceId: selectedReceivingManifest.serviceId,
        transportType: selectedReceivingManifest.transportType,
        details: `${parcelId} was scanned under ${selectedReceivingManifest.serviceId}, but the parcel is planned under ${plannedOtherLoad.serviceId}. Parcel was not accepted into the selected load.`,
      });
      show(`${parcelId} belongs to ${plannedOtherLoad.serviceId}, not ${selectedReceivingManifest.serviceId}.`);
      return;
    }

    // Keep the physical scan in the selected receiving load so reconciliation can show it as unexpected.
    reportManifestReceipt(selectedReceivingManifest.id, parcelId);
    addIncident({
      type: 'Wrong Hub',
      location: hub.name,
      severity: 'High',
      shipmentId: shipment.id,
      affectedHubId: hub.id,
      affectedServiceId: selectedReceivingManifest.serviceId,
      transportType: selectedReceivingManifest.transportType,
      details: `${parcelId} was physically scanned at ${hub.name} under ${selectedReceivingManifest.serviceId}, but it is not listed in any planned incoming manifest for this hub. Parcel placed on hold for route verification.`,
    });
    show(`Unexpected parcel detected. ${parcelId} placed on hold for route verification.`);
  };

  const requestRescan = (handoffId: string, shipmentId: string, parcelId: string, critical = false) => {
    addIncident({
      type: 'Invalid Scan',
      location: hub.name,
      severity: critical ? 'High' : 'Medium',
      shipmentId,
      affectedHubId: hub.id,
      details: `${parcelId} custody record ${handoffId} requires a fresh identity / parcel / location scan before custody can be accepted.`,
    });
    show(`${parcelId} re-scan requested.`);
  };

  const preparingOutgoing = outgoingAll.filter((manifest) => manifest.hubStatus === 'Preparing Dispatch');
  const outgoingShipmentIds = new Set(outgoingAll.flatMap((manifest) => manifest.expectedShipmentIds));
  const receivedShipmentIds = new Set(completedReceivingLoads.flatMap((manifest) => manifest.expectedShipmentIds));
  const unassignedReceived = shipments.filter(
    (shipment) => receivedShipmentIds.has(shipment.id) && !outgoingShipmentIds.has(shipment.id)
  );

  const visiblePreparingOutgoing = preparingOutgoing
    .filter((manifest) => transportFilter === 'ALL' || manifest.transportType === transportFilter)
    .filter(manifestMatchesSearch)
    .filter(manifestMatchesOperationalFilter);

  const sortingItems = visiblePreparingOutgoing.flatMap((manifest) =>
    manifest.expectedShipmentIds.map((shipmentId) => {
      const shipment = shipments.find((item) => item.id === shipmentId);
      const parcelIds = shipment?.parcelIds || manifest.expectedParcelIds.filter((id) => id.includes(shipmentId));
      const loaded = parcelIds.filter((id) => manifest.receivedParcelIds.includes(id)).length;
      return { manifest, shipment, shipmentId, parcelCount: parcelIds.length, loaded };
    })
  );

  const visibleUnassignedReceived = unassignedReceived.filter((shipment) => {
    if (operationalFilter === 'COMPLETED' || operationalFilter === 'EXCEPTION') return false;
    if (!normalizedSearch) return true;
    return [shipment.id, shipment.origin, shipment.destination, ...(shipment.parcelIds || [])].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  });

  const statusChip = (status?: string) => {
    if (status === 'In Transit') return 'bg-sky-100 text-sky-700 border-sky-200';
    if (status === 'Arrived' || status === 'Receiving') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'Received') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Preparing Dispatch') return 'bg-violet-100 text-violet-700 border-violet-200';
    if (status === 'Ready for Dispatch') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (status === 'Departed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-extrabold text-slate-900">Hub Operations</h1>
          </div>
          <div className="text-sm text-slate-600 mt-1">{hub.name}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-sky-50 border border-sky-100 px-3 py-2">
            <div className="text-[10px] text-slate-500">In Transit</div>
            <b className="text-sky-700">{inTransitLoads.length} loads</b>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
            <div className="text-[10px] text-slate-500">Receiving</div>
            <b className="text-amber-700">{receivingLoads.length} loads</b>
          </div>
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2">
            <div className="text-[10px] text-slate-500">Confirmed Missing</div>
            <b className="text-rose-700">{confirmedMissing.length}</b>
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
            <div className="text-[10px] text-slate-500">Handoff Review</div>
            <b className="text-violet-700">{reviewCount}</b>
          </div>
        </div>
      </div>

      {notice && <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-800">{notice}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            ['ALL', 'All'],
            ['NEEDS_ACTION', 'Needs Action'],
            ['IN_PROGRESS', 'In Progress'],
            ['COMPLETED', 'Completed'],
            ['EXCEPTION', 'Exception'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setOperationalFilter(value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                operationalFilter === value
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search load, shipment or parcel ID"
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-cyan-400"
          />
          <select value={transportFilter} onChange={(event) => setTransportFilter(event.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
            <option value="ALL">All Transport</option>
            <option>Truck</option>
            <option>Train</option>
            <option>Intermodal</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
            <option value="ALL">All Handoff Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="REQUIRES REVIEW">Requires Review</option>
            <option value="FLAGGED">Flagged</option>
          </select>
        </div>
      </div>

      <section id="hub-incoming" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-bold text-slate-900">Incoming Manifests</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {incomingManifests.map((manifest) => {
            const expectedReceived = manifest.expectedParcelIds.filter((id) => manifest.receivedParcelIds.includes(id)).length;
            return (
              <div key={manifest.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      {manifest.transportType === 'Train' ? <Train className="w-4 h-4 text-cyan-600" /> : <Truck className="w-4 h-4 text-cyan-600" />}
                      {manifest.serviceId}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">{manifest.originName}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
                      <span className="flex gap-1"><Clock3 className="w-3 h-3" />{manifest.scheduledTime}</span>
                      <span className="flex gap-1"><MapPin className="w-3 h-3" />{manifest.dock}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-bold ${statusChip(manifest.hubStatus)}`}>{manifest.hubStatus || 'Scheduled'}</span>
                    <div className="text-[10px] text-slate-500 mt-2">
                      {manifest.hubStatus === 'In Transit'
                        ? `${manifest.expectedShipmentIds.length} shipments · ${manifest.expectedParcelIds.length} parcels expected`
                        : `${expectedReceived}/${manifest.expectedParcelIds.length} expected parcels scanned`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {incomingManifests.length === 0 && <div className="text-xs text-slate-500 py-4 lg:col-span-2">No incoming loads match the selected filters.</div>}
        </div>
      </section>

      <section id="hub-receiving" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-bold text-slate-900">Receiving & Scan</h2>
        </div>
        {receivingLoads.length === 0 ? (
          <div className="text-xs text-slate-500 py-4">No arrived loads are waiting for receiving.</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select value={receivingManifestId} onChange={(event) => { setReceivingManifestId(event.target.value); setScanParcel(''); }} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700">
                {receivingLoads.map((manifest) => <option key={manifest.id} value={manifest.id}>{manifest.serviceId} — {manifest.originName}</option>)}
              </select>
              <select value={scanParcel} onChange={(event) => setScanParcel(event.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700">
                <option value="">Select parcel</option>
                {allParcelOptions.map((option) => <option key={option.parcelId} value={option.parcelId}>{option.parcelId} — {option.shipment.id}</option>)}
              </select>
            </div>
            {selectedReceivingManifest && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-xs text-slate-600">
                  <b className="text-slate-900">{selectedReceivingManifest.serviceId}</b> · {selectedReceivingManifest.receivedParcelIds.length}/{selectedReceivingManifest.expectedParcelIds.length} scans recorded
                </div>
                <div className="flex gap-2">
                  <button onClick={handleScan} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold">Scan Parcel</button>
                  <button onClick={() => completeManifestReceiving(selectedReceivingManifest.id)} className="px-4 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold">Complete Receiving</button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section id="hub-reconciliation" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <PackageSearch className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-bold text-slate-900">Manifest Reconciliation</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {incomingManifests.filter((manifest) => manifest.hubStatus !== 'In Transit').map((manifest) => {
            const expectedReceived = manifest.expectedParcelIds.filter((id) => manifest.receivedParcelIds.includes(id));
            const missing = manifest.expectedParcelIds.filter((id) => !manifest.receivedParcelIds.includes(id));
            const unexpected = manifest.receivedParcelIds.filter((id) => !manifest.expectedParcelIds.includes(id));
            const receivingComplete = manifest.hubStatus === 'Received';
            return (
              <div key={manifest.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-slate-900">{manifest.serviceId}</div>
                  <span className={`text-[10px] font-bold ${!receivingComplete ? 'text-amber-700' : missing.length || unexpected.length ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {!receivingComplete ? 'RECEIVING IN PROGRESS' : missing.length || unexpected.length ? 'MISMATCH' : 'MATCHED'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-100"><div className="text-[9px] text-slate-500">Expected</div><b>{manifest.expectedParcelIds.length}</b></div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100"><div className="text-[9px] text-slate-500">Expected Scanned</div><b>{expectedReceived.length}</b></div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100"><div className="text-[9px] text-slate-500">Missing</div><b className={receivingComplete && missing.length ? 'text-rose-700' : 'text-slate-700'}>{receivingComplete ? missing.length : '—'}</b></div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100"><div className="text-[9px] text-slate-500">Unexpected</div><b className={receivingComplete && unexpected.length ? 'text-rose-700' : 'text-slate-700'}>{receivingComplete ? unexpected.length : '—'}</b></div>
                </div>
                {!receivingComplete && <div className="mt-3 text-[11px] text-slate-500">Missing parcels are only confirmed after receiving is completed.</div>}
                {receivingComplete && missing.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] text-rose-700 break-words">Missing: {missing.join(', ')}</div>
                    <button onClick={() => {
                      const parcelId = missing[0];
                      const shipmentId = parcelId.replace(/^P-/, '').replace(/-\d+$/, '');
                      addIncident({
                        type: 'Missing Parcel',
                        location: hub.name,
                        severity: 'High',
                        affectedHubId: hub.id,
                        affectedServiceId: manifest.serviceId,
                        shipmentId,
                        transportType: manifest.transportType,
                        details: `Manifest ${manifest.serviceId}: receiving completed with ${missing.length} confirmed missing parcel(s). ${missing.join(', ')}.`,
                      });
                      show(`Missing parcel incident created for ${manifest.serviceId}.`);
                    }} className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold">Report Missing Parcel</button>
                  </div>
                )}
                {receivingComplete && unexpected.length > 0 && <div className="mt-2 text-[11px] text-amber-700 break-words">Unexpected: {unexpected.join(', ')}</div>}
              </div>
            );
          })}
          {incomingManifests.filter((manifest) => manifest.hubStatus !== 'In Transit').length === 0 && <div className="text-xs text-slate-500 py-4 lg:col-span-2">No reconciliation records match the selected filters.</div>}
        </div>
      </section>

      <section id="hub-exceptions" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Receiving Exceptions</h2>
          </div>
          <select value={exceptionFilter} onChange={(event) => setExceptionFilter(event.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
            <option value="ALL">All Exception Types</option>
            <option value="MISSING">Missing</option>
            <option value="UNEXPECTED">Unexpected</option>
            <option value="WRONG_HUB">Wrong Hub</option>
            <option value="HANDOFF">Handoff Review</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(exceptionFilter === 'ALL' || exceptionFilter === 'MISSING') && <div className="p-3 rounded-xl border border-rose-200 bg-rose-50"><div className="text-[10px] text-slate-500">Confirmed Missing</div><div className="text-xl font-bold text-rose-700">{confirmedMissing.length}</div></div>}
          {(exceptionFilter === 'ALL' || exceptionFilter === 'UNEXPECTED') && <div className="p-3 rounded-xl border border-amber-200 bg-amber-50"><div className="text-[10px] text-slate-500">Unexpected</div><div className="text-xl font-bold text-amber-700">{confirmedUnexpected.length}</div></div>}
          {(exceptionFilter === 'ALL' || exceptionFilter === 'WRONG_HUB') && <div className="p-3 rounded-xl border border-orange-200 bg-orange-50"><div className="text-[10px] text-slate-500">Wrong Hub</div><div className="text-xl font-bold text-orange-700">{wrongHubCount}</div></div>}
          {(exceptionFilter === 'ALL' || exceptionFilter === 'HANDOFF') && <div className="p-3 rounded-xl border border-violet-200 bg-violet-50"><div className="text-[10px] text-slate-500">Handoff Review</div><div className="text-xl font-bold text-violet-700">{reviewCount}</div></div>}
        </div>
      </section>

      <section id="hub-custody" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Custody Verification</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {localHandoffs.map((handoff) => (
            <div key={handoff.id} className={`p-4 rounded-xl border bg-slate-50/60 ${handoff.status === 'FLAGGED' ? 'border-rose-300' : handoff.status === 'REQUIRES REVIEW' ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className="flex justify-between gap-2">
                <div><div className="font-mono font-bold text-cyan-700">{handoff.parcelId}</div><div className="text-[11px] text-slate-600 mt-1">{handoff.fromParty} → {handoff.toParty}</div></div>
                <span className={`text-[10px] font-bold ${handoff.status === 'VERIFIED' ? 'text-emerald-700' : handoff.status === 'FLAGGED' ? 'text-rose-700' : 'text-amber-700'}`}>{handoff.status}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 mt-3 text-center text-[10px] text-slate-600">
                <div>ID {handoff.checks.identity ? '✓' : '✕'}</div><div>Parcel {handoff.checks.parcelId ? '✓' : '✕'}</div><div>Geo {handoff.checks.location ? '✓' : '✕'}</div><div>Time {handoff.checks.timestamp ? '✓' : '✕'}</div><div>Seq {handoff.checks.sequence ? '✓' : '✕'}</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500">Score <b className="text-slate-700">{handoff.trustScore}%</b></span>
                {handoff.status === 'REQUIRES REVIEW' && (
                  <div className="flex gap-2">
                    <button onClick={() => requestRescan(handoff.id, shipmentIdFromParcelId(handoff.parcelId), handoff.parcelId)} className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 font-bold">Request Re-scan</button>
                    <button onClick={() => { verifyHandoffAction(handoff.id); show(`${handoff.parcelId} custody accepted after review.`); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Review & Accept</button>
                  </div>
                )}
                {handoff.status === 'FLAGGED' && (
                  <div className="flex gap-2">
                    <button onClick={() => requestRescan(handoff.id, shipmentIdFromParcelId(handoff.parcelId), handoff.parcelId)} className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 font-bold">Request Re-scan</button>
                    <button onClick={() => requestRescan(handoff.id, shipmentIdFromParcelId(handoff.parcelId), handoff.parcelId, true)} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold">Escalate</button>
                  </div>
                )}
                {handoff.status === 'VERIFIED' && <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Custody accepted</span>}
              </div>
            </div>
          ))}
          {localHandoffs.length === 0 && <div className="text-xs text-slate-500 py-4 lg:col-span-2">No custody records match the selected filters.</div>}
        </div>
      </section>

      <section id="hub-sorting" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Layers className="w-4 h-4 text-violet-600" /><h2 className="text-sm font-bold text-slate-900">Sorting & Outbound Preparation</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sortingItems.map(({ manifest, shipment, shipmentId, parcelCount, loaded }) => (
            <div key={`${manifest.id}-${shipmentId}`} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="font-mono font-bold text-cyan-700">{shipmentId}</div>
              <div className="text-[11px] text-slate-700 mt-1">{parcelCount} parcels · {loaded}/{parcelCount} loaded</div>
              <div className="text-[10px] text-slate-500 mt-1">Next load: {manifest.serviceId}</div>
              <div className="text-[10px] text-slate-500">Next stop: {manifest.destinationName}</div>
              {shipment && <div className="text-[10px] text-slate-500 mt-1">Final destination: {shipment.destination}</div>}
            </div>
          ))}
          {visibleUnassignedReceived.map((shipment) => (
            <div key={shipment.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50">
              <div className="font-mono font-bold text-amber-800">{shipment.id}</div>
              <div className="text-[11px] text-slate-700 mt-1">{shipment.parcelCount || shipment.parcelIds?.length || 1} parcels</div>
              <div className="text-[10px] text-amber-700 mt-1">Awaiting outbound load assignment</div>
            </div>
          ))}
          {sortingItems.length === 0 && visibleUnassignedReceived.length === 0 && <div className="text-xs text-slate-500 py-4">No shipments are waiting for sorting or outbound preparation.</div>}
        </div>
      </section>

      <section id="hub-outgoing" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Upload className="w-4 h-4 text-emerald-600" /><h2 className="text-sm font-bold text-slate-900">Outgoing Handoff</h2></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {outgoingManifests.map((manifest) => {
            const loaded = manifest.expectedParcelIds.filter((id) => manifest.receivedParcelIds.includes(id)).length;
            const total = manifest.expectedParcelIds.length;
            const allLoaded = total > 0 && loaded === total;
            return (
              <div key={manifest.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-slate-900">{manifest.serviceId}</div>
                  <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${statusChip(manifest.hubStatus)}`}>{manifest.hubStatus || 'Preparing Dispatch'}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-2">{manifest.expectedShipmentIds.length} shipments · {total} parcels</div>
                <div className="text-[11px] text-slate-600">Next stop: {manifest.destinationName}</div>
                <div className="text-[10px] text-slate-500 mt-1">{manifest.scheduledTime} • {manifest.dock}</div>
                <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, loaded / Math.max(1, total) * 100)}%` }} /></div>
                <div className="text-[10px] text-slate-500 mt-1">{loaded}/{total} loaded</div>

                {manifest.hubStatus === 'Preparing Dispatch' && (
                  <button disabled={!allLoaded} onClick={() => markManifestReadyForDispatch(manifest.id)} className={`mt-3 w-full px-3 py-2 rounded-lg text-xs font-bold ${allLoaded ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                    {allLoaded ? 'Mark Ready for Dispatch' : `${total - loaded} parcel(s) still to load`}
                  </button>
                )}
                {manifest.hubStatus === 'Ready for Dispatch' && (
                  <button onClick={() => markManifestDeparted(manifest.id)} className="mt-3 w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Confirm Outgoing Handoff & Departure</button>
                )}
                {manifest.hubStatus === 'Departed' && <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Handoff completed and load departed</div>}
              </div>
            );
          })}
          {outgoingManifests.length === 0 && <div className="text-xs text-slate-500 py-4 lg:col-span-3">No outgoing loads match the selected filters.</div>}
        </div>
      </section>
    </div>
  );
};
