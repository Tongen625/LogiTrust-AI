import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import {
  Calendar,
  Train,
  Truck,
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Zap,
  Plus,
  Clock,
  Edit2,
  Trash2,
  X,
  Sliders,
  Check,
} from 'lucide-react';
import { TrainSchedule } from '../types/logistics';

export const SchedulesView: React.FC = () => {
  const {
    trainSchedules,
    simulationResult,
    approveRecommendation,
    updateTrainStatus,
    addNewTrainSchedule,
    deleteTrainSchedule,
    userRole,
  } = useLogistics();

  const canEditSchedule = userRole === 'Transport Coordinator';
  const canApprove = userRole === 'Logistics Operations Manager';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrain, setEditingTrain] = useState<TrainSchedule | null>(null);

  // New train form state
  const [newTrainId, setNewTrainId] = useState('');
  const [newRoute, setNewRoute] = useState('Johor Bahru (JHB) → Kuala Lumpur (KUL)');
  const [newOriginHub, setNewOriginHub] = useState('hub-jb');
  const [newDestHub, setNewDestHub] = useState('hub-kl');
  const [newDeparture, setNewDeparture] = useState('13:30');
  const [newArrival, setNewArrival] = useState('16:45');
  const [newCapacity, setNewCapacity] = useState('480');
  const [newUtilisation, setNewUtilisation] = useState('40');
  const [newStatus, setNewStatus] = useState<'On Time' | 'Delayed' | 'Departed' | 'Cancelled'>('On Time');
  const [newDelayMins, setNewDelayMins] = useState('0');
  const [newNotes, setNewNotes] = useState('Manual timetable dispatch');

  // Edit status modal state
  const [editStatusValue, setEditStatusValue] = useState<'On Time' | 'Delayed' | 'Departed' | 'Cancelled'>('On Time');
  const [editDelayValue, setEditDelayValue] = useState(30);

  const comparisonOptions = [
    {
      option: 'Alternative A: Train T108 (Recommended)',
      service: 'Intermodal Express T108',
      eta: '14:10 Today',
      cost: '+4% (Marginal)',
      capacity: 'Available (46% unallocated)',
      risk: 'Low',
      deadlineFeasible: true,
      aiScore: 94,
      isRecommended: true,
    },
    {
      option: 'Baseline: Wait for Delayed Train T105',
      service: 'Hold at Johor Hub Bay 3',
      eta: '16:00 Today',
      cost: 'Baseline (0%)',
      capacity: 'Allocated (Delayed)',
      risk: 'High (SLA Breach)',
      deadlineFeasible: false,
      aiScore: 32,
      isRecommended: false,
    },
    {
      option: 'Alternative B: Emergency Road Hotshot Linehaul',
      service: 'Dedicated 5-Ton Highway Courier TR-909',
      eta: '15:15 Today',
      cost: '+65% (Heavy Surcharge)',
      capacity: 'Standby Fleet Available',
      risk: 'Medium (Highway Congestion)',
      deadlineFeasible: true,
      aiScore: 68,
      isRecommended: false,
    },
  ];

  const handleCreateTrain = (e: React.FormEvent) => {
    e.preventDefault();
    addNewTrainSchedule({
      id: newTrainId.trim().toUpperCase() || undefined,
      route: newRoute,
      originHub: newOriginHub,
      destHub: newDestHub,
      departure: newDeparture,
      arrival: newArrival,
      cargoCapacityTons: parseInt(newCapacity) || 450,
      currentUtilisationPct: parseInt(newUtilisation) || 45,
      status: newStatus,
      delayMinutes: newStatus === 'Delayed' ? parseInt(newDelayMins) || 30 : 0,
      notes: newNotes,
    });
    setShowAddModal(false);
    // Reset form
    setNewTrainId('');
  };

  const handleSaveStatusEdit = () => {
    if (!editingTrain) return;
    updateTrainStatus(editingTrain.id, editStatusValue, editDelayValue);
    setEditingTrain(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Calendar className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              Route & Intermodal Schedule Planning
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              STANDALONE & MANUAL OVERRIDE SUPPORT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic train path allocations, manual timetable overrides, and automated rescheduling fallback
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditSchedule ? (
            <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /><span>Add Train Service / Time</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">Read-only schedule view • Transport Coordinator maintains provider data</span>
          )}
        </div>
      </div>

      {/* Integration Status Notice */}
      <div className="p-3 bg-slate-900/90 rounded-2xl border border-cyan-500/30 flex items-start gap-3">
        <Sliders className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-0.5">
          <div className="font-bold text-white flex items-center gap-2">
            <span>Rail Provider Integration Mode: External Feed + Standalone Manual Fallback</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              STANDALONE DISPATCH OPERATIONAL
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            When operating in standalone dispatch mode without external API synchronization, transport coordinators can manually add train slots, calibrate departure/arrival timings, and update service status (*On Time, Delayed, Departed, Cancelled*) with real-time AI impact recalculation.
          </p>
        </div>
      </div>

      {/* Train Schedule Table with Manual Status & Actions */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Peninsular Intermodal Rail Timetables ({trainSchedules.length} Services)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{canEditSchedule ? 'Manual Override Enabled' : 'Read-Only for Current Role'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/70">
              <tr>
                <th className="py-2.5 px-3">Service Code</th>
                <th className="py-2.5 px-3">Origin → Destination</th>
                <th className="py-2.5 px-3">Departure</th>
                <th className="py-2.5 px-3">Arrival</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Load / Capacity</th>
                <th className="py-2.5 px-3 text-right">{canEditSchedule ? 'Manual Actions' : 'Access'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {trainSchedules.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-cyan-400 flex items-center gap-1.5">
                    <span>{t.id}</span>
                    {t.isManualOverride && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400" title="Manually Managed" />
                    )}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-200">{t.route}</td>
                  <td className="py-3 px-3">{t.departure}</td>
                  <td className="py-3 px-3">{t.arrival}</td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'Delayed'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : t.status === 'Cancelled'
                          ? 'bg-red-950 text-red-400 border border-red-700'
                          : t.status === 'Departed'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {t.status === 'Delayed' ? `DELAYED ${t.delayMinutes}M` : t.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-[10px]">
                    <span className="text-slate-400">{t.dataSource || 'External Schedule Feed'}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            t.currentUtilisationPct > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${t.currentUtilisationPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">{t.currentUtilisationPct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-sans">
                    {canEditSchedule ? <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => { setEditingTrain(t); setEditStatusValue(t.status); setEditDelayValue(t.delayMinutes || 30); }} className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition" title="Manual Status Override"><Edit2 className="w-3 h-3"/><span>Status</span></button>
                      {trainSchedules.length > 3 && <button onClick={() => deleteTrainSchedule(t.id)} className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition" title="Delete Service"><Trash2 className="w-3.5 h-3.5"/></button>}
                    </div> : <span className="text-[10px] text-slate-500">View only</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alternative Schedules Comparison Matrix */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              AI Multi-Objective Schedule Comparison Engine
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            Optimization Metric: Hub SLA Recovery vs Cost & Risk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/70">
              <tr>
                <th className="py-2.5 px-3">Transit Option</th>
                <th className="py-2.5 px-3">Destination Arrival (ETA)</th>
                <th className="py-2.5 px-3">Cost Index</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3">Security Risk</th>
                <th className="py-2.5 px-3">Hub SLA Feasible</th>
                <th className="py-2.5 px-3 text-center">AI Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {comparisonOptions.map((opt, idx) => (
                <tr
                  key={idx}
                  className={`transition ${
                    opt.isRecommended
                      ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400 font-semibold text-white'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className={opt.isRecommended ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                        {opt.option}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{opt.service}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-300">{opt.eta}</td>
                  <td className="py-3 px-3">{opt.cost}</td>
                  <td className="py-3 px-3">{opt.capacity}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        opt.risk === 'Low' ? 'text-emerald-400' : opt.risk === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {opt.risk}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        opt.deadlineFeasible
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {opt.deadlineFeasible ? 'FEASIBLE (HUB SLA MET)' : 'DEADLINE MISSED'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`font-mono font-extrabold text-sm ${
                        opt.aiScore > 90 ? 'text-cyan-400' : opt.aiScore > 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {opt.aiScore}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Gate for Recommended Option */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-cyan-400">AI Recommendation: </span>
            Alternative A preserves destination hub 15:30 transfer SLA with 92% confidence and lowest risk.
          </div>

          {canApprove ? (
            <button onClick={() => approveRecommendation('REC-1029', 'Executed from Schedule Comparison Matrix')} className="py-2 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />Approve & Apply Recommendation
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">Operations Manager approval required to apply consequential rerouting.</span>
          )}
        </div>
      </div>

      {/* MODAL 1: MANUAL ADD TRAIN SERVICE / TIME */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Train className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Manual Add Rail / Intermodal Train Schedule</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTrain} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Service Code:</label>
                  <input
                    type="text"
                    value={newTrainId}
                    onChange={(e) => setNewTrainId(e.target.value)}
                    placeholder="e.g. T115, T208"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="On Time">On Time</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Departed">Departed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Intermodal Corridor Route:</label>
                <select
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Johor Bahru (JHB) → Kuala Lumpur (KUL)">Johor Bahru (JHB) → Kuala Lumpur (KUL)</option>
                  <option value="Kuala Lumpur (KUL) → Ipoh (IPH)">Kuala Lumpur (KUL) → Ipoh (IPH)</option>
                  <option value="Ipoh (IPH) → Penang (PEN)">Ipoh (IPH) → Penang (PEN)</option>
                  <option value="Kuala Lumpur (KUL) → Johor Bahru (JHB)">Kuala Lumpur (KUL) → Johor Bahru (JHB)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Departure Time (24h):</label>
                  <input
                    type="time"
                    value={newDeparture}
                    onChange={(e) => setNewDeparture(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Arrival Time (24h):</label>
                  <input
                    type="time"
                    value={newArrival}
                    onChange={(e) => setNewArrival(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Capacity (Tons):</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Current Utilisation (%):</label>
                  <input
                    type="number"
                    value={newUtilisation}
                    onChange={(e) => setNewUtilisation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {newStatus === 'Delayed' && (
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Delay Minutes:</label>
                  <input
                    type="number"
                    value={newDelayMins}
                    onChange={(e) => setNewDelayMins(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Save Train Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL PROVIDER STATUS OVERRIDE */}
      {editingTrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Manual Status Override • {editingTrain.id}</h3>
                <span className="text-[11px] text-slate-400">{editingTrain.route}</span>
              </div>
              <button onClick={() => setEditingTrain(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Select Current Operational Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['On Time', 'Delayed', 'Departed', 'Cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditStatusValue(status)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition ${
                        editStatusValue === status
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {editStatusValue === 'Delayed' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 space-y-2">
                  <label className="text-amber-300 block font-semibold text-xs">
                    Reported Rail Delay (Minutes):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editDelayValue}
                      onChange={(e) => setEditDelayValue(parseInt(e.target.value) || 0)}
                      className="w-24 bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 font-mono text-white text-center text-sm"
                    />
                    <div className="flex gap-1">
                      {[15, 30, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setEditDelayValue(mins)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    AI Disruption & Scheduling Agents will automatically assess alternative carriage options upon save.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTrain(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatusEdit}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Apply Status Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
