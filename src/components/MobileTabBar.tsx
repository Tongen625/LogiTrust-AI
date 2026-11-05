import React from 'react';
import { useLogistics } from '../context/LogisticsContext';

interface TabBarProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

// Bottom navigation shared by all role mobile apps. The first tab shows every section.
export const MobileTabBar: React.FC<TabBarProps> = ({ tabs, active, onChange }) => (
  <div className="bg-slate-900 border-t border-slate-800 p-1 flex justify-around text-[10px] text-slate-400 font-medium">
    {tabs.map((tab) => (
      <button
        key={tab}
        type="button"
        onClick={() => onChange(tab)}
        aria-current={tab === active ? 'page' : undefined}
        className={`flex-1 py-1.5 rounded-lg transition hover:text-cyan-300 ${tab === active ? 'text-cyan-400 font-bold' : ''}`}
      >
        {tab}
      </button>
    ))}
  </div>
);

export const MobileProfileCard: React.FC = () => {
  const { currentUser } = useLogistics();
  return (
    <div className="space-y-3">
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30">
          {currentUser.avatarInitials}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{currentUser.name}</div>
          <div className="text-[11px] text-slate-400">{currentUser.role}</div>
        </div>
      </div>
      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
        {[
          ['User ID', currentUser.id],
          ['Callsign', currentUser.callsign],
          ['Clearance', currentUser.clearanceLevel],
          ['Hub Location', currentUser.hubLocation],
        ].map(([label, value]) => (
          <div key={label} className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block uppercase">{label}</span>
            <strong className="text-slate-200">{value}</strong>
          </div>
        ))}
      </div>
      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">Permitted Functions</span>
        {currentUser.permittedFunctions.map((fn) => (
          <div key={fn} className="text-[11px] text-slate-300">• {fn}</div>
        ))}
      </div>
    </div>
  );
};
