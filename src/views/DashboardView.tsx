import React from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MalaysiaLogisticsMap } from '../components/MalaysiaLogisticsMap';
import {
  Package,
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Train,
  Truck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    shipments,
    securityAlerts,
    recommendations,
    trainSchedules,
    setSelectedShipmentId,
    setActiveTab,
    isTabPermitted,
  } = useLogistics();

  const activeCount = 38;
  const delayedCount = shipments.filter((s) => s.delayMinutes > 0).length || 4;
  const atRiskCount = shipments.filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Critical').length || 3;
  const securityAlertsCount = securityAlerts.filter((a) => a.status !== 'Resolved').length || 2;
  const pendingApprovalsCount = recommendations.filter((r) => r.status === 'Pending Approval').length || 1;
  const onTimeRate = 92;

  const kpis = [
    { label: 'Active Shipments', value: activeCount, unit: 'Units', icon: Package, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { label: 'Delayed Shipments', value: delayedCount, unit: 'Units', icon: Clock, color: 'text-amber-400', border: 'border-amber-500/30' },
    { label: 'At-Risk Shipments', value: atRiskCount, unit: 'Priority', icon: AlertTriangle, color: 'text-rose-400', border: 'border-rose-500/30' },
    { label: 'Security Alerts', value: securityAlertsCount, unit: 'Anomalies', icon: ShieldAlert, color: 'text-rose-500', border: 'border-rose-600/40' },
    { label: 'Pending AI Approvals', value: pendingApprovalsCount, unit: 'Decisions', icon: CheckCircle, color: 'text-blue-400', border: 'border-blue-500/40' },
    { label: 'On-Time Movement Rate', value: `${onTimeRate}%`, unit: 'SLA Target', icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-500/30' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">
            Logistics Operations Command Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            High-level situational awareness across Peninsular road, rail, and sorting nodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTabPermitted('control-tower') && <button onClick={() => setActiveTab('control-tower')} className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"><span>Open AI Control Tower</span><ArrowRight className="w-3.5 h-3.5" /></button>}
        </div>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl bg-slate-900/80 border ${kpi.border} shadow-lg flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-white font-mono">{kpi.value}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{kpi.unit}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map & Live Exceptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Malaysia Intermodal Network Map
                </h3>
                <p className="text-[11px] text-slate-400">
                  Live tracking across Johor Bahru, Melaka, Kuala Lumpur, Ipoh & Penang
                </p>
              </div>
              <button
                onClick={() => setActiveTab('tracking')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                Expanded Tracker <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <MalaysiaLogisticsMap heightClass="h-[400px]" />
          </div>

          {/* Train Schedule Status Table */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Rail Schedule & Capacity Status
                </h3>
              </div>
              {isTabPermitted('schedules') && <button onClick={() => setActiveTab('schedules')} className="text-[11px] text-cyan-400 hover:text-cyan-300">Open Schedule Planning →</button>}
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="py-2 px-3">Service</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-3">Departure</th>
                    <th className="py-2 px-3">Arrival</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Utilisation</th>
                    <th className="py-2 px-3">Telemetry Feed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {trainSchedules.map((train) => (
                    <tr key={train.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-2 px-3 font-mono font-bold text-cyan-300">{train.id}</td>
                      <td className="py-2 px-3 text-slate-300">{train.route}</td>
                      <td className="py-2 px-3 font-mono">{train.departure}</td>
                      <td className="py-2 px-3 font-mono">{train.arrival}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            train.status === 'Delayed'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {train.status === 'Delayed' ? `DELAYED ${train.delayMinutes} MIN` : 'ON TIME'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                train.currentUtilisationPct > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${train.currentUtilisationPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {train.currentUtilisationPct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>{train.dataSource || 'Live Sensor Grid'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right (4 cols): AI Alerts Panel & Exception Queue */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Alerts Panel */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  AI Cybersecurity & Trust Alerts
                </h3>
              </div>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                {securityAlerts.filter((a) => a.status !== 'Resolved').length} Active
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => {
                    setSelectedShipmentId(alert.shipmentId);
                    setActiveTab('security');
                  }}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-rose-400">
                      Alert #{alert.id} • {alert.shipmentId}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        alert.status === 'Resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : alert.riskLevel === 'High'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">{alert.title}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alert.aiAssessment}</p>
                  <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{alert.detectedAt}</span>
                    <span className="text-cyan-400">Inspect Evidence →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Shipment Activities */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Recent Shipment Activities
              </h3>
              <button
                onClick={() => setActiveTab('shipments')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300"
              >
                View All →
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {shipments.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedShipmentId(s.id);
                    setActiveTab('shipments');
                  }}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:bg-slate-800/50 cursor-pointer transition flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-cyan-300">{s.id}</span>
                    <span className="text-slate-400 ml-2">
                      {s.origin} → {s.destination}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      Loc: {s.currentLocation.split(' ')[0]} Hub • {s.assignedVehicleOrTrain}
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      s.status === 'Delayed'
                        ? 'bg-amber-500/20 text-amber-300'
                        : s.status === 'Security Review'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
