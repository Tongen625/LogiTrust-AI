import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MobileTabBar } from '../components/MobileTabBar';
import { getAssignedHub } from '../utils/hubScope';
import { AlertTriangle, CheckCircle2, Clock3, PackageSearch, ScanLine } from 'lucide-react';

const DEMO_HUB_CAPACITY = 110;

const getHandoffShipmentId = (parcelId: string) => {
  const match = parcelId.match(/^P-(.+)-\d+$/);
  return match ? match[1] : parcelId.replace(/^P-/, '');
};

export const HubOperatorAppView: React.FC = () => {
  const {
    currentUser,
    hubs,
    handoffs,
    verifyHandoffAction,
    hubManifests,
    shipments,
    reportManifestReceipt,
    addIncident,
  } = useLogistics();

  const hub = getAssignedHub(hubs, currentUser);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState('Queue');
  const [scanParcel, setScanParcel] = useState('');
  const TABS = ['Queue', 'Scan', 'Verify', 'Profile'];

  const notify = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage((current) => (current === text ? null : current)), 4200);
  };

  if (!hub) {
    return <div className="p-4 text-rose-600 text-sm">Assigned hub could not be resolved.</div>;
  }

  const localHandoffs = handoffs.filter((handoff) => handoff.hubId === hub.id);
  const reviewHandoffs = localHandoffs.filter((handoff) => handoff.status !== 'VERIFIED');
  const primaryHandoff = reviewHandoffs[0] || localHandoffs[0];

  const incomingManifests = hubManifests.filter(
    (manifest) => manifest.hubId === hub.id && (manifest.direction || 'Incoming') === 'Incoming'
  );
  const outgoingManifests = hubManifests.filter(
    (manifest) => manifest.hubId === hub.id && manifest.direction === 'Outgoing'
  );

  const manifestState = (manifest: typeof hubManifests[number]) =>
    ((manifest as typeof manifest & { hubStatus?: string }).hubStatus || '').trim();

  const incomingLoads = incomingManifests.filter((manifest) => manifestState(manifest) === 'In Transit');
  const awaitingReceivingLoads = incomingManifests.filter((manifest) =>
    ['Arrived', 'Receiving'].includes(manifestState(manifest))
  );
  const confirmedMismatchLoads = incomingManifests.filter(
    (manifest) => manifestState(manifest) === 'Received' && manifest.status === 'Mismatch'
  );

  const confirmedMissingParcels = confirmedMismatchLoads.flatMap((manifest) =>
    manifest.expectedParcelIds.filter((parcelId) => !manifest.receivedParcelIds.includes(parcelId))
  );

  const sortingQueueCount = shipments
    .filter((shipment) => shipment.currentLocation.toLowerCase().includes('sorting'))
    .reduce((sum, shipment) => sum + (shipment.parcelIds?.length || shipment.parcelCount || 0), 0);

  const awaitingReceivingParcelCount = awaitingReceivingLoads.reduce(
    (sum, manifest) => sum + Math.max(manifest.expectedParcelIds.length - manifest.receivedParcelIds.length, 0),
    0
  );

  const readyDispatchParcelCount = outgoingManifests
    .filter((manifest) => manifestState(manifest) === 'Ready for Dispatch')
    .reduce((sum, manifest) => sum + manifest.expectedParcelIds.length, 0);

  const activeWorkload = awaitingReceivingParcelCount + sortingQueueCount + readyDispatchParcelCount;
  const hubUtilisation = Math.min(Math.round((activeWorkload / DEMO_HUB_CAPACITY) * 100), 999);

  const receivingScanOptions = useMemo(() => {
    const options: Array<{ parcelId: string; shipmentId: string; manifestId: string; serviceId: string }> = [];

    awaitingReceivingLoads.forEach((manifest) => {
      manifest.expectedParcelIds
        .filter((parcelId) => !manifest.receivedParcelIds.includes(parcelId))
        .forEach((parcelId) => {
          const shipment = shipments.find((item) =>
            item.parcelIds?.includes(parcelId) || parcelId.startsWith(`P-${item.id}-`)
          );
          options.push({
            parcelId,
            shipmentId: shipment?.id || getHandoffShipmentId(parcelId),
            manifestId: manifest.id,
            serviceId: manifest.serviceId,
          });
        });
    });

    return options;
  }, [awaitingReceivingLoads, shipments]);

  const scanSelectedParcel = () => {
    const option = receivingScanOptions.find((item) => item.parcelId === scanParcel);
    if (!option) {
      notify('Select a parcel from an arrived / receiving load first.');
      return;
    }

    reportManifestReceipt(option.manifestId, option.parcelId);
    notify(`${option.parcelId} scanned at ${hub.code}. Receiving progress updated.`);
    setScanParcel('');
  };

  const reportMissingParcel = () => {
    const parcelId = confirmedMissingParcels[0];
    if (!parcelId) {
      notify('No confirmed missing parcel is available to report.');
      return;
    }

    const manifest = confirmedMismatchLoads.find((item) => item.expectedParcelIds.includes(parcelId));
    if (!manifest) return;

    const shipmentId =
      manifest.expectedShipmentIds.find((id) => parcelId.startsWith(`P-${id}-`)) || getHandoffShipmentId(parcelId);

    addIncident({
      type: 'Missing Parcel',
      location: hub.name,
      severity: 'High',
      shipmentId,
      affectedHubId: hub.id,
      affectedServiceId: manifest.serviceId,
      transportType: manifest.transportType,
      details: `Receiving was completed for ${manifest.serviceId}. Confirmed missing parcel: ${parcelId}.`,
    });
    notify(`${parcelId} reported as a confirmed missing parcel.`);
  };

  const reportHandoffException = () => {
    if (!primaryHandoff) return;
    addIncident({
      type: 'Invalid Scan',
      location: hub.name,
      severity: primaryHandoff.status === 'FLAGGED' ? 'High' : 'Medium',
      shipmentId: getHandoffShipmentId(primaryHandoff.parcelId),
      affectedHubId: hub.id,
      transportType: primaryHandoff.transportType,
      details: `Handoff ${primaryHandoff.id} requires exception review. Hub operator reported incomplete or inconsistent custody evidence.`,
    });
    notify('Handoff exception reported for review.');
  };

  const renderCheck = (label: string, ok: boolean) => (
    <div
      className={`p-2 rounded-lg border text-center ${
        ok
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-rose-50 border-rose-200 text-rose-700'
      }`}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-[10px] mt-0.5">{ok ? '✓' : '✕'}</div>
    </div>
  );

  const renderLoadRow = (
    manifest: typeof hubManifests[number],
    label: 'Incoming' | 'Awaiting Receiving'
  ) => {
    const outstanding = Math.max(manifest.expectedParcelIds.length - manifest.receivedParcelIds.length, 0);
    return (
      <div key={manifest.id} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between gap-3">
        <div>
          <div className="font-bold text-slate-900">{manifest.serviceId}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {manifest.scheduledTime} • {manifest.dock}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{label}</div>
        </div>
        <div className="text-right shrink-0">
          {label === 'Incoming' ? (
            <>
              <b className="text-sky-700">{manifest.expectedShipmentIds.length} shipments</b>
              <div className="text-[9px] text-slate-500">{manifest.expectedParcelIds.length} parcels expected</div>
            </>
          ) : (
            <>
              <b className={outstanding > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                {manifest.receivedParcelIds.length}/{manifest.expectedParcelIds.length}
              </b>
              <div className="text-[9px] text-slate-500">scanned</div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-white rounded-[36px] border-4 border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-[700px] text-slate-900 relative">
        <div className="bg-white px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-slate-200">
          <span>09:45 AM</span>
          <div className="w-16 h-3 bg-slate-100 rounded-full mx-auto" />
          <span className="text-blue-600">WiFi • 99%</span>
        </div>

        {message && (
          <div className="bg-blue-600 text-white font-semibold px-4 py-2 text-[11px] flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="font-extrabold ml-2">✕</button>
          </div>
        )}

        <div className="bg-white p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hub Operator App</h2>
              <p className="text-[11px] text-slate-500">{hub.name}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
              {currentUser.avatarInitials}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-400 uppercase block">Review</span>
              <b className="text-amber-700">{reviewHandoffs.length}</b>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-400 uppercase block">Confirmed Missing</span>
              <b className="text-rose-600">{confirmedMissingParcels.length}</b>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[9px] text-slate-400 uppercase block">Hub Utilisation</span>
              <b className={hubUtilisation >= 80 ? 'text-amber-700' : 'text-blue-700'}>{hubUtilisation}%</b>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/40">
          {tab === 'Queue' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                  <div className="text-[9px] text-slate-500">Incoming Loads</div>
                  <b className="text-sky-700">{incomingLoads.length}</b>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                  <div className="text-[9px] text-slate-500">Awaiting Receiving</div>
                  <b className="text-blue-700">{awaitingReceivingLoads.length}</b>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center">
                  <div className="text-[9px] text-slate-500">Handoff Review</div>
                  <b className="text-amber-700">{reviewHandoffs.length}</b>
                </div>
              </div>

              {incomingLoads.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Incoming Loads</div>
                  {incomingLoads.slice(0, 4).map((manifest) => renderLoadRow(manifest, 'Incoming'))}
                </div>
              )}

              {awaitingReceivingLoads.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Awaiting Receiving</div>
                  {awaitingReceivingLoads.slice(0, 4).map((manifest) => renderLoadRow(manifest, 'Awaiting Receiving'))}
                </div>
              )}

              {confirmedMissingParcels.length > 0 && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="font-bold text-rose-700">Confirmed Missing Parcel</div>
                  <div className="text-[11px] text-slate-600 mt-1 break-words">
                    {confirmedMissingParcels.slice(0, 4).join(', ')}
                    {confirmedMissingParcels.length > 4 ? ' …' : ''}
                  </div>
                  <button
                    onClick={reportMissingParcel}
                    className="mt-2 w-full py-2 rounded-xl bg-rose-600 text-white font-bold"
                  >
                    Report Missing Parcel
                  </button>
                </div>
              )}

              {incomingLoads.length === 0 && awaitingReceivingLoads.length === 0 && confirmedMissingParcels.length === 0 && (
                <div className="p-5 bg-white rounded-xl border border-slate-200 text-center text-slate-500">
                  No receiving work is waiting in the queue.
                </div>
              )}
            </>
          )}

          {tab === 'Scan' && (
            <div className="p-3.5 bg-white rounded-2xl border border-blue-200 space-y-3 shadow-sm">
              <div className="font-bold text-slate-900 flex items-center gap-1">
                <ScanLine className="w-4 h-4 text-blue-600" /> Scan Parcel
              </div>
              <p className="text-[10px] text-slate-500">
                Only parcels from loads already at this hub and currently being received are available here.
              </p>
              <select
                value={scanParcel}
                onChange={(event) => setScanParcel(event.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-800"
              >
                <option value="">Select parcel to simulate scan</option>
                {receivingScanOptions.map((option) => (
                  <option key={`${option.manifestId}-${option.parcelId}`} value={option.parcelId}>
                    {option.parcelId} — {option.serviceId}
                  </option>
                ))}
              </select>
              <button
                onClick={scanSelectedParcel}
                disabled={!scanParcel}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold"
              >
                Scan at {hub.code}
              </button>
            </div>
          )}

          {tab === 'Verify' && primaryHandoff && (
            <div className="p-3.5 bg-white rounded-2xl border border-blue-200 space-y-2.5 shadow-sm">
              <div className="flex justify-between gap-2">
                <span className="text-[10px] uppercase font-bold text-blue-700">Handoff Review</span>
                <span className={primaryHandoff.status === 'FLAGGED' ? 'text-[10px] font-bold text-rose-600' : primaryHandoff.status === 'VERIFIED' ? 'text-[10px] font-bold text-emerald-700' : 'text-[10px] font-bold text-amber-700'}>
                  {primaryHandoff.status}
                </span>
              </div>

              <div>
                <div className="font-semibold text-slate-900">{primaryHandoff.parcelId}</div>
                <div className="text-[11px] text-slate-500">{primaryHandoff.fromParty} → {primaryHandoff.toParty}</div>
                <div className="text-[11px] text-slate-500">{primaryHandoff.location}</div>
              </div>

              <div className="grid grid-cols-5 gap-1 text-[10px]">
                {renderCheck('ID', primaryHandoff.checks.identity)}
                {renderCheck('Parcel', primaryHandoff.checks.parcelId)}
                {renderCheck('Geo', primaryHandoff.checks.location)}
                {renderCheck('Time', primaryHandoff.checks.timestamp)}
                {renderCheck('Seq', primaryHandoff.checks.sequence)}
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Trust Score</span>
                <b className="text-blue-700">{primaryHandoff.trustScore}%</b>
              </div>

              {primaryHandoff.status === 'REQUIRES REVIEW' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      verifyHandoffAction(primaryHandoff.id);
                      notify('Manual check completed. Custody accepted and record verified.');
                    }}
                    className="py-2 bg-emerald-600 rounded-xl text-white font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Accept After Manual Check
                  </button>
                  <button
                    onClick={() => notify('Re-scan requested from the handoff party.')}
                    className="py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 font-bold flex items-center justify-center gap-1"
                  >
                    <ScanLine className="w-3 h-3" /> Request Re-scan
                  </button>
                </div>
              )}

              {primaryHandoff.status === 'FLAGGED' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-700">
                  This handoff is flagged. Custody cannot be accepted until the issue is resolved.
                </div>
              )}

              {primaryHandoff.status !== 'VERIFIED' && (
                <button
                  onClick={reportHandoffException}
                  className="w-full py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 font-bold flex items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" /> Report Exception
                </button>
              )}

              {primaryHandoff.status === 'VERIFIED' && (
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Custody record verified.
                </div>
              )}
            </div>
          )}

          {tab === 'Profile' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  {currentUser.avatarInitials}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500">Hub Operator</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 shadow-sm">
                <div className="p-2.5 rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400">USER ID</div>
                  <div className="font-semibold text-slate-900 mt-1">{currentUser.id}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400">CALLSIGN</div>
                  <div className="font-semibold text-slate-900 mt-1">{currentUser.callsign}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400">CLEARANCE</div>
                  <div className="font-semibold text-slate-900 mt-1">{currentUser.clearanceLevel}</div>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400">HUB LOCATION</div>
                  <div className="font-semibold text-slate-900 mt-1">{hub.name}</div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-500 mb-2">PERMITTED FUNCTIONS</div>
                <div className="space-y-1.5 text-[11px] text-slate-700">
                  <div>• Hub Terminal Operations</div>
                  <div>• Parcel Receiving & Scan</div>
                  <div>• 5-Point Handoff Verification Checks</div>
                  <div>• Hub Utilisation Monitoring</div>
                  <div>• Hub Shipments Manifest</div>
                  <div>• Report Hub Exceptions</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <MobileTabBar tabs={TABS} active={tab} onChange={setTab} />
      </div>
    </div>
  );
};
