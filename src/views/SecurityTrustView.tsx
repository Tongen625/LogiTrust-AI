import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  FileSearch,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  UserCheck,
  MapPin,
  Clock,
  Fingerprint,
  Info,
  Shield,
  Activity,
} from 'lucide-react';
import { SecurityAlert, SecurityAnomalyType } from '../types/logistics';

export const SecurityTrustView: React.FC = () => {
  const {
    securityAlerts,
    requestDriverVerification,
    resolveSecurityAlert,
    escalateSecurityAlert,
    setSelectedShipmentId,
    setActiveTab,
  } = useLogistics();

  const [selectedAlertId, setSelectedAlertId] = useState<string>('TR102');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [showResolvedModal, setShowResolvedModal] = useState(false);

  const selectedAlert = securityAlerts.find((a) => a.id === selectedAlertId) || securityAlerts[0];

  const anomalyCategories: { type: SecurityAnomalyType; description: string }[] = [
    { type: 'Route Deviation', description: 'Lateral vehicle departure from approved corridor >3.0 km tolerance.' },
    { type: 'Unexpected Stop', description: 'Unscheduled dwell time >15 mins in unauthorized or unmonitored zones.' },
    { type: 'GPS Anomaly', description: 'Impossible velocity shifts, multipath jitter, or receiver clock jumps.' },
    { type: 'Impossible Travel', description: 'Physical velocity threshold breach between consecutive optical scans.' },
    { type: 'Duplicate Scan', description: 'Simultaneous conflicting custody pings from distinct geolocations.' },
    { type: 'Invalid Handoff', description: 'Custody handoff evidence is incomplete or inconsistent with the expected counterparty.' },
    { type: 'Identity Mismatch', description: 'Biometric credential does not match assigned vehicle manifest.' },
    { type: 'Tamper Seal Breach', description: 'Container electronic bolt seal integrity alert during transit corridor movement.' },
    { type: 'Timestamp Inconsistency', description: 'Hardware clock skew or backdated offline signature attempt.' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              Security & Digital Trust Console
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              DIGITAL TRUST ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cyber-physical anomaly detection, geofence surveillance & non-accusatory evidentiary audit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>GEOFENCE SENTINEL: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Trust Philosophy & Safeguards Banner */}
      <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-cyan-500/30 flex items-start gap-3 shadow-lg">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-bold text-white flex items-center gap-2">
            <span>Algorithmic Trust Safeguard: Non-Accusatory Evidentiary Protocol</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.2 rounded border border-cyan-800">
              Standard Operating Policy #SEC-409
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            AI agents must never prematurely accuse drivers or personnel of theft or fraud. Anomaly classifications use evidentiary qualifiers such as <strong>"Suspicious"</strong>, <strong>"Requires Verification"</strong>, <strong>"Evidence Inconsistent"</strong>, or <strong>"Potential Anomaly"</strong>. Operators investigate evidence calmly before dispatching field security.
          </p>
        </div>
      </div>

      {/* Main Grid: Active Alerts List + Detailed Investigation Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Active Security Alerts List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Security Alerts
            </span>
            <span className="text-xs font-mono text-rose-400 font-bold">
              {securityAlerts.filter((a) => a.status !== 'Resolved').length} Open Incident(s)
            </span>
          </div>

          <div className="space-y-2.5">
            {securityAlerts.map((alert) => {
              const isSelected = alert.id === selectedAlert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 border-rose-500/60 shadow-xl'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-400">
                        #{alert.id}
                      </span>
                      <span className="font-mono text-xs text-cyan-300 font-semibold">
                        {alert.shipmentId}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        alert.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : alert.status === 'Verification Requested'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white">{alert.title}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {alert.actualMovement}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Detected: {alert.detectedAt}</span>
                    <span className="text-rose-400 font-bold uppercase">{alert.anomalyType}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anomaly Detection Matrix Taxonomy */}
          <div className="mt-4 p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Supervised Anomaly Taxonomy (9 Vectors)
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {anomalyCategories.slice(0, 6).map((cat, idx) => (
                <div key={idx} className="p-1.5 rounded bg-slate-950 border border-slate-800/80 text-slate-300">
                  <span className="font-semibold text-cyan-300 block">{cat.type}</span>
                  <span className="text-slate-500 truncate block">{cat.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Investigation Dossier */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-4 lg:p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-rose-400">
                  Incident Investigation #{selectedAlert.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {selectedAlert.riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target Consignment: <strong className="font-mono text-cyan-400">{selectedAlert.shipmentId}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Current Status</span>
              <span className="text-xs font-bold font-mono text-white">{selectedAlert.status}</span>
            </div>
          </div>

          {/* Incident Telemetry Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Approved Geofence Corridor:
              </span>
              <p className="text-slate-300">{selectedAlert.expectedRoute}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-rose-900/40">
              <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
                Actual Spatial Divergence:
              </span>
              <p className="text-slate-200">{selectedAlert.actualMovement}</p>
              {selectedAlert.deviationKm && (
                <div className="mt-1 font-mono text-rose-400 font-bold text-xs">
                  Offset: +{selectedAlert.deviationKm} km
                </div>
              )}
            </div>
          </div>

          {/* AI Evidentiary Assessment */}
          <div className="p-3.5 bg-cyan-950/30 rounded-xl border border-cyan-500/40 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                Route Risk Agent Evaluation:
              </span>
              <span className="text-[10px] font-mono text-cyan-300">Evidentiary Grounding Verified</span>
            </div>
            <p className="text-slate-200 leading-relaxed italic">
              "{selectedAlert.aiAssessment}"
            </p>
            <div className="pt-2 border-t border-cyan-900/50 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Recommended Action:</span>
              <strong className="text-cyan-300">{selectedAlert.recommendedAction}</strong>
            </div>
          </div>

          {/* Digital Forensic Evidence Timeline */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
              Multi-Sensor Digital Evidence Timeline
            </span>

            <div className="space-y-2">
              {selectedAlert.evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between text-xs gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-cyan-400 text-[11px] font-bold shrink-0 mt-0.5">
                      {item.time}
                    </span>
                    <div>
                      <div className="text-slate-200 font-semibold">{item.event}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.details}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">Sensor: {item.sensor}</div>
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      item.status === 'Anomaly'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : item.status === 'Warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Decision Station */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            {selectedAlert.status === 'Resolved' ? (
              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/40 text-emerald-200 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Incident Resolved
                </div>
                <div className="mt-1 text-[11px] text-slate-300">
                  Resolution Note: {selectedAlert.verificationNotes || 'Verified legitimate detour via driver telematics.'}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    requestDriverVerification(
                      selectedAlert.id,
                      'Telematics query issued to Driver D-118. In-cab radio query active.'
                    )
                  }
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Request Driver Verification
                </button>

                <button
                  onClick={() => {
                    resolveSecurityAlert(
                      selectedAlert.id,
                      'Driver Ahmad Faiz confirmed detour due to fallen tree branch on trunk road; safely returned to PLUS corridor at KM 54.'
                    );
                  }}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Resolved (Clear Anomaly)
                </button>

                <button
                  onClick={() =>
                    escalateSecurityAlert(selectedAlert.id, 'Escalated to High-Value Asset Field Response Team')
                  }
                  className="py-2 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Escalate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
