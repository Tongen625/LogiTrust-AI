import React from 'react';
import {
  Shield,
  Radio,
  Cpu,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onEnterControlTower: () => void;
}

export const LandingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onEnterControlTower,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-slate-700/80 rounded-3xl p-6 lg:p-8 shadow-2xl text-slate-100 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            ENTERPRISE LOGISTICS CONTROL TOWER • DIGITAL TRUST ARCHITECTURE
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            LogiTrust <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>
          </h1>

          <div className="text-sm font-semibold text-slate-300 space-x-2">
            <span>Secure Logistics.</span>
            <span className="text-cyan-400">•</span>
            <span>Trusted Decisions.</span>
            <span className="text-cyan-400">•</span>
            <span className="text-blue-400">Agentic Intelligence.</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Autonomous multi-agent orchestration platform for intermodal supply chain security, route optimization, and human-in-the-loop governance.
          </p>
        </div>

        {/* 3 Main Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-6 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              1. AI Logistics Orchestration
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              5 specialised agents continuously monitor train delays, road congestion, and intermodal capacity to optimize routes in real time.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              2. Digital Trust Verification
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Detects off-corridor deviations, GPS anomalies and invalid handoffs using five-point custody evidence checks.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              3. Human-Governed Automation
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Consequential transport decisions require human operator approval with full evidence transparency and complete audit logging.
            </p>
          </div>
        </div>

        {/* Workflow Banner */}
        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-center font-mono text-slate-300">
          <span className="text-cyan-400 font-bold">CORE CYCLE: </span>
          Observe → Verify → Reason → Optimise → Recommend → Human Approval → Execute → Audit
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={() => {
              onClose();
              onEnterControlTower();
            }}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4" />
            <span>Enter Operational Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
