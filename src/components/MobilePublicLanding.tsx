import React from 'react';
import { useLogistics, NavigationTab } from '../context/LogisticsContext';
import { UserRole } from '../types/logistics';
import {
  Truck,
  TrainFront,
  ShieldAlert,
  Building2,
  UserCog,
  MonitorUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  onEnterRole: (role: UserRole, tab: NavigationTab) => void;
  onEnterFullConsole: () => void;
}

const cards: Array<{
  role: UserRole;
  tab: NavigationTab;
  title: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    role: 'Driver',
    tab: 'driver-view',
    title: 'Driver App',
    description: 'Hub runs, scanning, telematics and handoff evidence.',
    icon: Truck,
  },
  {
    role: 'Transport Coordinator',
    tab: 'coordinator-app',
    title: 'Transport Coordinator',
    description: 'Train times, manual status fallback and rescheduling.',
    icon: TrainFront,
  },
  {
    role: 'Security / Risk Officer',
    tab: 'security-app',
    title: 'Security Officer',
    description: 'Route alerts, evidence review and driver verification.',
    icon: ShieldAlert,
  },
  {
    role: 'Hub Operator',
    tab: 'hub-app',
    title: 'Hub Operator',
    description: '5-point custody checks through Destination Hub.',
    icon: Building2,
  },
  {
    role: 'Logistics Operations Manager',
    tab: 'manager-app',
    title: 'Admin / Manager',
    description: 'Approvals, audit visibility and governance shortcuts.',
    icon: UserCog,
  },
];

export const MobilePublicLanding: React.FC<Props> = ({ onEnterRole, onEnterFullConsole }) => {
  const { userRole } = useLogistics();

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 overflow-y-auto">
      <div className="relative px-5 pt-8 pb-7 border-b border-slate-800 overflow-hidden">
        <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-24 -left-20 w-56 h-56 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logitrust-logo.jpeg" alt="LogiTrust AI" className="w-14 h-14 rounded-2xl object-cover bg-white border border-blue-100 shadow-md" />
            <div>
              <div className="text-xl font-extrabold tracking-tight">LogiTrust <span className="text-cyan-400">AI</span></div>
              <div className="text-[11px] text-slate-400">Secure Logistics & Digital Trust</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3" /> Public Prototype Experience
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-white">Choose how you want to explore the system.</h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Open a mobile role app for the clearest phone experience, or launch the full web control centre to explore the complete prototype.
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-3">
        {cards.map(({ role, tab, title, description, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => onEnterRole(role, tab)}
            className="w-full text-left p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition flex items-center gap-3 active:scale-[0.99]"
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white">{title}</div>
              <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{description}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          </button>
        ))}

        <div className="pt-2">
          <button
            onClick={onEnterFullConsole}
            className="w-full p-4 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/15 transition flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-cyan-500/25 text-cyan-300 flex items-center justify-center">
                <MonitorUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-cyan-200">Full Web Console</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Desktop-style Control Tower and operational consoles.</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-300" />
          </button>
        </div>

        <div className="pt-3 text-center text-[10px] text-slate-600">
          Current demo workspace: {userRole}
        </div>
      </div>
    </div>
  );
};
