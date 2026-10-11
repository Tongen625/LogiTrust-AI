import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MalaysiaLogisticsMap } from '../components/MalaysiaLogisticsMap';
import { AIAgentArchitectureBar } from '../components/AIAgentArchitectureBar';
import {
  Radio,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  FileSearch,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export const ControlTowerView: React.FC = () => {
  const {
    shipments,
    selectedShipmentId,
    setSelectedShipmentId,
    recommendations,
    approveRecommendation,
    rejectRecommendation,
    setActiveTab,
    auditLogs,
    simulationResult,
  } = useLogistics();

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);

  // Active AI Recommendation
  const rec = recommendations[0];
  const targetShipment = shipments.find((s) => s.id === rec?.shipmentId) || shipments[0];

  const pendingCount = recommendations.filter((r) => r.status === 'Pending Approval').length;
  const delayedShipments = shipments.filter((s) => s.delayMinutes > 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Top Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              AI Logistics Control Tower
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SYSTEM LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time intermodal tracking, cybersecurity anomaly detection & human-governed orchestration
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Active Fleet</span>
            <span className="text-base font-bold text-white">38 Shipments</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Pending AI Approvals</span>
            <span className="text-base font-bold text-cyan-400">{pendingCount} Action Req.</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">On-Time Reliability</span>
            <span className="text-base font-bold text-emerald-400">92% Target</span>
          </div>
        </div>
      </div>

      {/* Autonomous Mesh Architecture */}
      <AIAgentArchitectureBar />

      {/* Main Grid: Live Map + AI Recommendation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (7 cols): Map + Disruption Alerts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 shadow-xl">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  National Multi-Modal Corridor Telemetry
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                Johor Bahru • Melaka • KL • Ipoh • Penang
              </span>
            </div>
            <MalaysiaLogisticsMap heightClass="h-[430px]" />
          </div>

          {/* Active Disruption Queue */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Active Disruption & Incident Stream
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {delayedShipments.length} Impacted Shipments
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Rail Disruption
                    </span>
                    <span className="text-xs font-bold text-white">
                      Train T105 Delayed 90 Minutes (Kluang Signaling)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                    <span>Affected Shipments:</span>
                    <span className="font-mono text-cyan-300 font-bold">MY102938</span>
                    <span className="font-mono text-slate-400">MY309812</span>
                    <span className="font-mono text-slate-400">MY287611</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    AI Solved: T108 Slot
                  </span>
                  <button
                    onClick={() => setShowSimModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): AI Recommendation Engine & Human-in-the-Loop Gate */}
        <div className="lg:col-span-5 space-y-4">
          {/* THE AI RECOMMENDATION CARD */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border-2 border-cyan-500/40 p-4 shadow-2xl relative overflow-hidden">
            {/* Header glow accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">
                    Agentic AI Recommendation Engine
                  </h2>
                  <span className="text-[11px] font-mono text-cyan-300">
                    Decision ID: {rec?.id || 'REC-1029'}
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                  rec?.status === 'Approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : rec?.status === 'Rejected'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                }`}
              >
                {rec?.status || 'Pending Approval'}
              </span>
            </div>

            {/* Target Shipment Summary */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Target Shipment</span>
                <span className="font-mono text-sm font-extrabold text-cyan-400">{rec?.shipmentId}</span>
                <span className="text-[11px] text-slate-300 block">{targetShipment.category}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Destination Hub SLA</span>
                <span className="text-xs font-bold text-amber-300">{targetShipment.targetArrival}</span>
                <span className="text-[11px] text-slate-400 block">{targetShipment.origin} → {targetShipment.destination}</span>
              </div>
            </div>

            {/* Detected Event & Downstream Impact */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
                <span className="font-bold text-rose-400 text-[10px] uppercase block mb-0.5">
                  Detected Disruption Event:
                </span>
                <p className="text-slate-200">{rec?.detectedEvent}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40">
                <span className="font-bold text-amber-400 text-[10px] uppercase block mb-0.5">
                  Downstream Impact Analysis:
                </span>
                <p className="text-slate-200">{rec?.impact}</p>
              </div>
            </div>

            {/* AI Recommendation & Justification */}
            <div className="mt-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider">
                  Recommended Autonomous Action:
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {rec?.confidence}% Confidence
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{rec?.recommendation}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-cyan-900/40">
                <strong className="text-cyan-300 font-semibold">Reasoning: </strong>
                {rec?.reason}
              </p>
            </div>

            {/* Metrics Breakdown Matrix */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Expected Result</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  +{rec?.expectedImprovementMins} min Recovery
                </span>
                <span className="text-[10px] text-slate-400">Arrives 16:06 (SLA Met)</span>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Carriage Capacity</span>
                <span className="font-bold text-cyan-400 mt-0.5 block">{rec?.capacityStatus}</span>
                <span className="text-[10px] text-slate-400">T108 54% loaded</span>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Connection Window</span>
                <span className="font-bold text-slate-200 mt-0.5 block">{rec?.connectionTime}</span>
                <span className="text-[10px] text-slate-400">Johor Hub Bay 4 staging</span>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Security / Chain of Custody</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">{rec?.securityRisk}</span>
                <span className="text-[10px] text-slate-400">Biometric handoff seal OK</span>
              </div>
            </div>

            {/* CRITICAL SAFEGUARD BANNER */}
            <div className="mt-3.5 p-2 bg-slate-950 rounded-lg border border-amber-500/40 flex items-start gap-2 text-[11px] text-amber-200">
              <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Human-in-the-Loop Safeguard: </strong>
                Agentic AI cannot unilaterally alter consequential transport plans. Human operator approval is legally required before execution.
              </div>
            </div>

            {/* ACTION BUTTONS: APPROVE / REJECT / REVIEW EVIDENCE */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
              {rec?.status === 'Pending Approval' ? (
                <>
                  <button
                    onClick={() => approveRecommendation(rec.id, 'Approved via Control Tower Interface')}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Decision
                  </button>

                  <button
                    onClick={() => rejectRecommendation(rec.id, 'Operator prefers holding baseline plan')}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-rose-950/60 hover:border-rose-700 text-slate-300 hover:text-rose-300 font-bold text-xs rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              ) : (
                <div className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs font-mono">
                  Decision recorded as <strong className="text-white">{rec?.status}</strong>. Manifest synced.
                </div>
              )}

              <button
                onClick={() => setShowEvidenceModal(true)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition"
              >
                <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                Review Evidence
              </button>

              <button
                onClick={() => setShowSimModal(true)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1 transition"
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                What-If Sim
              </button>
            </div>
          </div>

          {/* Audit Events Live Teaser */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 text-xs shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                Audit Event Stream
              </span>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                Full Trail <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-2 space-y-1.5 font-mono text-[11px]">
              {auditLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-cyan-400 font-bold">{log.timestamp}</span>: {log.event}
                  </div>
                  <span className="text-slate-500 text-[10px] shrink-0">{log.hash.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Multi-Factor Evidence Bundle • REC-1029
                </h3>
              </div>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Explainable AI decision basis used to recommend transferring parcel MY102938 to Train T108:
            </p>

            <div className="space-y-2">
              {rec?.evidence?.map((item: string, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px] font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Alternatives Evaluated:</span>
              <div className="space-y-1.5">
                {rec?.alternativesConsidered?.map((alt: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-900 border border-slate-800">
                    <span className="font-semibold text-slate-200">{alt.name}</span>
                    <span className="font-mono text-cyan-400">{alt.eta} (Score: {alt.score}/100)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What-If Simulation Sandbox Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  Interactive What-If Simulation: Train T105 90m Delay
                </h3>
              </div>
              <button onClick={() => setShowSimModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Baseline */}
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/40">
                <div className="text-[10px] font-bold uppercase text-rose-400">Current Plan (Hold)</div>
                <div className="text-sm font-bold text-white mt-1">Train T105 (Hold)</div>
                <div className="mt-2 space-y-1 text-slate-300 font-mono text-[11px]">
                  <div>ETA: <span className="text-rose-400">17:20</span></div>
                  <div>Deadline: <span className="text-rose-400">Missed (-50m)</span></div>
                  <div>Cost Index: 100 (Baseline)</div>
                  <div>Risk: High</div>
                </div>
              </div>

              {/* Alt A */}
              <div className="p-3 rounded-xl bg-cyan-950/40 border-2 border-cyan-500/50 relative">
                <span className="absolute -top-2 right-2 bg-cyan-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  AI RECOMMENDED
                </span>
                <div className="text-[10px] font-bold uppercase text-cyan-400">Alternative A</div>
                <div className="text-sm font-bold text-white mt-1">Train T108 Slot</div>
                <div className="mt-2 space-y-1 text-slate-300 font-mono text-[11px]">
                  <div>ETA: <span className="text-cyan-300">16:06</span> (+74m)</div>
                  <div>Deadline: <span className="text-emerald-400">Feasible</span></div>
                  <div>Cost Index: 104 (+4%)</div>
                  <div>Risk: Low</div>
                </div>
              </div>

              {/* Alt B */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Alternative B</div>
                <div className="text-sm font-bold text-white mt-1">Road Hotshot TR-909</div>
                <div className="mt-2 space-y-1 text-slate-300 font-mono text-[11px]">
                  <div>ETA: 17:00 (+20m)</div>
                  <div>Deadline: Tight</div>
                  <div>Cost Index: 165 (+65%)</div>
                  <div>Risk: Medium</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
              <strong>Optimization Summary: </strong>
              Alternative A recovers 74 minutes of transit delay with nominal cost increase (+4%) by booking available capacity on Train T108 at Johor Sentral Hub.
            </p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Requires Operations Manager approval</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSimModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    approveRecommendation('REC-1029', 'Applied via What-If Simulator');
                    setShowSimModal(false);
                  }}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Apply Alternative A Recommendation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
