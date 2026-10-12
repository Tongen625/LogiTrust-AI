import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { AlertTriangle, ShieldAlert, MapPinned, Send, CheckCircle2, Siren, Lock } from 'lucide-react';

export const SecurityOfficerAppView: React.FC = () => {
  const { securityAlerts, requestDriverVerification, resolveSecurityAlert, escalateSecurityAlert } = useLogistics();
  const [message, setMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage((current) => (current === msg ? null : current)), 4200);
  };

  const primaryAlert = useMemo(
    () => securityAlerts.find((alert) => alert.id === 'TR102') || securityAlerts[0],
    [securityAlerts]
  );

  const activeCount = securityAlerts.filter((alert) => alert.status !== 'Resolved').length;

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-slate-950 rounded-[36px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[700px] text-slate-100 relative">
        <div className="bg-slate-900 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800">
          <span>10:04 AM</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
          <span className="text-cyan-400">5G • 94%</span>
        </div>

        {message && (
          <div className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-[11px] flex items-center justify-between shadow-lg">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="font-extrabold ml-2">✕</button>
          </div>
        )}

        <div className="bg-slate-900/90 p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Security Officer App</h2>
              <p className="text-[11px] text-slate-400">Non-accusatory evidentiary anomaly review</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs border border-rose-500/30">
              NF
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Open Alerts</span>
              <strong className="text-rose-400 text-base">{activeCount}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Risk Focus</span>
              <strong className="text-white text-base">Geofence</strong>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {primaryAlert && (
            <div className="p-3.5 bg-slate-900 rounded-2xl border border-rose-500/40 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-rose-300">Primary Incident</span>
                <span className="font-mono text-xs font-bold text-white">#{primaryAlert.id}</span>
              </div>
              <div className="space-y-1">
                <div className="text-slate-200 font-semibold">{primaryAlert.title}</div>
                <div className="text-[11px] text-slate-400">Shipment: {primaryAlert.shipmentId}</div>
                <div className="text-[11px] text-slate-400">Status: {primaryAlert.status}</div>
                <div className="text-[11px] text-slate-400">Risk: {primaryAlert.riskLevel}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    requestDriverVerification(primaryAlert.id, 'Requested from security mobile app');
                    notify('Driver verification request sent to the telematics/driver workspace.');
                  }}
                  className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] shadow transition"
                >
                  <Send className="w-3 h-3" /> Request Verify
                </button>
                <button
                  onClick={() => {
                    resolveSecurityAlert(primaryAlert.id, 'Resolved from mobile security app');
                    notify('Incident marked resolved and written to the audit trail.');
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] transition"
                >
                  <CheckCircle2 className="w-3 h-3" /> Resolve
                </button>
              </div>
              <button
                onClick={() => {
                  escalateSecurityAlert(primaryAlert.id, 'Escalated from mobile security app');
                  notify('Incident escalated for further field/security review.');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] transition"
              >
                <Siren className="w-3 h-3" /> Escalate Incident
              </button>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Evidence Timeline</span>
            {primaryAlert?.evidence.slice(0, 4).map((item, index) => (
              <div key={`${item.time}-${index}`} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{item.time}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.status === 'Anomaly' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">{item.event}</div>
                <div className="text-[10px] text-slate-500 mt-1">{item.sensor}</div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block">Recommended Action</span>
            <div className="text-slate-200 leading-relaxed">{primaryAlert?.recommendedAction}</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Expected Route</span><strong className="text-slate-200">Approved Corridor</strong></div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Offset</span><strong className="text-rose-300">{primaryAlert?.deviationKm ?? 0} km</strong></div>
            </div>
          </div>

          <div className="p-2.5 bg-rose-950/30 rounded-xl border border-rose-500/40 text-[10px] text-rose-100 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-400" /> Evidentiary Safeguard
            </div>
            <p>
              This app cannot automatically accuse a driver of theft or fraud. It only records evidence, requests verification and escalates for human investigation.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-2 flex justify-around text-[10px] text-slate-400 font-medium">
          <span className="text-cyan-400 font-bold">Alerts</span>
          <span>Evidence</span>
          <span>Actions</span>
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
};
