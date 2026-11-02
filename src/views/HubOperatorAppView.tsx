import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { CheckCircle2, ShieldCheck, ScanLine, Building2, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export const HubOperatorAppView: React.FC = () => {
  const { handoffs, verifyHandoffAction } = useLogistics();
  const [message, setMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage((current) => (current === msg ? null : current)), 4200);
  };

  const primaryHandoff = useMemo(
    () => handoffs.find((handoff) => handoff.status === 'REQUIRES REVIEW') || handoffs[0],
    [handoffs]
  );

  const verifiedCount = handoffs.filter((handoff) => handoff.status === 'VERIFIED').length;

  const renderCheck = (label: string, ok: boolean) => (
    <div className={`p-2 rounded-lg border text-center ${ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
      <div className="font-semibold">{label}</div>
      <div className="text-[10px] mt-0.5">{ok ? '✓' : '✕'}</div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-slate-950 rounded-[36px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[700px] text-slate-100 relative">
        <div className="bg-slate-900 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800">
          <span>09:45 AM</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
          <span className="text-cyan-400">WiFi • 99%</span>
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
              <h2 className="text-sm font-bold text-white">Hub Operator App</h2>
              <p className="text-[11px] text-slate-400">5-point custody checks through Stage 6 only</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              ZM
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Verified Today</span>
              <strong className="text-emerald-300 text-base">{verifiedCount}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Review Queue</span>
              <strong className="text-amber-300 text-base">{handoffs.filter((h) => h.status !== 'VERIFIED').length}</strong>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {primaryHandoff && (
            <div className="p-3.5 bg-slate-900 rounded-2xl border border-cyan-500/40 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-400">Current Handoff Review</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${primaryHandoff.status === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>{primaryHandoff.status}</span>
              </div>
              <div className="space-y-1">
                <div className="text-slate-200 font-semibold">{primaryHandoff.parcelId}</div>
                <div className="text-[11px] text-slate-400">From: {primaryHandoff.fromParty}</div>
                <div className="text-[11px] text-slate-400">To: {primaryHandoff.toParty}</div>
                <div className="text-[11px] text-slate-400">Location: {primaryHandoff.location}</div>
                <div className="text-[11px] text-slate-400">Time: {primaryHandoff.timestamp}</div>
              </div>
              <div className="grid grid-cols-5 gap-1 text-[10px]">
                {renderCheck('ID', primaryHandoff.checks.identity)}
                {renderCheck('Parcel', primaryHandoff.checks.parcelId)}
                {renderCheck('Geo', primaryHandoff.checks.location)}
                {renderCheck('Time', primaryHandoff.checks.timestamp)}
                {renderCheck('Seq', primaryHandoff.checks.sequence)}
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500">Trust Score</span>
                <strong className="text-cyan-300">{primaryHandoff.trustScore}%</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    verifyHandoffAction(primaryHandoff.id);
                    notify('Hub handoff approved and trust status updated to VERIFIED.');
                  }}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] shadow transition"
                >
                  <CheckCircle2 className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => notify('Re-scan / evidence resubmission requested from the handoff party.')}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] transition"
                >
                  <ScanLine className="w-3 h-3" /> Request Re-scan
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Recent Custody Tokens</span>
            {handoffs.slice(0, 3).map((handoff) => (
              <div key={handoff.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{handoff.parcelId}</div>
                    <div className="text-[11px] text-slate-400">{handoff.location}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${handoff.status === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>{handoff.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/30 text-[10px] text-emerald-100 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-emerald-300" /> Scope Guardrail
            </div>
            <p>
              The Trust / Handoff Agent and this app operate through Stage 6 Destination Hub only. Stage 7 continues as operational dispatch tracking without recipient verification.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border-t border-slate-800 p-2 flex justify-around text-[10px] text-slate-400 font-medium">
          <span className="text-cyan-400 font-bold">Queue</span>
          <span>Verify</span>
          <span>Hubs</span>
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
};
