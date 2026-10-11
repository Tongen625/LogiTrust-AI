import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Shield,
  FileSearch,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const {
    recommendations,
    approveRecommendation,
    rejectRecommendation,
    shipments,
    setSelectedShipmentId,
    setActiveTab,
  } = useLogistics();

  const [activeEvidenceModal, setActiveEvidenceModal] = useState<any | null>(null);

  const pendingList = recommendations.filter((r) => r.status === 'Pending Approval');
  const historyList = recommendations.filter((r) => r.status !== 'Pending Approval');

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <CheckSquare className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              Human-in-the-Loop AI Approval Queue
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              GOVERNANCE GATEWAY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consequential routing, scheduling, and multi-modal freight decisions pending operator sign-off
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          Pending: <strong className="text-white">{pendingList.length}</strong> • Processed: <strong className="text-white">{historyList.length}</strong>
        </div>
      </div>

      {/* Governance Safeguard Notice */}
      <div className="p-3 bg-slate-900/90 rounded-2xl border border-amber-500/30 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-0.5">
          <div className="font-bold text-white">Algorithmic Restraint Policy</div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Autonomous execution without human approval is strictly prohibited for schedule modifications exceeding 30 minutes, carrier contract reallocations, or high-value shipments.
          </p>
        </div>
      </div>

      {/* Pending Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Pending Operator Authorization Queue ({pendingList.length})
          </h2>
        </div>

        {pendingList.length === 0 ? (
          <div className="p-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="font-bold text-slate-200 text-sm">No Pending AI Recommendations</div>
            <p className="text-xs">All autonomous suggestions have been adjudicated by operations personnel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingList.map((rec) => {
              const shipment = shipments.find((s) => s.id === rec.shipmentId);
              return (
                <div
                  key={rec.id}
                  className="bg-slate-900/90 rounded-2xl border-2 border-cyan-500/50 p-5 shadow-2xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-cyan-400">
                        {rec.shipmentId}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {shipment?.origin} → {shipment?.destination}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                        {rec.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                        Confidence: {rec.confidence}%
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{rec.timestamp}</span>
                    </div>
                  </div>

                  {/* Recommendation Title */}
                  <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/40">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                      Recommended Autonomous Action:
                    </span>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{rec.recommendation}</span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{rec.reason}</p>
                  </div>

                  {/* Metrics 4-Box Matrix */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Expected Result</span>
                      <strong className="text-emerald-400 text-sm mt-0.5 block">
                        +{rec.expectedImprovementMins} min Recovery
                      </strong>
                      <span className="text-[10px] text-slate-500">Arrives 16:06</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Capacity</span>
                      <strong className="text-cyan-400 text-sm mt-0.5 block">{rec.capacityStatus}</strong>
                      <span className="text-[10px] text-slate-500">Train T108 Slot</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Connection Buffer</span>
                      <strong className="text-slate-200 text-sm mt-0.5 block">{rec.connectionTime}</strong>
                      <span className="text-[10px] text-slate-500">Johor Hub Bay 4</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">Security Risk</span>
                      <strong className="text-emerald-400 text-sm mt-0.5 block">{rec.securityRisk}</strong>
                      <span className="text-[10px] text-slate-500">Custody Chain Intact</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => approveRecommendation(rec.id, 'Approved via Approval Queue')}
                      className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Execute Reroute
                    </button>

                    <button
                      onClick={() => rejectRecommendation(rec.id, 'Rejected by operator')}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-rose-950/60 hover:border-rose-700 text-slate-300 hover:text-rose-300 font-bold text-xs rounded-xl border border-slate-800 transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Plan
                    </button>

                    <button
                      onClick={() => setActiveEvidenceModal(rec)}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                      Inspect Evidence (5 Items)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Adjudicated History Table */}
      {historyList.length > 0 && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Adjudicated Governance Decisions History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/60">
                <tr>
                  <th className="py-2 px-3">Decision ID</th>
                  <th className="py-2 px-3">Shipment</th>
                  <th className="py-2 px-3">Recommendation</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Human Adjudication</th>
                  <th className="py-2 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {historyList.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{h.id}</td>
                    <td className="py-2.5 px-3 text-white">{h.shipmentId}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{h.recommendation}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{h.confidence}%</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          h.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{h.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Evidence Bundle • {activeEvidenceModal.id}</h3>
              <button onClick={() => setActiveEvidenceModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2">
              {activeEvidenceModal.evidence.map((item: string, i: number) => (
                <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200">
                  {item}
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
