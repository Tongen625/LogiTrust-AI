import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  Cpu,
  Clock,
  AlertCircle,
  ShieldCheck,
  PackageCheck,
  GitBranch,
  Activity,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { AIAgent } from '../types/logistics';

export const AIAgentArchitectureBar: React.FC = () => {
  const { agents } = useLogistics();
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'Scheduling Agent':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'Disruption Agent':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'Route Risk Agent':
        return <Activity className="w-4 h-4 text-rose-400" />;
      case 'Trust / Handoff Agent':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'Decision Agent':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Monitoring':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-cyan-300 border border-cyan-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Monitoring
          </span>
        );
      case 'Analysing':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/40 text-amber-300 border border-amber-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            Analysing
          </span>
        );
      case 'Waiting for Approval':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Approval Gate
          </span>
        );
      case 'Action Required':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-950/60 text-rose-300 border border-rose-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
            Action Required
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-700/50">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Agentic AI Autonomous Mesh Network
            </h3>
            <span className="text-[11px] text-slate-400">
              (Observe → Verify → Reason → Optimise → Recommend → Approve → Execute)
            </span>
          </div>
          <div className="text-[11px] font-mono text-cyan-400/90 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            5/5 Specialised Agents Synchronised
          </div>
        </div>

        {/* 5 Agent Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="group cursor-pointer bg-slate-950/70 hover:bg-slate-800/70 p-2.5 rounded-lg border border-slate-800/80 hover:border-cyan-500/40 transition duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800">
                    {getAgentIcon(agent.name)}
                  </div>
                  {getStatusBadge(agent.status)}
                </div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                  {agent.name}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {agent.currentTask}
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>Confidence: <strong className="text-slate-200">{agent.confidence}%</strong></span>
                <span className="text-slate-400 font-mono">{agent.lastActive}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedAgent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                {getAgentIcon(selectedAgent.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedAgent.name}</h3>
                  {getStatusBadge(selectedAgent.status)}
                </div>
                <p className="text-xs text-slate-400">ID: {selectedAgent.id} • Mesh Node #0{agents.indexOf(selectedAgent) + 1}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Current Micro-Task:</span>
                <p className="text-cyan-200">{selectedAgent.currentTask}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Decision Confidence</span>
                  <div className="text-lg font-bold text-white mt-0.5">{selectedAgent.confidence}%</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${selectedAgent.confidence}%` }}></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Telemetry Heartbeat</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">0.42 ms</div>
                  <span className="text-[10px] text-slate-400">Zero packet loss</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Governance & Trust Guardrails:</span>
                <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                  <li>Operates under Human-in-the-Loop decision governance policy.</li>
                  <li>Consequential rerouting requires explicit operator authorization.</li>
                  <li>Every consequential agent recommendation, evidence summary and human decision is recorded in the audit trail.</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
