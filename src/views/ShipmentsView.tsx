import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Train,
  Truck,
  MapPin,
  Calendar,
  FileText,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Shipment, ShipmentStatus, RiskLevel, TransportMode } from '../types/logistics';

export const ShipmentsView: React.FC = () => {
  const { shipments, selectedShipmentId, setSelectedShipmentId, auditLogs, securityAlerts, recommendations } = useLogistics();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [activeTabDetail, setActiveTabDetail] = useState<'overview' | 'timeline' | 'route' | 'ai' | 'security' | 'audit'>('overview');

  const filteredShipments = shipments.filter((s) => {
    const matchSearch =
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase()) ||
      s.originHub.toLowerCase().includes(search.toLowerCase()) ||
      s.destinationHub.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchRisk = riskFilter === 'ALL' || s.riskLevel === riskFilter;
    const matchMode = modeFilter === 'ALL' || s.transportMode === modeFilter;

    return matchSearch && matchStatus && matchRisk && matchMode;
  });

  const selected = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];
  const relatedAlerts = securityAlerts.filter((a) => a.shipmentId === selected.id);
  const relatedLogs = auditLogs.filter((l) => l.shipmentId === selected.id);
  const relatedRec = recommendations.find((r) => r.shipmentId === selected.id);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">
            Shipment Management & Integrity Directory
          </h1>
          <p className="text-xs text-slate-400">
            Real-time intermodal consignment tracking with evidence-based chain-of-custody verification
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Showing {filteredShipments.length} of {shipments.length} Active Shipments
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking ID, city, or consignee..."
            className="w-full bg-slate-950 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-750 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Transit">In Transit</option>
            <option value="Origin Hub">Origin Hub</option>
            <option value="Route & Schedule Planning">Route & Schedule Planning</option>
            <option value="Train Assigned">Train Assigned</option>
            <option value="Delayed">Delayed</option>
            <option value="Security Review">Security Review</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-750 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-750 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Modes</option>
            <option value="Road + Rail">Road + Rail</option>
            <option value="Rail Primary">Rail Primary</option>
            <option value="Road Direct">Road Direct</option>
          </select>
        </div>
      </div>

      {/* 2-Column Layout: Table + Live Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Table Column (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Shipments Manifest
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Click row to inspect</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Tracking ID</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Mode & Fleet</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">ETA</th>
                  <th className="py-2.5 px-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredShipments.map((s) => {
                  const isSelected = s.id === selected.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedShipmentId(s.id)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400 text-white font-medium'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{s.id}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-200 font-medium">{s.origin} → {s.destination}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{s.category}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-300 truncate max-w-[110px]">
                        {s.currentLocation}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[11px] font-semibold text-slate-300">{s.transportMode}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.assignedVehicleOrTrain}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.status === 'Delayed'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : s.status === 'Security Review'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{s.eta}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.riskLevel === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : s.riskLevel === 'High'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {s.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Column (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-4 flex flex-col space-y-4">
          {/* Header of Detail */}
          <div className="pb-3 border-b border-slate-800 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-cyan-400">{selected.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selected.riskLevel === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300'
                      : selected.riskLevel === 'High'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {selected.riskLevel} Risk ({selected.riskScore}/100)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{selected.category}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Destination Hub SLA</span>
              <span className="text-xs font-bold text-amber-300 font-mono">{selected.targetArrival}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'timeline', label: 'Timeline (Stages 3-7)' },
                { id: 'route', label: 'Route' },
                { id: 'ai', label: 'AI Analysis' },
                { id: 'security', label: 'Security' },
                { id: 'audit', label: 'Audit History' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabDetail(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeTabDetail === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTabDetail === 'overview' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Origin Hub</span>
                  <div className="font-bold text-slate-200">{selected.originHub}</div>
                  <div className="text-[10px] text-cyan-400 mt-0.5 font-mono">Stage 3: Verified Received</div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Destination Hub</span>
                  <div className="font-bold text-slate-200">{selected.destinationHub}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Stage 6: Trust Boundary</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Location:</span>
                  <strong className="text-cyan-300 font-mono">{selected.currentLocation}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Transit:</span>
                  <strong className="text-slate-200 font-mono">{selected.assignedVehicleOrTrain} ({selected.transportMode})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Arrival (ETA):</span>
                  <strong className="text-emerald-400 font-mono">{selected.eta}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weight & Dimensions:</span>
                  <span className="text-slate-200 font-mono">{selected.weightKg} kg • {selected.dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority Tier:</span>
                  <span className="text-cyan-400 font-bold">{selected.priority}</span>
                </div>
              </div>

              {selected.hasSecurityAlert && (
                <div className="p-2.5 bg-rose-950/30 rounded-xl border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
                  <span>🚨 Active Security Alert #TR102 Attached</span>
                  <span className="underline font-bold cursor-pointer" onClick={() => setActiveTabDetail('security')}>
                    Inspect Telemetry →
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISUAL STAGES 3-7 TIMELINE */}
          {activeTabDetail === 'timeline' && (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                Stages 3–7 Operational Timeline
              </div>
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {selected.timeline.map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        step.completed
                          ? 'bg-emerald-500 border-emerald-300'
                          : step.current
                          ? 'bg-cyan-400 border-white animate-ping'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    ></div>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{step.stage}</span>
                        <span className="font-mono text-[10px] text-slate-400">{step.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">{step.location}</div>
                      {step.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-1 bg-slate-900/60 p-1.5 rounded">
                          {step.notes}
                        </p>
                      )}
                      {step.verifiedBy && (
                        <div className="text-[9px] text-cyan-400 font-mono mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Verified: {step.verifiedBy}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ROUTE MAP */}
          {activeTabDetail === 'route' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">Waypoints</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {selected.routeCoordinates.map((coord, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800/80">
                      <span className="text-slate-200">{i + 1}. {coord.name}</span>
                      <span className="text-slate-500">{coord.lat.toFixed(4)}°N, {coord.lng.toFixed(4)}°E</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                <span className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">Active Geofence Bounds:</span>
                Corridor width: 3.0 km buffer along designated rail freight & E1 expressway right-of-way.
              </div>
            </div>
          )}

          {/* TAB 4: AI ANALYSIS */}
          {activeTabDetail === 'ai' && (
            <div className="space-y-3 text-xs">
              {relatedRec ? (
                <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/40 space-y-2">
                  <div className="font-bold text-cyan-300 text-xs">AI Recommendation: {relatedRec.recommendation}</div>
                  <p className="text-slate-200 text-[11px]">{relatedRec.reason}</p>
                  <div className="pt-2 border-t border-cyan-900/50 flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="text-cyan-300 font-bold">{relatedRec.confidence}%</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-center">
                  Optimal path execution. No active disruption anomalies detected on this consignment.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY EVIDENCE */}
          {activeTabDetail === 'security' && (
            <div className="space-y-3 text-xs">
              {relatedAlerts.length > 0 ? (
                relatedAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-rose-950/20 rounded-xl border border-rose-500/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-rose-400">Alert #{alert.id}</span>
                      <span className="text-[10px] font-bold uppercase text-rose-300">{alert.status}</span>
                    </div>
                    <div className="font-bold text-white text-xs">{alert.title}</div>
                    <p className="text-slate-300 text-[11px]">{alert.aiAssessment}</p>

                    <div className="pt-2 border-t border-rose-900/40 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Telemetry Log:</span>
                      {alert.evidence.map((ev, i) => (
                        <div key={i} className="text-[10px] font-mono text-slate-300 flex justify-between">
                          <span>{ev.time} - {ev.event}</span>
                          <span className={ev.status === 'Anomaly' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{ev.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-center">
                  Verified: no active route or handoff anomalies on record.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT HISTORY */}
          {activeTabDetail === 'audit' && (
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {relatedLogs.length > 0 ? (
                relatedLogs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-cyan-400">{log.timestamp} • {log.actor}</span>
                      <span className="text-slate-500">{log.hash.slice(0, 8)}</span>
                    </div>
                    <div className="font-bold text-white text-[11px]">{log.event}</div>
                    <p className="text-[10px] text-slate-300">{log.result}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-center">
                  Audit trail active. Consequential actions are recorded with evidence and decision references.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
