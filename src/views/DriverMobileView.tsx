import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  Smartphone,
  Navigation,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Camera,
  PenTool,
  Clock,
  Shield,
  MapPin,
  Send,
  Lock,
  Train,
  Building2,
} from 'lucide-react';

export const DriverMobileView: React.FC = () => {
  const { shipments, submitHandoffEvidence } = useLogistics();

  const [activeJobStep, setActiveJobStep] = useState<'details' | 'origin-gate' | 'rail-loading' | 'dest-gate'>('details');
  const [incidentReported, setIncidentReported] = useState(false);
  const [incidentText, setIncidentText] = useState('');

  const [mobileMessage, setMobileMessage] = useState<string | null>(null);

  const showMobileNotice = (msg: string) => {
    setMobileMessage(msg);
    setTimeout(() => {
      setMobileMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

  const nextJob = shipments.find((s) => s.id === 'MY102938') || shipments[0];

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-sm bg-slate-950 rounded-[36px] border-4 border-slate-750 shadow-2xl overflow-hidden flex flex-col min-h-[640px] text-slate-100 relative">
        {/* Mobile Status Bar */}
        <div className="bg-slate-900 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800">
          <span>10:24 AM</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
          <span className="text-cyan-400">5G • 98%</span>
        </div>

        {/* In-app driver message alert toast */}
        {mobileMessage && (
          <div className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-[11px] flex items-center justify-between shadow-lg animate-in fade-in">
            <span>{mobileMessage}</span>
            <button onClick={() => setMobileMessage(null)} className="text-slate-900 hover:text-white font-extrabold ml-2">✕</button>
          </div>
        )}

        {/* Mobile Header */}
        <div className="bg-slate-900/90 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Driver Faiz (D-118)</h2>
              <p className="text-[11px] text-slate-400">Linehaul Truck V-889 • KL-Ipoh Corridor Fleet</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              DF
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Active Linehauls</span>
              <strong className="text-white text-base">4 Hub Runs</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Corridor Alert</span>
              <strong className="text-rose-400 text-base">1 Deviation</strong>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Next Inter-Hub Job Card */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-cyan-500/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Current Hub Consignment</span>
              <span className="font-mono text-xs font-bold text-white">{nextJob.id}</span>
            </div>

            <div className="space-y-1">
              <div className="text-slate-200 font-semibold">{nextJob.category}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Origin: {nextJob.originHub}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Destination: {nextJob.destinationHub}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Hub Arrival SLA: {nextJob.targetArrival}</span>
              </div>
            </div>

            {/* Quick Driver Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => showMobileNotice(`Navigating via designated PLUS highway corridor to destination hub.`)}
                className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] shadow transition"
              >
                <Navigation className="w-3 h-3" /> Highway Route
              </button>
              <button
                onClick={() => showMobileNotice(`Custody seal barcode for ${nextJob.id} captured and queued for Trust / Handoff Agent checks.`)}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] transition"
              >
                <QrCode className="w-3 h-3" /> Scan Hub Seal
              </button>
            </div>
          </div>

          {/* Workflow Actions (Stages 3 to 7) */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Operational Milestones (Stages 3 - 7)
            </span>

            <button
              onClick={() => {
                setActiveJobStep('origin-gate');
                showMobileNotice('Origin Hub Sorting & Seal custody logged.');
              }}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left flex items-center justify-between font-semibold text-slate-200"
            >
              <span>Stage 3: Origin Hub & Sorting</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => {
                setActiveJobStep('rail-loading');
                showMobileNotice('Route / service allocation received from Transport Coordinator.');
              }}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left flex items-center justify-between font-semibold text-slate-200"
            >
              <span>Stage 4: Route & Schedule Planning</span>
              <Train className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => showMobileNotice('Stage 5 transit telemetry sent to Live Tracking.')}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-left flex items-center justify-between font-semibold text-slate-200"
            >
              <span>Stage 5: Transit Monitoring Update</span>
              <Navigation className="w-4 h-4 text-blue-400" />
            </button>

            <button
              onClick={() => {
                setActiveJobStep('dest-gate');
                submitHandoffEvidence('HO-1029');
                showMobileNotice('Destination-hub handoff evidence submitted. Awaiting Hub Operator verification.');
              }}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 border border-cyan-500/40 rounded-xl text-left flex items-center justify-between font-semibold text-white"
            >
              <span>Stage 6: Submit Destination Hub Handoff</span>
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </button>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Stage 7: Last-Mile Dispatch</span>
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Assigned Driver</span><strong className="text-slate-200">D-118 Ahmad Faiz</strong></div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Vehicle</span><strong className="text-slate-200">V-889</strong></div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Dispatch Route</span><strong className="text-slate-200">KL Hub → Dispatch Zone</strong></div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Operational ETA</span><strong className="text-slate-200">17:05</strong></div>
              </div>
              <button
                onClick={() => showMobileNotice('Stage 7 dispatch status updated. This stage is operational tracking only; Trust / Handoff Agent scope ended at the destination hub.')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-semibold text-emerald-300 transition"
              >
                Update Dispatch Status: Dispatched
              </button>
              <p className="text-[10px] text-slate-500 leading-relaxed">Operational fields only: driver, vehicle, route, status and ETA. No recipient, OTP, signature or proof-of-delivery functions are included.</p>
            </div>
          </div>

          {/* Incident / Detour Reporting */}
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">
              Driver Telematics Incident Report
            </span>
            <input
              type="text"
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="e.g. Fallen branch at Batang Kali, detouring 3km"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
            />
            <button
              onClick={() => {
                setIncidentReported(true);
                showMobileNotice('Detour incident transmitted to Security & Risk Officer console.');
              }}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold rounded-lg transition"
            >
              Send Telematics Note to Control Tower
            </button>
          </div>

          {/* CRITICAL SAFEGUARD WARNING */}
          <div className="p-2.5 bg-rose-950/30 rounded-xl border border-rose-500/40 text-[10px] text-rose-200 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-400" /> Security Safeguard Constraint
            </div>
            <p>
              Drivers cannot self-approve or dismiss off-corridor geofence deviations. High-risk security exceptions must be cleared by the Security / Risk Officer.
            </p>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-2 flex justify-around text-[10px] text-slate-400 font-medium">
          <span className="text-cyan-400 font-bold">Hub Runs</span>
          <span>Scanner</span>
          <span>Telematics</span>
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
};
