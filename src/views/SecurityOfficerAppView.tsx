import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  Fingerprint,
  MapPinned,
  Radio,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserRound,
} from 'lucide-react';

type SecurityTab = 'Alerts' | 'Evidence' | 'Actions' | 'Profile';

const TABS: SecurityTab[] = ['Alerts', 'Evidence', 'Actions', 'Profile'];

const riskClass = (risk?: string) => {
  if (risk === 'High' || risk === 'Critical') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (risk === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const statusClass = (status?: string) => {
  if (status === 'Resolved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Verification Requested') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'Escalated') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'Investigating') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const evidenceClass = (status?: string) => {
  if (status === 'Verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Anomaly') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'Warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

export const SecurityOfficerAppView: React.FC = () => {
  const {
    securityAlerts,
    requestDriverVerification,
    resolveSecurityAlert,
    escalateSecurityAlert,
    currentUser,
  } = useLogistics();

  const [tab, setTab] = useState<SecurityTab>('Alerts');
  const [selectedAlertId, setSelectedAlertId] = useState<string>('TR102');
  const [message, setMessage] = useState<string | null>(null);

  const selectedAlert = useMemo(
    () => securityAlerts.find((alert) => alert.id === selectedAlertId) || securityAlerts[0],
    [securityAlerts, selectedAlertId]
  );

  const openAlerts = useMemo(
    () => securityAlerts.filter((alert) => alert.status !== 'Resolved'),
    [securityAlerts]
  );

  const highRiskCount = useMemo(
    () => securityAlerts.filter((alert) => alert.status !== 'Resolved' && alert.riskLevel === 'High').length,
    [securityAlerts]
  );

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => {
      setMessage((current) => (current === text ? null : current));
    }, 3600);
  };

  const selectAlert = (id: string, destination: SecurityTab = 'Evidence') => {
    setSelectedAlertId(id);
    setTab(destination);
  };

  const runVerification = () => {
    if (!selectedAlert) return;
    requestDriverVerification(selectedAlert.id, 'Requested by Security Officer mobile app');
    notify(`Verification requested for ${selectedAlert.shipmentId}.`);
  };

  const resolveAlert = () => {
    if (!selectedAlert) return;
    resolveSecurityAlert(selectedAlert.id, 'Reviewed and resolved by Security Officer mobile app');
    notify(`Incident ${selectedAlert.id} marked resolved.`);
  };

  const escalateAlert = () => {
    if (!selectedAlert) return;
    escalateSecurityAlert(selectedAlert.id, 'Escalated by Security Officer mobile app for human investigation');
    notify(`Incident ${selectedAlert.id} escalated for human review.`);
  };

  const renderAlerts = () => (
    <div className="space-y-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Security Queue</p>
            <h3 className="mt-1 text-base font-extrabold text-slate-900">Active Risk Alerts</h3>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              Review route and trust anomalies. AI flags evidence; the Security Officer makes the decision.
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </section>

      {securityAlerts.map((alert) => {
        const isResolved = alert.status === 'Resolved';
        return (
          <button
            key={alert.id}
            type="button"
            onClick={() => selectAlert(alert.id)}
            className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] font-extrabold text-blue-700">#{alert.id}</span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">{alert.shipmentId}</span>
                </div>
                <div className="mt-1.5 text-[13px] font-bold leading-5 text-slate-900">{alert.title}</div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${riskClass(alert.riskLevel)}`}>
                {alert.riskLevel} Risk
              </span>
              <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${statusClass(alert.status)}`}>
                {alert.status}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-bold text-slate-600">
                {alert.anomalyType}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-2xl bg-slate-50 p-2.5">
                <span className="block uppercase tracking-wide text-slate-400">Detected</span>
                <strong className="mt-0.5 block text-slate-700">{alert.detectedAt}</strong>
              </div>
              <div className="rounded-2xl bg-slate-50 p-2.5">
                <span className="block uppercase tracking-wide text-slate-400">Route Offset</span>
                <strong className={alert.deviationKm && alert.deviationKm > 3 ? 'mt-0.5 block text-rose-600' : 'mt-0.5 block text-slate-700'}>
                  {alert.deviationKm ? `${alert.deviationKm} km` : 'N/A'}
                </strong>
              </div>
            </div>

            {!isResolved && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-blue-700">
                <FileSearch className="h-3.5 w-3.5" /> Tap to review evidence
              </div>
            )}
          </button>
        );
      })}

      <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-3.5">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
          <div>
            <div className="text-[11px] font-extrabold text-blue-900">Human-controlled security review</div>
            <p className="mt-1 text-[10px] leading-4 text-blue-800/80">
              Route Risk Agent findings are evidence only. The system does not automatically accuse a driver of theft or fraud.
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderEvidence = () => {
    if (!selectedAlert) return null;

    return (
      <div className="space-y-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] font-extrabold text-blue-700">#{selectedAlert.id}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${riskClass(selectedAlert.riskLevel)}`}>
                  {selectedAlert.riskLevel} Risk
                </span>
              </div>
              <h3 className="mt-2 text-sm font-extrabold leading-5 text-slate-900">{selectedAlert.title}</h3>
              <p className="mt-1 text-[11px] text-slate-500">Shipment {selectedAlert.shipmentId}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Fingerprint className="h-5 w-5" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-blue-700" />
            <h4 className="text-xs font-extrabold text-slate-900">Route Comparison</h4>
          </div>
          <div className="space-y-2">
            <div className="rounded-2xl bg-slate-50 p-3">
              <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Approved corridor</span>
              <p className="mt-1 text-[11px] leading-4 text-slate-700">{selectedAlert.expectedRoute}</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
              <span className="text-[9px] font-bold uppercase tracking-wide text-rose-500">Observed movement</span>
              <p className="mt-1 text-[11px] leading-4 text-slate-700">{selectedAlert.actualMovement}</p>
              {selectedAlert.deviationKm !== undefined && (
                <div className="mt-2 text-[10px] font-extrabold text-rose-700">Deviation: {selectedAlert.deviationKm} km</div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-700" />
              <h4 className="text-xs font-extrabold text-slate-900">Evidence Timeline</h4>
            </div>
            <span className="text-[9px] font-bold text-slate-400">{selectedAlert.evidence.length} records</span>
          </div>

          <div className="space-y-2.5">
            {selectedAlert.evidence.map((item, index) => (
              <div key={`${item.time}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-blue-700">{item.time}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-extrabold uppercase ${evidenceClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-bold leading-4 text-slate-800">{item.event}</div>
                <div className="mt-1 text-[10px] leading-4 text-slate-500">{item.details}</div>
                <div className="mt-2 text-[9px] font-semibold text-slate-400">Source: {item.sensor}</div>
              </div>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={() => setTab('Actions')}
          className="w-full rounded-2xl bg-blue-700 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-800"
        >
          Continue to Security Actions
        </button>
      </div>
    );
  };

  const renderActions = () => {
    if (!selectedAlert) return null;
    const closed = selectedAlert.status === 'Resolved';

    return (
      <div className="space-y-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Incident Decision</p>
              <h3 className="mt-1 text-sm font-extrabold text-slate-900">#{selectedAlert.id} · {selectedAlert.shipmentId}</h3>
            </div>
            <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${statusClass(selectedAlert.status)}`}>
              {selectedAlert.status}
            </span>
          </div>

          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-blue-700">
              <Shield className="h-3.5 w-3.5" /> Route Risk Agent Assessment
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-700">{selectedAlert.aiAssessment}</p>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Recommended action</span>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-800">{selectedAlert.recommendedAction}</p>
          </div>
        </section>

        {!closed ? (
          <section className="space-y-2.5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Human Controls</div>

            <button
              type="button"
              onClick={runVerification}
              className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-left transition hover:bg-blue-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900">Request Driver Verification</div>
                  <div className="mt-0.5 text-[9px] text-slate-500">Ask driver/telematics for confirmation before judgement.</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-400" />
            </button>

            <button
              type="button"
              onClick={escalateAlert}
              className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-left transition hover:bg-rose-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                  <Siren className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900">Escalate for Investigation</div>
                  <div className="mt-0.5 text-[9px] text-slate-500">Escalate unresolved or high-risk evidence to field/security review.</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-rose-400" />
            </button>

            <button
              type="button"
              onClick={resolveAlert}
              className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-left transition hover:bg-emerald-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-slate-900">Resolve Incident</div>
                  <div className="mt-0.5 text-[9px] text-slate-500">Close only after evidence has been reviewed by a human.</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-400" />
            </button>
          </section>
        ) : (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800">
              <BadgeCheck className="h-5 w-5" /> Incident Resolved
            </div>
            <p className="mt-1 text-[10px] leading-4 text-emerald-700">
              This alert is closed. Its evidence and decision remain available in the audit trail.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-[10px] leading-4 text-amber-900">
              Security actions must remain non-accusatory. AI identifies anomalies; only authorised personnel decide whether further investigation is required.
            </p>
          </div>
        </section>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="space-y-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-extrabold text-blue-700">
            {currentUser.avatarInitials}
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900">{currentUser.name}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">{currentUser.role}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
          {[
            ['User ID', currentUser.id],
            ['Callsign', currentUser.callsign],
            ['Clearance', currentUser.clearanceLevel],
            ['Hub', currentUser.hubLocation],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-2.5">
              <span className="block uppercase tracking-wide text-slate-400">{label}</span>
              <strong className="mt-0.5 block text-slate-700">{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
          <UserRound className="h-4 w-4 text-blue-700" /> Security Officer Scope
        </div>
        <div className="mt-3 space-y-2 text-[10px] text-slate-600">
          <div className="rounded-2xl bg-slate-50 p-2.5">• Review route deviation, GPS anomaly and trust/security alerts.</div>
          <div className="rounded-2xl bg-slate-50 p-2.5">• Review multi-sensor evidence before taking action.</div>
          <div className="rounded-2xl bg-slate-50 p-2.5">• Request verification, resolve alerts or escalate for investigation.</div>
          <div className="rounded-2xl bg-slate-50 p-2.5">• No transport scheduling, hub custody operation or automatic accusation.</div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 lg:p-6">
      <div className="relative flex min-h-[720px] w-full max-w-sm flex-col overflow-hidden rounded-[36px] border border-slate-200 bg-[#f6f8fc] text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-2 text-[10px] font-semibold text-slate-500">
          <span>10:04</span>
          <div className="h-3 w-16 rounded-full bg-slate-100" />
          <span>5G · 94%</span>
        </div>

        {message && (
          <div className="flex items-center justify-between bg-blue-700 px-4 py-2.5 text-[10px] font-bold text-white">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage(null)} className="ml-3 text-sm leading-none">×</button>
          </div>
        )}

        <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Security Officer</h2>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500">Risk & route anomaly review</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LIVE
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
              <BellRing className="h-3.5 w-3.5 text-rose-600" />
              <div className="mt-1 text-base font-extrabold text-slate-900">{openAlerts.length}</div>
              <div className="text-[8px] font-bold uppercase text-slate-400">Open Alerts</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <div className="mt-1 text-base font-extrabold text-slate-900">{highRiskCount}</div>
              <div className="text-[8px] font-bold uppercase text-slate-400">High Risk</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
              <div className="mt-1 text-base font-extrabold text-slate-900">Human</div>
              <div className="text-[8px] font-bold uppercase text-slate-400">Decision</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          {tab === 'Alerts' && renderAlerts()}
          {tab === 'Evidence' && renderEvidence()}
          {tab === 'Actions' && renderActions()}
          {tab === 'Profile' && renderProfile()}
        </main>

        <nav className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur">
          <div className="grid grid-cols-4 gap-1">
            {TABS.map((item) => {
              const active = tab === item;
              const Icon = item === 'Alerts' ? ShieldAlert : item === 'Evidence' ? FileSearch : item === 'Actions' ? Siren : UserRound;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`flex flex-col items-center justify-center rounded-2xl py-2 text-[9px] font-bold transition ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  {item}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
