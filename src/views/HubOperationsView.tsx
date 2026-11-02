import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Fingerprint,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  Train,
  Truck,
  ArrowRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import { HubHandoffVerification } from '../types/logistics';

export const HubOperationsView: React.FC = () => {
  const { handoffs, verifyHandoffAction, hubs } = useLogistics();
  const [selectedHandoff, setSelectedHandoff] = useState<HubHandoffVerification | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [hubNotice, setHubNotice] = useState<string | null>(null);

  const showHubNotice = (msg: string) => {
    setHubNotice(msg);
    setTimeout(() => {
      setHubNotice((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  const filteredHandoffs = handoffs.filter((h) => {
    if (filterStatus === 'ALL') return true;
    return h.status === filterStatus;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              Hub Terminal Operations & Chain of Custody
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              TRUST / HANDOFF AGENT ACTIVE (UNTIL HUB)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Custody exchange validation & 5-point verification at Origin Hub, Rail Terminal, and Destination Hub
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          Trust Threshold: <strong className="text-white">90%</strong> • Active Custody Points: <strong className="text-white">5 Hubs</strong>
        </div>
      </div>

      {/* Hub Operational Notice */}
      {hubNotice && (
        <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center justify-between">
          <span>{hubNotice}</span>
          <button onClick={() => setHubNotice(null)} className="text-amber-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Scope Safeguard Banner: Mid-Mile / Hub-to-Hub Only */}
      <div className="p-3 bg-slate-900/90 rounded-2xl border border-emerald-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-0.5">
          <div className="font-bold text-white flex items-center gap-2">
            <span>Intermodal Custody Scope: Stage 3 Origin Hub & Sorting → Stage 4 Route & Schedule Planning → Stage 5 Transit → Stage 6 Destination Hub</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              TRUST SCOPE: STAGES 3 TO 6
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The Trust / Handoff Agent continuously audits physical-to-digital custody exchanges between transport drivers, sorting bays, rail yard terminals, and destination receiving gates.
          </p>
        </div>
      </div>

      {/* Hub Terminal Capacity Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {hubs.map((hub) => (
          <div key={hub.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 shadow-md">
            <div className="text-[10px] font-mono text-cyan-400 uppercase">{hub.code}</div>
            <div className="text-xs font-bold text-white truncate mt-0.5">{hub.name.split(' ')[0]} Hub</div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Load:</span>
              <strong className="text-slate-200">{hub.capacityUtilization}%</strong>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${hub.capacityUtilization > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${hub.capacityUtilization}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Custody List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Live Hub Custody Verification Stream (5-Point Handoff Engine)
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="ALL">All Custody Tokens</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="REQUIRES REVIEW">Requires Review</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHandoffs.map((ho) => {
            const isVerified = ho.status === 'VERIFIED';
            return (
              <div
                key={ho.id}
                className={`p-4 rounded-2xl border shadow-xl flex flex-col justify-between space-y-3 ${
                  isVerified
                    ? 'bg-slate-900/80 border-slate-800'
                    : 'bg-amber-950/20 border-amber-600/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{ho.parcelId}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{ho.id}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                      }`}
                    >
                      {ho.status}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="text-slate-400 text-[11px]">
                      From: <strong className="text-slate-200">{ho.fromParty}</strong>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      To: <strong className="text-slate-200">{ho.toParty}</strong>
                    </div>
                    <div className="text-slate-400 text-[11px] truncate">
                      Location: <span className="text-slate-300">{ho.location}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Device: {ho.deviceId} • {ho.timestamp}
                    </div>
                  </div>

                  {/* 5-Point Verification Grid */}
                  <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                      <span>5-Point Checks</span>
                      <span className="font-mono text-cyan-400 font-bold">Trust Score: {ho.trustScore}%</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-mono pt-1 border-t border-slate-800/80">
                      <div className={`p-1 rounded ${ho.checks.identity ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                        Identity {ho.checks.identity ? '✓' : '✕'}
                      </div>
                      <div className={`p-1 rounded ${ho.checks.parcelId ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                        ID {ho.checks.parcelId ? '✓' : '✕'}
                      </div>
                      <div className={`p-1 rounded ${ho.checks.location ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                        Geo {ho.checks.location ? '✓' : '✕'}
                      </div>
                      <div className={`p-1 rounded ${ho.checks.timestamp ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                        Time {ho.checks.timestamp ? '✓' : '✕'}
                      </div>
                      <div className={`p-1 rounded ${ho.checks.sequence ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                        Seq {ho.checks.sequence ? '✓' : '⚠'}
                      </div>
                    </div>
                  </div>

                  {ho.notes && (
                    <p className="mt-2 text-[10px] text-slate-400 italic bg-slate-950/60 p-1.5 rounded">
                      {ho.notes}
                    </p>
                  )}
                </div>

                {!isVerified && (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => verifyHandoffAction(ho.id)}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      Approve Hub Handoff
                    </button>
                    <button
                      onClick={() => showHubNotice(`Escalated handoff ${ho.id} to Hub Security Supervisor for physical custody review.`)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-semibold transition"
                    >
                      Escalate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
