import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  FileText,
  Search,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  Filter,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { AuditLogEntry } from '../types/logistics';

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useLogistics();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filtered = auditLogs.filter(
    (log) =>
      log.actor.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.event.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.evidence.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.result.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.hash.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (log.shipmentId && log.shipmentId.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              Audit Trail & Governance Ledger
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              EVENT • EVIDENCE • DECISION • OUTCOME
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete traceability from sensor observation to AI inference, operator adjudication and terminal execution
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Audit references enabled</span>
        </div>
      </div>

      {/* Search & Statistics */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search audit trail by actor, event, shipment ID, or cryptohash..."
            className="w-full bg-slate-950 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-cyan-400">{filtered.length}</strong> logged transactions
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/70">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Event Description</th>
                <th className="py-2.5 px-3">Evidence Attached</th>
                <th className="py-2.5 px-3">AI Decision</th>
                <th className="py-2.5 px-3">Human Decision</th>
                <th className="py-2.5 px-3">Execution Result</th>
                <th className="py-2.5 px-3 font-mono">Crypto Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedEntry(log)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-200">{log.actor}</div>
                    <div className="text-[10px] text-slate-500">{log.role}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">
                    <div className="truncate max-w-[180px]">{log.event}</div>
                    {log.shipmentId && (
                      <span className="text-[10px] font-mono text-cyan-400">{log.shipmentId}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <div className="truncate max-w-[180px] text-[11px]">{log.evidence}</div>
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 text-[11px]">
                    <div className="truncate max-w-[160px]">{log.aiDecision}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.humanDecision.includes('APPROVED') || log.humanDecision.includes('Auto')
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : log.humanDecision.includes('REJECTED')
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {log.humanDecision}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-300">
                    <div className="truncate max-w-[180px]">{log.result}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {log.hash.slice(0, 10)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Inspector Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Audit Entry Record #{selectedEntry.id}</h3>
                  <span className="text-[10px] font-mono text-cyan-400">{selectedEntry.timestamp}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Actor</span>
                  <div className="font-bold text-white">{selectedEntry.actor}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{selectedEntry.role}</div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Event Classification</span>
                  <div className="font-bold text-white">{selectedEntry.event}</div>
                  {selectedEntry.shipmentId && (
                    <div className="text-[10px] text-cyan-400 font-mono">Consignment: {selectedEntry.shipmentId}</div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Digital Evidence Recorded:</span>
                <p className="text-slate-200 font-mono text-[11px]">{selectedEntry.evidence}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-cyan-400 block">AI Autonomous Reasoning:</span>
                <p className="text-slate-200">{selectedEntry.aiDecision}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-400 block">Human Decision Gate:</span>
                <p className="text-slate-200 font-bold">{selectedEntry.humanDecision}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">System Execution State:</span>
                <p className="text-slate-200">{selectedEntry.result}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">Audit Reference:</span>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span>{selectedEntry.hash}</span>
                  <button onClick={() => copyHash(selectedEntry.hash)} className="hover:text-white">
                    {copiedHash === selectedEntry.hash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close Audit Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
