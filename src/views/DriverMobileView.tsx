import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  MapPin,
  Navigation,
  PackageCheck,
  QrCode,
  Route,
  ShieldAlert,
  Smartphone,
  Truck,
} from 'lucide-react';

type DriverAssignment = 'pickup' | 'linehaul' | 'last-mile';
type DriverTab = 'Jobs' | 'Scan' | 'Tracking' | 'Incident' | 'Profile';
type DriverIncidentType = 'Accident' | 'Vehicle Breakdown' | 'Traffic' | 'Flood';

interface DriverAssignmentConfig {
  id: DriverAssignment;
  label: string;
  shortLabel: string;
  driverName: string;
  driverId: string;
  vehicle: string;
  routeLabel: string;
  headline: string;
  stage: string;
  accent: string;
  badge: string;
  shipmentId: string;
  originLabel: string;
  destinationLabel: string;
  etaLabel: string;
  primaryAction: string;
  secondaryAction: string;
  scanTitle: string;
  scanDescription: string;
  trackingStatus: string;
  trackingNote: string;
}

const DRIVER_ASSIGNMENTS: Record<DriverAssignment, DriverAssignmentConfig> = {
  pickup: {
    id: 'pickup',
    label: 'Pickup Driver',
    shortLabel: 'Pickup',
    driverName: 'Ibrahim Rahman',
    driverId: 'D-402',
    vehicle: 'Feeder Van FV-402',
    routeLabel: 'Batu Pahat → Johor Bahru Hub',
    headline: 'Origin pickup & hub intake',
    stage: 'Pre-Stage 3 Handoff Source',
    accent: 'text-violet-700',
    badge: 'bg-violet-50 border-violet-200 text-violet-700',
    shipmentId: 'MY102938',
    originLabel: 'Batu Pahat Pickup Point',
    destinationLabel: 'Johor Bahru Southern Region Hub',
    etaLabel: '10:05',
    primaryAction: 'Navigate to Origin Hub',
    secondaryAction: 'Submit Hub Arrival',
    scanTitle: 'Pickup / Origin Hub Seal Scan',
    scanDescription: 'Scan the shipment or custody seal before handing the load to the origin hub operator.',
    trackingStatus: 'En route to origin hub',
    trackingNote: 'Feeder movement is visible to operations. Hub custody is accepted only after Hub Operator verification.',
  },
  linehaul: {
    id: 'linehaul',
    label: 'Linehaul Driver',
    shortLabel: 'Linehaul',
    driverName: 'Ahmad Faiz',
    driverId: 'D-118',
    vehicle: 'Intermodal Linehaul D-118',
    routeLabel: 'Johor Bahru Hub → Petaling Jaya Hub',
    headline: 'Inter-hub linehaul transit',
    stage: 'Stage 5 → Stage 6',
    accent: 'text-blue-700',
    badge: 'bg-blue-50 border-blue-200 text-blue-700',
    shipmentId: 'MY102938',
    originLabel: 'Johor Bahru Southern Region Hub',
    destinationLabel: 'Petaling Jaya Auto Hub',
    etaLabel: '16:00',
    primaryAction: 'Open Approved Route',
    secondaryAction: 'Submit Destination Handoff',
    scanTitle: 'Destination Hub Handoff Scan',
    scanDescription: 'Capture the custody seal and destination-hub arrival evidence. Hub Operator remains the verifier.',
    trackingStatus: 'Inter-hub movement active',
    trackingNote: 'Transit movement is tracked until the destination hub. Driver submits arrival / custody evidence; Hub Operator performs the verification.',
  },
  'last-mile': {
    id: 'last-mile',
    label: 'Last-Mile Driver',
    shortLabel: 'Last-Mile',
    driverName: 'Nadia Syafiqah',
    driverId: 'D-771',
    vehicle: 'Dispatch Van LV-771',
    routeLabel: 'Petaling Jaya Hub → KL Dispatch Zone',
    headline: 'Operational dispatch tracking',
    stage: 'Stage 7 Only',
    accent: 'text-emerald-700',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    shipmentId: 'MY205721',
    originLabel: 'Petaling Jaya Auto Hub',
    destinationLabel: 'Kuala Lumpur Dispatch Zone',
    etaLabel: '18:10',
    primaryAction: 'Start Dispatch Route',
    secondaryAction: 'Update Dispatch Status',
    scanTitle: 'Dispatch Load Scan',
    scanDescription: 'Confirm the assigned load before departure. No recipient OTP, signature or delivery verification is included.',
    trackingStatus: 'Ready for dispatch',
    trackingNote: 'Stage 7 is operational tracking only. Trust / Handoff Agent scope has already ended at the destination hub.',
  },
};

const TABS: DriverTab[] = ['Jobs', 'Scan', 'Tracking', 'Incident', 'Profile'];

export const DriverMobileView: React.FC = () => {
  const { shipments, submitHandoffEvidence, addIncident } = useLogistics();
  const [assignment, setAssignment] = useState<DriverAssignment>('linehaul');
  const [tab, setTab] = useState<DriverTab>('Jobs');
  const [selectedJob, setSelectedJob] = useState(false);
  const [mobileMessage, setMobileMessage] = useState<string | null>(null);
  const [incidentText, setIncidentText] = useState('');
  const [incidentType, setIncidentType] = useState<DriverIncidentType>('Traffic');
  const [scanComplete, setScanComplete] = useState<Record<DriverAssignment, boolean>>({
    pickup: false,
    linehaul: false,
    'last-mile': false,
  });

  const config = DRIVER_ASSIGNMENTS[assignment];
  const shipment = useMemo(
    () => shipments.find((item) => item.id === config.shipmentId) || shipments[0],
    [shipments, config.shipmentId],
  );

  const showMobileNotice = (message: string) => {
    setMobileMessage(message);
    window.setTimeout(() => {
      setMobileMessage((current) => (current === message ? null : current));
    }, 4200);
  };

  const switchAssignment = (nextAssignment: DriverAssignment) => {
    setAssignment(nextAssignment);
    setTab('Jobs');
    setSelectedJob(false);
    setIncidentText('');
    showMobileNotice(`${DRIVER_ASSIGNMENTS[nextAssignment].label} workspace loaded.`);
  };

  const handlePrimaryAction = () => {
    if (assignment === 'pickup') {
      setTab('Tracking');
      showMobileNotice('Route to Johor Bahru Southern Region Hub opened inside Driver Mobile.');
      return;
    }
    if (assignment === 'linehaul') {
      setTab('Tracking');
      showMobileNotice('Approved inter-hub route opened inside Driver Mobile.');
      return;
    }
    setTab('Tracking');
    showMobileNotice('Stage 7 dispatch route started. Operational location updates are now active.');
  };

  const handleSecondaryAction = () => {
    if (assignment === 'pickup') {
      setTab('Scan');
      showMobileNotice('Origin hub arrival recorded. Complete the custody scan for Hub Operator intake.');
      return;
    }
    if (assignment === 'linehaul') {
      submitHandoffEvidence('HO-1029');
      setScanComplete((current) => ({ ...current, linehaul: true }));
      showMobileNotice('Destination hub handoff evidence submitted. Awaiting Hub Operator verification.');
      return;
    }
    showMobileNotice('Dispatch status updated to Dispatched. No delivery verification or recipient proof was created.');
  };

  const handleScan = () => {
    setScanComplete((current) => ({ ...current, [assignment]: true }));
    if (assignment === 'pickup') {
      showMobileNotice('Pickup custody seal captured. Evidence is ready for origin Hub Operator intake verification.');
    } else if (assignment === 'linehaul') {
      showMobileNotice('Destination custody seal and device evidence captured. Submit handoff when physically at the hub gate.');
    } else {
      showMobileNotice('Assigned dispatch load scanned and matched to Driver D-771.');
    }
  };

  const handleIncident = () => {
    addIncident({
      type: incidentType,
      location: shipment?.currentLocation || config.routeLabel,
      severity: incidentType === 'Accident' || incidentType === 'Flood' ? 'High' : 'Medium',
      transportType: 'Truck',
      affectedServiceId: config.vehicle,
      shipmentId: shipment?.id,
      details:
        incidentText.trim() ||
        `${incidentType} reported by ${config.label} ${config.driverId} during ${config.routeLabel}.`,
    });
    showMobileNotice(`${incidentType} reported to the Control Tower for operational review.`);
    setIncidentText('');
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-white rounded-[34px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col min-h-[700px] text-slate-900 relative">
        <div className="bg-white px-5 py-2.5 flex items-center justify-between text-[10px] font-semibold text-slate-500 border-b border-slate-100">
          <span>10:24 AM</span>
          <div className="w-16 h-3 bg-slate-100 rounded-full" />
          <span className="text-blue-600">5G • 98%</span>
        </div>

        {mobileMessage && (
          <div className="bg-blue-600 text-white px-4 py-2.5 text-[11px] font-semibold flex items-start justify-between gap-2 shadow-sm">
            <span>{mobileMessage}</span>
            <button type="button" onClick={() => setMobileMessage(null)} className="font-black leading-none">×</button>
          </div>
        )}

        <header className="bg-gradient-to-b from-blue-50 to-white px-4 pt-4 pb-3 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-black text-blue-600">
                <Smartphone className="w-3.5 h-3.5" /> Driver Mobile
              </div>
              <h2 className="mt-1 text-base font-black text-slate-950">{config.driverName} ({config.driverId})</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{config.vehicle} • {config.routeLabel}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              {config.driverId.replace('D-', 'D')}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-500 mb-1.5">Assignment Type</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(DRIVER_ASSIGNMENTS) as DriverAssignment[]).map((item) => {
                const itemConfig = DRIVER_ASSIGNMENTS[item];
                const active = item === assignment;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => switchAssignment(item)}
                    className={`rounded-xl border px-2 py-2 text-[10px] font-extrabold transition ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {itemConfig.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3.5 text-xs">
          {tab === 'Jobs' && !selectedJob && (
            <>
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Current Assignment</div>
                    <div className="mt-1 font-black text-slate-900">{config.headline}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{config.stage}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${config.badge}`}>
                    ACTIVE
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedJob(true)}
                  className="w-full text-left p-3.5 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-700">{shipment?.id || config.shipmentId}</span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{shipment?.priority || 'Standard'}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-800 truncate">{shipment?.category || 'Assigned Logistics Load'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <span className="text-slate-400 uppercase font-bold block">Destination</span>
                      <strong className="text-slate-700 block mt-0.5 leading-snug">{config.destinationLabel}</strong>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                      <span className="text-slate-400 uppercase font-bold block">ETA</span>
                      <strong className="text-slate-700 block mt-0.5">{config.etaLabel}</strong>
                    </div>
                  </div>
                </button>
              </section>

              <section className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handlePrimaryAction} className="rounded-2xl bg-blue-600 text-white p-3 text-left shadow-sm hover:bg-blue-700 transition">
                  <Navigation className="w-4 h-4 mb-2" />
                  <span className="text-[11px] font-black block leading-tight">{config.primaryAction}</span>
                </button>
                <button type="button" onClick={handleSecondaryAction} className="rounded-2xl bg-white border border-slate-200 p-3 text-left shadow-sm hover:border-blue-300 transition">
                  <PackageCheck className="w-4 h-4 mb-2 text-blue-600" />
                  <span className="text-[11px] font-black text-slate-800 block leading-tight">{config.secondaryAction}</span>
                </button>
              </section>

              <section className="rounded-2xl bg-white border border-slate-200 p-3.5">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-slate-800">Role boundary</div>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      {assignment === 'pickup'
                        ? 'Pickup Driver supplies physical custody evidence to the origin hub. The Hub Operator confirms hub intake.'
                        : assignment === 'linehaul'
                          ? 'Linehaul Driver reports movement and submits destination handoff evidence. Security exceptions and hub verification require another authorised role.'
                          : 'Last-Mile Driver performs Stage 7 operational dispatch only. Recipient, buyer, OTP, signature and proof-of-delivery functions are excluded.'}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === 'Jobs' && selectedJob && (
            <section className="space-y-3">
              <button type="button" onClick={() => setSelectedJob(false)} className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs
              </button>

              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Load Detail</div>
                    <h3 className="text-base font-black text-slate-950 mt-1">{shipment?.id || config.shipmentId}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{shipment?.category || 'Assigned Logistics Load'}</p>
                  </div>
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>

                <div className="mt-4 space-y-2.5">
                  <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Origin" value={config.originLabel} />
                  <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Destination" value={config.destinationLabel} />
                  <DetailRow icon={<Clock3 className="w-3.5 h-3.5" />} label="Operational ETA" value={config.etaLabel} />
                  <DetailRow icon={<Route className="w-3.5 h-3.5" />} label="Current Status" value={assignment === 'linehaul' ? shipment?.status || 'In Transit' : config.trackingStatus} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100"><span className="text-slate-400 uppercase font-bold block">Vehicle</span><strong className="text-slate-700 mt-0.5 block">{config.vehicle}</strong></div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100"><span className="text-slate-400 uppercase font-bold block">Priority</span><strong className="text-slate-700 mt-0.5 block">{shipment?.priority || 'Standard'}</strong></div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100"><span className="text-slate-400 uppercase font-bold block">Weight</span><strong className="text-slate-700 mt-0.5 block">{shipment?.weightKg ?? 0} kg</strong></div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100"><span className="text-slate-400 uppercase font-bold block">Driver</span><strong className="text-slate-700 mt-0.5 block">{config.driverId}</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handlePrimaryAction} className="py-2.5 rounded-xl bg-blue-600 text-white font-black text-[11px]">{config.primaryAction}</button>
                <button type="button" onClick={() => setTab('Scan')} className="py-2.5 rounded-xl bg-white border border-slate-200 text-blue-700 font-black text-[11px]">Open Scanner</button>
              </div>
            </section>
          )}

          {tab === 'Scan' && (
            <section className="space-y-3">
              <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Scanner</div>
                    <h3 className="mt-1 font-black text-slate-900">{config.scanTitle}</h3>
                  </div>
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{config.scanDescription}</p>

                <div className="mt-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 h-36 flex flex-col items-center justify-center text-center px-6">
                  {scanComplete[assignment] ? (
                    <>
                      <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                      <span className="mt-2 font-black text-emerald-700">Scan captured</span>
                      <span className="text-[10px] text-slate-500 mt-1">{shipment?.id || config.shipmentId} • {config.driverId}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-blue-500" />
                      <span className="mt-2 font-black text-slate-700">Align barcode / custody seal</span>
                      <span className="text-[10px] text-slate-400 mt-1">Camera preview simulated for prototype</span>
                    </>
                  )}
                </div>

                <button type="button" onClick={handleScan} className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 text-white font-black text-[11px]">
                  {scanComplete[assignment] ? 'Scan Again' : 'Capture Scan'}
                </button>

                {assignment === 'linehaul' && scanComplete.linehaul && (
                  <button type="button" onClick={handleSecondaryAction} className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[11px]">
                    Submit Destination Handoff Evidence
                  </button>
                )}
              </div>
            </section>
          )}

          {tab === 'Tracking' && (
            <section className="space-y-3">
              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                <div className="h-44 bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100 relative overflow-hidden">
                  <div className="absolute inset-x-6 top-1/2 h-1.5 rounded-full bg-blue-200 -rotate-6" />
                  <div className="absolute left-8 top-[64%] w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                  <div className="absolute right-10 top-[34%] w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <div className="absolute left-[47%] top-[45%] w-8 h-8 rounded-full bg-white border border-blue-200 shadow flex items-center justify-center">
                    <Truck className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="absolute left-3 top-3 rounded-lg bg-white/90 border border-slate-200 px-2 py-1 text-[9px] font-bold text-slate-600">Live Route</div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900">{config.routeLabel}</div>
                      <div className={`mt-1 text-[10px] font-black ${assignment === 'linehaul' ? 'text-blue-700' : 'text-emerald-600'}`}>{config.trackingStatus}</div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">ETA {config.etaLabel}</span>
                  </div>
                  <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{config.trackingNote}</p>
                </div>
              </div>

           </section>
          )}

          {tab === 'Incident' && (
            <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Driver Incident</div>
                  <h3 className="mt-1 font-black text-slate-900">Report transport issue</h3>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>

              <select
                value={incidentType}
                onChange={(event) => setIncidentType(event.target.value as DriverIncidentType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-400"
              >
                <option>Accident</option>
                <option>Vehicle Breakdown</option>
                <option>Traffic</option>
                <option>Flood</option>
              </select>

              <textarea
                value={incidentText}
                onChange={(event) => setIncidentText(event.target.value)}
                rows={4}
                placeholder="Describe what happened, current road condition or vehicle condition..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] text-slate-700 outline-none focus:border-blue-400"
              />

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-[10px] text-slate-500">
                Reported as <strong className="text-slate-700">{config.label} {config.driverId}</strong> for {shipment?.id || config.shipmentId}. Incident review stays with the appropriate operations / security role.
              </div>

              <button type="button" onClick={handleIncident} className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-black text-[11px] hover:bg-amber-600 transition">
                Send Incident to Control Tower
              </button>
            </section>
          )}

          {tab === 'Profile' && (
            <section className="space-y-3">
              <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
                  <CircleUserRound className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-slate-900">{config.driverName}</div>
                  <div className="text-[11px] text-slate-500">{config.label} • {config.driverId}</div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-sm grid grid-cols-2 gap-2 text-[10px]">
                <ProfileMetric label="Vehicle" value={config.vehicle} />
                <ProfileMetric label="Assignment" value={config.shortLabel} />
                <ProfileMetric label="Clearance" value="Driver Mobile" />
                <ProfileMetric label="Current Route" value={config.routeLabel} />
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-sm">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">Permitted Functions</div>
                <div className="mt-2 space-y-1.5 text-[11px] text-slate-600">
                  <div>• View assigned jobs and route details</div>
                  <div>• Scan assigned load / custody evidence</div>
                  <div>• Report transport incidents and movement</div>
                  <div>• Submit permitted handoff evidence</div>
                  <div>• Cannot self-approve custody or security exceptions</div>
                </div>
              </div>
            </section>
          )}
        </main>

        <nav className="bg-white border-t border-slate-200 px-1 py-1.5 grid grid-cols-5 gap-1">
          {TABS.map((item) => {
            const active = tab === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTab(item);
                  if (item !== 'Jobs') setSelectedJob(false);
                }}
                className={`rounded-xl py-2 text-[9px] font-extrabold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-blue-600'}`}
              >
                {item}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
    <div className="text-blue-600 mt-0.5">{icon}</div>
    <div className="min-w-0">
      <span className="text-[9px] uppercase font-bold text-slate-400 block">{label}</span>
      <strong className="text-[11px] text-slate-700 leading-snug block mt-0.5">{value}</strong>
    </div>
  </div>
);

const ProfileMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5">
    <span className="text-slate-400 uppercase font-bold block">{label}</span>
    <strong className="text-slate-700 mt-0.5 block leading-snug">{value}</strong>
  </div>
);
