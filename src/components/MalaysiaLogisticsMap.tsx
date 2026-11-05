import React, { useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import { useLogistics } from '../context/LogisticsContext';
import { Train, AlertTriangle } from 'lucide-react';

interface Props {
  heightClass?: string;
  showControls?: boolean;
}

type LatLng = [number, number];

// Prototype intermodal rail corridor for decision-support simulation.
// Hub labels follow GDEX-like network nodes; this line does not claim GDEX operates these rail services.
const RAIL_ROUTE: LatLng[] = [
  [5.2300, 100.4380], [5.1253, 100.493], [4.851, 100.74], [4.772, 100.937], [4.5975, 101.0901],
  [4.308, 101.153], [4.172, 101.194], [3.685, 101.518], [3.319, 101.577], [3.1812, 101.6917],
  [2.993, 101.788], [2.719, 101.94], [2.466, 102.229], [2.581, 102.611], [2.503, 102.816],
  [2.03, 103.319], [1.66, 103.6], [1.4630, 103.7646],
];

// PLUS North–South Expressway (E1/E2) through every hub
const ROAD_ROUTE: LatLng[] = [
  [5.2300, 100.4380], [4.85, 100.75], [4.78, 100.95], [4.5975, 101.0901], [4.2, 101.25],
  [3.69, 101.53], [3.32, 101.58], [3.1812, 101.6917], [2.8, 101.8], [2.73, 101.92],
  [2.2725, 102.2858], [2.15, 102.73], [2.01, 103.07], [1.83, 103.31], [1.66, 103.6],
  [1.4630, 103.7646],
];

const PJ_HUB: LatLng = [3.1073, 101.6067];
const IPOH_HUB: LatLng = [4.5975, 101.0901];
const BATANG_KALI: LatLng = [3.4682, 101.6372]; // MY441829 off-corridor position
const JHB_SOUTHERN_HUB: LatLng = [1.4927, 103.7414];

const anomalyIcon = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<span class="relative flex h-[18px] w-[18px]"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span class="relative inline-flex h-[18px] w-[18px] rounded-full bg-rose-500 border-2 border-white"></span></span>',
});

export const MalaysiaLogisticsMap: React.FC<Props> = ({ heightClass = 'h-[440px]', showControls = true }) => {
  const { hubs, shipments, selectedShipmentId, setSelectedShipmentId, setActiveTab } = useLogistics();
  const [showRailOnly, setShowRailOnly] = useState(false);
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);

  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId);
  const railShipment = shipments.find((s) => s.id === 'MY102938');

  return (
    <div className={`logitrust-map relative w-full ${heightClass} rounded-xl border overflow-hidden flex flex-col`}>
      {/* Map Header & Controls */}
      <div className="map-floating-panel absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-lg">
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
      <div className="map-floating-panel absolute bottom-3 left-3 z-10 backdrop-blur-md px-3 py-2 rounded-lg border text-[11px] space-y-1 shadow-lg text-slate-300">
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

      <div className="w-full h-full relative">
        {/* z-0 keeps Leaflet's internal z-indexes below the floating panels */}
        <MapContainer
          bounds={[[1.3, 100.2], [5.5, 104.0]]}
          boundsOptions={{ padding: [30, 30] }}
          zoomSnap={0.25}
          scrollWheelZoom={false}
          zoomControl={false}
          className="absolute inset-0 z-0"
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ZoomControl position="bottomright" />

          {!showRailOnly && !showAnomaliesOnly && (
            <Polyline positions={ROAD_ROUTE} pathOptions={{ color: '#64748b', weight: 4, opacity: 0.55, dashArray: '8 6' }} />
          )}
          {!showAnomaliesOnly && (
            <Polyline positions={RAIL_ROUTE} pathOptions={{ color: '#06b6d4', weight: 3.5, opacity: 0.95 }} />
          )}

          {/* MY441829 route deviation: approved corridor vs actual off-corridor path */}
          <Polyline positions={[PJ_HUB, IPOH_HUB]} pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.5, dashArray: '3 4' }} />
          <Polyline
            positions={[PJ_HUB, [3.33, 101.66], BATANG_KALI]}
            pathOptions={{ color: '#f43f5e', weight: 3, dashArray: '6 4' }}
            eventHandlers={{ click: () => setSelectedShipmentId('MY441829') }}
          />
          <Marker position={BATANG_KALI} icon={anomalyIcon} eventHandlers={{ click: () => setSelectedShipmentId('MY441829') }}>
            <Tooltip permanent direction="left" offset={[-10, 0]}>
              <span className="font-mono text-[10px] font-bold text-rose-600">ANOMALY +18.4km (MY441829)</span>
            </Tooltip>
          </Marker>

          {/* Live rail shipment marker */}
          {railShipment && !showAnomaliesOnly && (
            <CircleMarker
              center={JHB_SOUTHERN_HUB}
              radius={14}
              pathOptions={{
                color: '#06b6d4',
                weight: 2,
                fillColor: '#22d3ee',
                fillOpacity: 0.25,
              }}
              eventHandlers={{ click: () => setSelectedShipmentId(railShipment.id) }}
            >
              <Tooltip permanent direction="top" offset={[0, -14]}>
                <span className="font-mono text-[10px] font-bold text-sky-700">
                  {railShipment.id} ({railShipment.assignedVehicleOrTrain})
                </span>
              </Tooltip>
            </CircleMarker>
          )}

          {/* Hub Nodes */}
          {hubs.map((hub) => {
            const city = hub.name.split(' ')[0];
            const isSelected = selectedShipment?.currentLocation.includes(city);
            return (
              <CircleMarker
                key={hub.id}
                center={[hub.lat, hub.lng]}
                radius={isSelected ? 9 : 7}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: hub.status === 'Warning' ? '#f59e0b' : '#0284c7',
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  click: () => {
                    const matching = shipments.find((s) => s.currentLocation.includes(city));
                    if (matching) setSelectedShipmentId(matching.id);
                  },
                }}
              >
                <Tooltip permanent direction="right" offset={[10, 0]}>
                  <div className="leading-tight">
                    <div className="text-[11px] font-bold text-slate-900">{hub.name.split(' (')[0]}</div>
                    <div className="font-mono text-[9px] text-slate-500">
                      {hub.code} • {hub.activeShipments} Shipments ({hub.capacityUtilization}%)
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

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

            <div className="flex items-center justify-between gap-3 text-slate-400 text-[11px] pt-1 border-t border-slate-800">
              <span>Mode: <strong className="text-slate-200">{selectedShipment.transportMode}</strong></span>
              <span>Vehicle: <strong className="text-slate-200">{selectedShipment.assignedVehicleOrTrain}</strong></span>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-400 text-[11px]">
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
