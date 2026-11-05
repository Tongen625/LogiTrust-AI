import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MobileTabBar, MobileProfileCard } from '../components/MobileTabBar';
import {
  CalendarDays,
  Train,
  Clock3,
  CircleAlert,
  CheckCircle2,
  Plus,
  RefreshCcw,
  Route,
  ShieldCheck,
  BellRing,
} from 'lucide-react';

export const TransportCoordinatorAppView: React.FC = () => {
  const { trainSchedules, recommendations, incidents, updateTrainStatus, addNewTrainSchedule, setActiveTab } = useLogistics();
  const [message, setMessage] = useState<string | null>(null);
  const [addedManualService, setAddedManualService] = useState(false);
  const TABS = ['Schedules', 'Services', 'Fallback', 'Profile'];
  const [tab, setTab] = useState(TABS[0]);
  const show = (t: string) => tab === TABS[0] || tab === t;

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage((current) => (current === msg ? null : current)), 4200);
  };

  const activeSchedules = useMemo(() => trainSchedules.slice(0, 4), [trainSchedules]);
  const delayedCount = trainSchedules.filter((t) => t.status === 'Delayed').length;
  const primaryRec = recommendations.find((r) => r.shipmentId === 'MY102938') || recommendations[0];
  const hubCongestionAlerts = incidents.filter((incident) => incident.type === 'Hub Congestion' && incident.status !== 'Resolved');

  return (
    <div className="p-4 lg:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm bg-slate-950 rounded-[36px] border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[680px] text-slate-100 relative">
        <div className="bg-slate-900 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800">
          <span>09:42 AM</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
          <span className="text-cyan-400">5G • 96%</span>
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
              <h2 className="text-sm font-bold text-white">Transport Coordinator App</h2>
              <p className="text-[11px] text-slate-400">Manual timetable fallback & rail rescheduling</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              TW
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Rail Services</span>
              <strong className="text-white text-base">{trainSchedules.length}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Delayed</span>
              <strong className="text-amber-400 text-base">{delayedCount}</strong>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {tab === 'Profile' && <MobileProfileCard />}
          {tab === TABS[0] && hubCongestionAlerts.length > 0 && (
            <div className="p-3.5 bg-amber-950/20 rounded-2xl border border-amber-500/40 shadow-lg space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <BellRing className="w-4 h-4" />
                  <span className="text-[10px] uppercase">Hub Congestion Alert</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                  {hubCongestionAlerts.length} OPEN
                </span>
              </div>
              {hubCongestionAlerts.slice(0, 2).map((incident) => (
                <div key={incident.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-[11px]">{incident.location}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{incident.occurredAt} · {incident.id}</div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase ${incident.severity === 'High' || incident.severity === 'Critical' ? 'text-rose-300' : incident.severity === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-2 leading-relaxed">{incident.details}</p>
                </div>
              ))}
              <button
                onClick={() => setActiveTab('schedules')}
                className="w-full py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[11px] hover:bg-amber-500/30 transition"
              >
                Review Transport Schedule
              </button>
            </div>
          )}
          {show('Fallback') && <div className="p-3.5 bg-slate-900 rounded-2xl border border-cyan-500/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Manual Provider Fallback</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">ACTIVE</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When railway/provider API synchronization is unavailable, coordinators can manually add train times and update service status.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  if (!addedManualService) {
                    addNewTrainSchedule({
                      id: 'T120',
                      route: 'Johor Bahru → Klang Valley',
                      originHub: 'Johor Bahru',
                      destHub: 'Klang Valley',
                      departure: '10:30',
                      arrival: '14:15',
                      status: 'On Time',
                      delayMinutes: 0,
                      capacityAvailable: true,
                      currentUtilisationPct: 42,
                      cargoCapacityTons: 40,
                      isManualOverride: true,
                      dataSource: 'Manual Operator Override',
                      notes: 'Added via mobile transport coordinator app',
                    });
                    setAddedManualService(true);
                  }
                  notify('Manual train service/time entry saved to the schedule board.');
                }}
                className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] shadow transition"
              >
                <Plus className="w-3 h-3" /> Add Train Time
              </button>
              <button
                onClick={() => {
                  updateTrainStatus('T105', 'Delayed', 90, 'Standalone manual override from transport app');
                  notify('T105 status updated to Delayed (+90 min). AI impact recalculation triggered.');
                }}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold rounded-xl flex items-center justify-center gap-1 text-[11px] transition"
              >
                <RefreshCcw className="w-3 h-3" /> Update Status
              </button>
            </div>
          </div>}

          {show('Services') && <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Active Rail Timetable</span>
            {(tab === 'Services' ? trainSchedules : activeSchedules).map((schedule) => (
              <div key={schedule.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold flex items-center gap-1"><Train className="w-3 h-3 text-cyan-400" /> {schedule.id}</div>
                    <div className="text-[11px] text-slate-400">{schedule.route}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${schedule.status === 'Delayed' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                    {schedule.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><span className="text-slate-500 block">Dep</span><strong>{schedule.departure}</strong></div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><span className="text-slate-500 block">Arr</span><strong>{schedule.arrival}</strong></div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800"><span className="text-slate-500 block">Load</span><strong>{schedule.currentUtilisationPct}%</strong></div>
                </div>
              </div>
            ))}
          </div>}

          {show('Services') && primaryRec && (
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">AI Comparison Result</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-slate-200 font-semibold">{primaryRec.recommendation}</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Expected Result</span><strong className="text-emerald-300">+{primaryRec.expectedImprovementMins} min recovery</strong></div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800"><span className="text-slate-500 block uppercase">Security Risk</span><strong className="text-slate-200">{primaryRec.securityRisk}</strong></div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">Recommendation is prepared for Operations Manager approval before consequential rerouting is executed.</p>
            </div>
          )}

          {tab === TABS[0] && <div className="p-2.5 bg-blue-950/30 rounded-xl border border-blue-500/30 text-[10px] text-slate-300 space-y-1">
            <div className="font-bold flex items-center gap-1 text-blue-300">
              <CalendarDays className="w-3 h-3 text-cyan-400" /> Schedule Policy Guardrail
            </div>
            <p>
              This app allows manual timetable and status handling only. Final shipment rerouting remains subject to Operations Manager approval and audit logging.
            </p>
          </div>}
        </div>
        <MobileTabBar tabs={TABS} active={tab} onChange={setTab} />
      </div>
    </div>
  );
};
