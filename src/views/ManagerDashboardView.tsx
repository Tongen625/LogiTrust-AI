import React, { useMemo } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Activity, AlertTriangle, CheckCircle2, Clock3, Package, Route, ShieldAlert, TrainFront } from 'lucide-react';

export const ManagerDashboardView: React.FC = () => {
  const { shipments, recommendations, incidents, securityAlerts, trainSchedules, setActiveTab, setSelectedShipmentId } = useLogistics();

  const pendingApprovals = recommendations.filter((r) => r.status === 'Pending Approval');
  const openIncidents = incidents.filter((i) => !['Resolved'].includes(i.status));
  const activeSecurity = securityAlerts.filter((a) => a.status !== 'Resolved');
  const delayedShipments = shipments.filter((s) => s.delayMinutes > 0 || s.status === 'Delayed');
  const onTimeRail = trainSchedules.filter((t) => t.status === 'On Time' || t.status === 'Departed').length;
  const railHealth = trainSchedules.length ? Math.round((onTimeRail / trainSchedules.length) * 100) : 100;

  const priorityShipments = useMemo(
    () => [...shipments].sort((a, b) => Number(Boolean(b.hasPendingApproval)) - Number(Boolean(a.hasPendingApproval)) || b.riskScore - a.riskScore).slice(0, 5),
    [shipments]
  );

  const cards = [
    { label: 'Active Shipments', value: shipments.length, note: 'Network-wide visibility', icon: Package },
    { label: 'Pending AI Decisions', value: pendingApprovals.length, note: 'Manager approval required', icon: CheckCircle2 },
    { label: 'Open Exceptions', value: openIncidents.length, note: 'Operational follow-up', icon: AlertTriangle },
    { label: 'Delayed Loads', value: delayedShipments.length, note: 'ETA impact detected', icon: Clock3 },
    { label: 'Security Alerts', value: activeSecurity.length, note: 'Handled by Security Officer', icon: ShieldAlert },
    { label: 'Rail Schedule Health', value: `${railHealth}%`, note: 'On-time / departed services', icon: TrainFront },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Logistics Operations Manager</div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">Network Operations Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Supervise network performance, review consequential AI recommendations, and coordinate exception response without taking over specialist role actions.</p>
        </div>
        <button onClick={() => setActiveTab('control-tower')} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 self-start lg:self-auto"><Activity className="w-4 h-4"/> Open AI Control Tower</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(({ label, value, note, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase font-bold text-slate-500">{label}</span><Icon className="w-4 h-4 text-blue-600"/></div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">{value}</div>
            <div className="text-[10px] text-slate-400 mt-1">{note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-100 flex items-center justify-between">
            <div><h2 className="font-bold text-slate-900">Priority Loads</h2><p className="text-xs text-slate-500">Loads requiring management awareness based on approval state and risk.</p></div>
            <button onClick={() => setActiveTab('shipments')} className="text-xs font-bold text-blue-600">View Shipments →</button>
          </div>
          <div className="divide-y divide-blue-50">
            {priorityShipments.map((s) => (
              <button key={s.id} onClick={() => { setSelectedShipmentId(s.id); setActiveTab('shipments'); }} className="w-full px-5 py-3.5 text-left hover:bg-blue-50/60 transition flex items-center justify-between gap-4">
                <div className="min-w-0"><div className="font-bold text-sm text-slate-900">{s.id} <span className="text-slate-400 font-normal">• {s.origin} → {s.destination}</span></div><div className="text-xs text-slate-500 mt-1 truncate">{s.status} • {s.transportMode} • ETA {s.eta}</div></div>
                <div className="text-right shrink-0"><div className={`text-xs font-bold ${s.riskLevel === 'High' || s.riskLevel === 'Critical' ? 'text-rose-600' : s.riskLevel === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{s.riskLevel} risk</div><div className="text-[10px] text-slate-400 mt-1">Score {s.riskScore}</div></div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600"/><h2 className="font-bold text-slate-900">Decision Queue</h2></div>
            <div className="text-3xl font-extrabold text-slate-900 mt-3">{pendingApprovals.length}</div>
            <p className="text-xs text-slate-500 mt-1">Consequential AI recommendations awaiting Operations Manager approval.</p>
            <button onClick={() => setActiveTab('approvals')} className="mt-3 w-full py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Review AI Approvals</button>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
            <div className="flex items-center gap-2"><Route className="w-4 h-4 text-blue-600"/><h2 className="font-bold text-slate-900">Role Boundaries</h2></div>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-xl">Security evidence decisions remain with the <strong>Security Officer</strong>.</div>
              <div className="p-2.5 bg-slate-50 rounded-xl">Hub custody verification remains with the <strong>Hub Operator</strong>.</div>
              <div className="p-2.5 bg-slate-50 rounded-xl">Timetable updates remain with the <strong>Transport Coordinator</strong>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
