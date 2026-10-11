import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Shield, Train, Truck, AlertTriangle, CheckCircle2, Radio, Navigation } from 'lucide-react';

interface Props {
  heightClass?: string;
  showControls?: boolean;
}

export const MalaysiaLogisticsMap: React.FC<Props> = ({ heightClass = 'h-[440px]', showControls = true }) => {
  const { hubs, shipments, selectedShipmentId, setSelectedShipmentId, setActiveTab } = useLogistics();
  const [showRailOnly, setShowRailOnly] = useState(false);
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);

  // Approximate coordinate mapping to SVG viewBox (0,0 to 800,600)
  // Malaysia Peninsular roughly spans Lat: 1.2 to 6.8 N, Lng: 99.8 to 104.5 E
  const project = (lat: number, lng: number) => {
    const minLat = 1.0;
    const maxLat = 6.4;
    const minLng = 100.0;
    const maxLng = 104.5;

    const x = ((lng - minLng) / (maxLng - minLng)) * 680 + 60;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 500 + 50;
    return { x, y };
  };

  const hubCoords = hubs.map((h) => ({
    ...h,
    svg: project(h.lat, h.lng),
  }));

  // Selected shipment info
  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId);

  // Off-corridor anomaly point for MY441829 (Batang Kali)
  const anomalyBatangKali = project(3.4682, 101.7381);
  const klHubCoord = project(3.1812, 101.6917);
  const ipohHubCoord = project(4.5975, 101.0901);

  return (
    <div className={`relative w-full ${heightClass} bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex flex-col`}>
      {/* Map Header & Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Peninsular Rail & Road Grid</span>
        </div>

        {showControls && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700 pl-2">
            <button
              onClick={() => setShowRailOnly(!showRailOnly)}
              className={`px-2 py-0.5 text-[11px] rounded transition flex items-center gap-1 ${
                showRailOnly ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Train className="w-3 h-3" /> Rail Corridor
            </button>
            <button
              onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
              className={`px-2 py-0.5 text-[11px] rounded transition flex items-center gap-1 ${
                showAnomaliesOnly ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Anomalies Only
            </button>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] space-y-1 shadow-lg text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
          <span>Rail Intermodal Line</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-slate-500 border-t border-dashed border-slate-400 inline-block"></span>
          <span>PLUS E1/E2 Expressway Trunk Corridor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 animate-pulse"></span>
          <span className="text-rose-300">Active Geofence Deviation (18.4km)</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full h-full relative">
        <svg
          viewBox="0 0 800 580"
          className="w-full h-full object-contain filter drop-shadow-lg"
          style={{ background: 'radial-gradient(circle at 40% 50%, #061124 0%, #020617 90%)' }}
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="0.8" />
            </pattern>

            {/* Glowing lines filter */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="800" height="580" fill="url(#grid)" />

          {/* Peninsular Malaysia Stylized Outline */}
          <path
            d="M 120 70 
               Q 160 40 220 50 
               Q 300 80 380 120 
               Q 460 170 520 250 
               Q 580 320 620 400 
               Q 660 480 640 530 
               Q 590 550 530 520 
               Q 440 450 380 390 
               Q 320 330 280 260 
               Q 230 190 170 140 
               Z"
            fill="rgba(15, 23, 42, 0.6)"
            stroke="rgba(51, 65, 85, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Road Corridors (PLUS Highway) */}
          {!showRailOnly && (
            <path
              d={`M ${project(5.2635, 100.4357).x} ${project(5.2635, 100.4357).y} 
                  L ${project(4.5975, 101.0901).x} ${project(4.5975, 101.0901).y} 
                  L ${project(3.1812, 101.6917).x} ${project(3.1812, 101.6917).y} 
                  L ${project(2.2725, 102.2858).x} ${project(2.2725, 102.2858).y} 
                  L ${project(1.4927, 103.7414).x} ${project(1.4927, 103.7414).y}`}
              fill="none"
              stroke="#334155"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Railway Mainline (Glowing Cyan) */}
          <path
            d={`M ${project(5.2635, 100.4357).x} ${project(5.2635, 100.4357).y} 
                Q ${project(4.8, 100.8).x} ${project(4.8, 100.8).y} ${project(4.5975, 101.0901).x} ${project(4.5975, 101.0901).y} 
                Q ${project(3.8, 101.4).x} ${project(3.8, 101.4).y} ${project(3.1812, 101.6917).x} ${project(3.1812, 101.6917).y} 
                Q ${project(2.6, 102.1).x} ${project(2.6, 102.1).y} ${project(2.2725, 102.2858).x} ${project(2.2725, 102.2858).y} 
                Q ${project(1.9, 103.1).x} ${project(1.9, 103.1).y} ${project(1.4927, 103.7414).x} ${project(1.4927, 103.7414).y}`}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            filter="url(#glow-cyan)"
            className="opacity-90"
          />

          {/* Route Deviation Red Vector for MY441829 */}
          <g className="cursor-pointer" onClick={() => setSelectedShipmentId('MY441829')}>
            {/* Approved baseline corridor */}
            <line
              x1={klHubCoord.x}
              y1={klHubCoord.y}
              x2={ipohHubCoord.x}
              y2={ipohHubCoord.y}
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            {/* Deviation line */}
            <path
              d={`M ${klHubCoord.x} ${klHubCoord.y} 
                  Q ${(klHubCoord.x + anomalyBatangKali.x) / 2 + 15} ${(klHubCoord.y + anomalyBatangKali.y) / 2} 
                  ${anomalyBatangKali.x} ${anomalyBatangKali.y}`}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeDasharray="4 2"
              filter="url(#glow-red)"
            />
            {/* Deviation Pulse Marker */}
            <circle cx={anomalyBatangKali.x} cy={anomalyBatangKali.y} r="18" fill="rgba(244, 63, 94, 0.15)" className="animate-ping" />
            <circle cx={anomalyBatangKali.x} cy={anomalyBatangKali.y} r="8" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="2" />
            <text x={anomalyBatangKali.x + 14} y={anomalyBatangKali.y + 4} fill="#f43f5e" fontSize="11" fontWeight="700" className="font-mono">
              ANOMALY +18.4km (MY441829)
            </text>
          </g>

          {/* Live Shipment Marker: MY102938 (Johor Hub / Sentral Rail) */}
          {(() => {
            const jbCoord = project(1.4927, 103.7414);
            const isSelected = selectedShipmentId === 'MY102938';
            return (
              <g
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setSelectedShipmentId('MY102938')}
              >
                <circle cx={jbCoord.x - 18} cy={jbCoord.y - 20} r="12" fill={isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(56, 189, 248, 0.15)'} className="animate-pulse" />
                <circle cx={jbCoord.x - 18} cy={jbCoord.y - 20} r="6" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                <rect x={jbCoord.x - 68} y={jbCoord.y - 48} width="100" height="22" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
                <text x={jbCoord.x - 18} y={jbCoord.y - 33} fill="#38bdf8" fontSize="10" fontWeight="700" textAnchor="middle" className="font-mono">
                  MY102938 (Rail T108)
                </text>
              </g>
            );
          })()}

          {/* Hub Nodes */}
          {hubCoords.map((hub) => {
            const isSelected = selectedShipment?.currentLocation.includes(hub.name.split(' ')[0]);
            return (
              <g
                key={hub.id}
                className="cursor-pointer transition duration-200 hover:opacity-100"
                onClick={() => {
                  const matching = shipments.find((s) => s.currentLocation.includes(hub.name.split(' ')[0]));
                  if (matching) setSelectedShipmentId(matching.id);
                }}
              >
                {/* Glow ring */}
                <circle
                  cx={hub.svg.x}
                  cy={hub.svg.y}
                  r="14"
                  fill="rgba(6, 182, 212, 0.08)"
                  stroke={hub.status === 'Warning' ? '#f59e0b' : '#38bdf8'}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {/* Hub Core */}
                <circle
                  cx={hub.svg.x}
                  cy={hub.svg.y}
                  r="6.5"
                  fill={hub.status === 'Warning' ? '#f59e0b' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Hub Badge */}
                <g transform={`translate(${hub.svg.x + 12}, ${hub.svg.y - 12})`}>
                  <rect width="130" height="34" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(51, 65, 85, 0.8)" strokeWidth="1" />
                  <text x="8" y="14" fill="#f8fafc" fontSize="10.5" fontWeight="700">
                    {hub.name.split(' ')[0]} Hub
                  </text>
                  <text x="8" y="27" fill="#94a3b8" fontSize="9" className="font-mono">
                    {hub.code} • {hub.activeShipments} Parcels ({hub.capacityUtilization}%)
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Shipment HUD Info Overlay */}
        {selectedShipment && (
          <div className="absolute top-3 right-3 z-10 max-w-xs bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-400 text-sm">{selectedShipment.id}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  selectedShipment.riskLevel === 'Critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : selectedShipment.riskLevel === 'High'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {selectedShipment.riskLevel} Risk
              </span>
            </div>

            <div className="text-slate-300 font-medium">
              {selectedShipment.origin} → {selectedShipment.destination}
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
              <span>Mode: <strong className="text-slate-200">{selectedShipment.transportMode}</strong></span>
              <span>Vehicle: <strong className="text-slate-200">{selectedShipment.assignedVehicleOrTrain}</strong></span>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>ETA: <strong className="text-cyan-300">{selectedShipment.eta}</strong></span>
              <span>Hub SLA: <strong className="text-slate-200">{selectedShipment.targetArrival}</strong></span>
            </div>

            <div className="pt-1">
              <button
                onClick={() => setActiveTab('shipments')}
                className="w-full py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 rounded text-[11px] font-semibold border border-cyan-500/30 transition text-center"
              >
                Inspect Telemetry & Timeline →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
