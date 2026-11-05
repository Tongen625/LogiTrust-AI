import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { buildCoordinatorLoads, CoordinatorLoad } from '../data/coordinatorLoadModel';
import {
  AlertTriangle,
  ArrowDownUp,
  Clock3,
  MapPin,
  Package,
  Route,
  Train,
  Truck,
} from 'lucide-react';

type SortMode = 'priority' | 'eta';
type LatLng = [number, number];

const HUB_COORDS: Array<{ keys: string[]; name: string; code: string; coord: LatLng }> = [
  { keys: ['johor bahru', 'jhb'], name: 'Johor Bahru Southern Region Hub', code: 'JHB-SRH', coord: [1.4927, 103.7414] },
  { keys: ['melaka', 'ayer keroh'], name: 'Melaka Branch Transfer Node', code: 'MKZ-BR', coord: [2.2662, 102.2870] },
  { keys: ['petaling jaya', 'klang valley', 'kuala lumpur'], name: 'Petaling Jaya Auto Hub', code: 'PJ-AH', coord: [3.1073, 101.6067] },
  { keys: ['ipoh', 'perak'], name: 'Ipoh / Perak Regional Node', code: 'IPH-PRN', coord: [4.5975, 101.0901] },
  { keys: ['butterworth', 'penang'], name: 'Butterworth Northern Region Hub', code: 'BWH-NRH', coord: [5.3991, 100.3638] },
];

const coordFor = (value = ''): LatLng => {
  const text = value.toLowerCase();
  return HUB_COORDS.find((hub) => hub.keys.some((key) => text.includes(key)))?.coord || [3.139, 101.6869];
};

const timeToMinutes = (value: string) => {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

const priorityScore = (load: CoordinatorLoad) => {
  if (load.status === 'Cancelled') return 0;
  if (load.incidentIds.length > 0 && load.delayMinutes > 0) return 1;
  if (load.incidentIds.length > 0) return 2;
  if (load.status === 'Delayed') return 3;
  if (load.utilisationPct >= 90) return 4;
  if (load.requiresCoordinatorAction) return 5;
  return 10;
};

const progressFor = (load: CoordinatorLoad) => {
  if (load.status === 'Departed') return 100;
  if (load.status === 'Cancelled') return 0;
  if (load.status === 'Delayed') return 58;
  return 72;
};

const statusClass = (status: string) => {
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'Delayed') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Departed') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const interpolate = (a: LatLng, b: LatLng, pct: number): LatLng => [
  a[0] + (b[0] - a[0]) * pct,
  a[1] + (b[1] - a[1]) * pct,
];

const loadLeaflet = async () => {
  if ((window as any).L) return (window as any).L;

  if (!document.querySelector('link[data-logitrust-leaflet]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    css.setAttribute('data-logitrust-leaflet', '1');
    document.head.appendChild(css);
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-logitrust-leaflet]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Leaflet failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.setAttribute('data-logitrust-leaflet', '1');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.body.appendChild(script);
  });

  return (window as any).L;
};

export const TransportCoordinatorLiveTrackingView: React.FC = () => {
  const { trainSchedules, shipments, incidents, setSelectedShipmentId, setActiveTab } = useLogistics();
  const loads = useMemo(() => buildCoordinatorLoads(trainSchedules, shipments, incidents), [trainSchedules, shipments, incidents]);
  const [selectedLoadId, setSelectedLoadId] = useState(loads[0]?.id || '');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [dashboardFocus, setDashboardFocus] = useState('');
  const [mapFailed, setMapFailed] = useState(false);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);


  useEffect(() => {
    let focus = '';
    try {
      focus = sessionStorage.getItem('coordinatorFocus') || '';
      sessionStorage.removeItem('coordinatorFocus');
    } catch {}
    if (focus === 'active-routes') {
      setDashboardFocus(focus);
      setSortMode('priority');
    }
  }, []);

  const sortedLoads = useMemo(() => (dashboardFocus === 'active-routes' ? loads.filter((load) => !['Departed','Cancelled'].includes(load.status)) : [...loads]).sort((a, b) => {
    if (sortMode === 'eta') return timeToMinutes(a.arrival) - timeToMinutes(b.arrival);
    const diff = priorityScore(a) - priorityScore(b);
    return diff !== 0 ? diff : timeToMinutes(a.arrival) - timeToMinutes(b.arrival);
  }), [loads, sortMode, dashboardFocus]);

  const load = loads.find((item) => item.id === selectedLoadId) || sortedLoads[0];
  const assignedShipments = load ? shipments.filter((shipment) => load.shipmentIds.includes(shipment.id)) : [];
  const relatedIncidents = load ? incidents.filter((incident) => incident.status !== 'Resolved' && incident.affectedServiceId === load.serviceId) : [];

  useEffect(() => {
    if (!load || !mapHostRef.current) return;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapHostRef.current) return;
      setMapFailed(false);

      if (!mapRef.current) {
        mapRef.current = L.map(mapHostRef.current, { zoomControl: true, attributionControl: true }).setView([3.45, 102.05], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);
      }

      if (layerRef.current) layerRef.current.remove();
      const group = L.layerGroup().addTo(mapRef.current);
      layerRef.current = group;

      HUB_COORDS.forEach((hub) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;border-radius:999px;background:#0ea5e9;border:4px solid white;box-shadow:0 2px 7px rgba(15,23,42,.35)"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker(hub.coord, { icon })
          .bindTooltip(`<b>${hub.name}</b><br/><span style="color:#64748b">${hub.code}</span>`, { direction: 'top', offset: [0, -8] })
          .addTo(group);
      });

      const origin = coordFor(load.originHub || load.route.split('→')[0]);
      const destination = coordFor(load.destinationHub || load.route.split('→')[1]);
      const routeColor = load.status === 'Delayed' || relatedIncidents.length ? '#f59e0b' : '#0284c7';

      L.polyline([origin, destination], {
        color: '#ffffff',
        weight: 9,
        opacity: 0.9,
      }).addTo(group);
      L.polyline([origin, destination], {
        color: routeColor,
        weight: 5,
        opacity: 0.95,
        dashArray: load.status === 'Delayed' ? '12 9' : undefined,
      }).addTo(group);

      const current = interpolate(origin, destination, progressFor(load) / 100);
      const transportIcon = L.divIcon({
        className: '',
        html: `<div style="width:38px;height:38px;border-radius:999px;background:${load.status === 'Delayed' ? '#f59e0b' : '#0369a1'};border:4px solid white;box-shadow:0 4px 12px rgba(15,23,42,.38);display:flex;align-items:center;justify-content:center;color:white;font:700 13px system-ui">${load.transportType === 'Train' ? 'T' : 'TR'}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });
      L.marker(current, { icon: transportIcon })
        .bindTooltip(`<b>${load.serviceId}</b><br/>${load.shipmentIds.length} shipments · ${load.parcelCount} parcels<br/>ETA ${load.arrival}`, { permanent: false, direction: 'top', offset: [0, -20] })
        .addTo(group);

      if (relatedIncidents.length) {
        const incidentPos = interpolate(origin, destination, Math.min(0.82, progressFor(load) / 100 + 0.09));
        const incidentIcon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:999px;background:#f43f5e;border:4px solid white;box-shadow:0 3px 9px rgba(190,24,93,.35);display:flex;align-items:center;justify-content:center;color:white;font:800 14px system-ui">!</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        L.marker(incidentPos, { icon: incidentIcon })
          .bindTooltip(`<b>${relatedIncidents[0].type}</b><br/>${relatedIncidents[0].location || load.route}`, { direction: 'top', offset: [0, -14] })
          .addTo(group);
      }

      const bounds = L.latLngBounds([...HUB_COORDS.map((hub) => hub.coord), origin, destination, current]);
      mapRef.current.fitBounds(bounds.pad(0.12), { animate: true, duration: 0.35 });
      window.setTimeout(() => mapRef.current?.invalidateSize(), 50);
    }).catch(() => setMapFailed(true));

    return () => { cancelled = true; };
  }, [load?.id, load?.status, load?.delayMinutes, relatedIncidents.length]);

  if (!load) return <div className="p-6 text-sm text-slate-500">No active transport loads are available.</div>;

  const Icon = load.transportType === 'Train' ? Train : Truck;
  const actionCount = loads.filter((item) => item.requiresCoordinatorAction).length;

  return (
    <div className="p-5 lg:p-7 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Transport Coordinator</p>
          <h1 className="text-2xl font-bold text-slate-950">Live Load Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor the national multi-modal network by load, then drill into shipments and parcels.</p>
        </div>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">{actionCount} load{actionCount === 1 ? '' : 's'} need attention</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-bold text-slate-950">Active Loads</h2><p className="text-xs text-slate-500 mt-1">Priority first, then ETA</p></div>
              <ArrowDownUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3 grid grid-cols-2 rounded-xl bg-white border border-slate-200 p-1">
              {(['priority','eta'] as SortMode[]).map((mode) => <button key={mode} onClick={() => setSortMode(mode)} className={`rounded-lg py-1.5 text-xs font-semibold ${sortMode === mode ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{mode === 'priority' ? 'Priority' : 'ETA'}</button>)}
            </div>
          </div>
          <div className="divide-y max-h-[720px] overflow-y-auto">
            {sortedLoads.map((item) => {
              const ItemIcon = item.transportType === 'Train' ? Train : Truck;
              const selected = item.id === load.id;
              return <button key={item.id} onClick={() => setSelectedLoadId(item.id)} className={`w-full p-4 text-left hover:bg-slate-50 ${selected ? 'bg-sky-50 border-l-4 border-sky-500' : 'border-l-4 border-transparent'}`}>
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><ItemIcon className="w-4 h-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2"><div><div className="font-bold text-slate-950">{item.serviceId}</div><div className="text-[11px] text-slate-400">{item.id}</div></div><span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusClass(item.status)}`}>{item.status}</span></div>
                    <div className="text-xs text-slate-500 mt-2 truncate">{item.route}</div>
                    <div className="flex items-center justify-between mt-2 text-xs"><span className="text-slate-400">ETA {item.arrival}</span>{item.delayMinutes > 0 && <span className="font-semibold text-amber-600">+{item.delayMinutes} min</span>}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{item.shipmentIds.length} shipments · {item.parcelCount} parcels</div>
                    {item.incidentIds.length > 0 && <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-rose-600"><AlertTriangle className="w-3 h-3" />{item.incidentIds.length} active incident{item.incidentIds.length === 1 ? '' : 's'}</div>}
                  </div>
                </div>
              </button>;
            })}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold tracking-wide text-slate-700">NATIONAL MULTI-MODAL CORRIDOR TELEMETRY</div>
                <div className="text-[11px] text-sky-600 mt-1">Johor Bahru · Melaka · Petaling Jaya · Ipoh · Butterworth</div>
              </div>
              <div className="flex items-center gap-2 text-xs"><span className="rounded-lg bg-sky-50 text-sky-700 px-2.5 py-1.5 border border-sky-100">All Corridors</span><span className="rounded-lg bg-slate-50 text-slate-600 px-2.5 py-1.5 border">Live Loads</span></div>
            </div>

            <div className="relative h-[520px] bg-slate-100">
              <div ref={mapHostRef} className="absolute inset-0 z-0" />
              {mapFailed && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100"><div className="max-w-sm rounded-2xl bg-white border p-5 text-center shadow-sm"><MapPin className="w-6 h-6 mx-auto text-sky-600"/><div className="font-bold mt-2">Map tiles unavailable</div><div className="text-xs text-slate-500 mt-1">Load data is still available. Connect to the internet to display the OpenStreetMap layer.</div></div></div>}

              <div className="absolute z-[500] right-4 top-4 w-[255px] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-4 shadow-xl">
                <div className="flex items-start justify-between gap-2"><div><div className="font-bold text-sky-700 text-lg">{load.serviceId}</div><div className="text-[11px] text-slate-400">{load.id}</div></div><span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusClass(load.status)}`}>{load.status}</span></div>
                <div className="mt-3 text-sm font-medium text-slate-800">{load.route}</div>
                <div className="mt-3 grid grid-cols-2 gap-y-2 text-xs"><span className="text-slate-400">Mode</span><span className="font-semibold text-right">{load.transportType}</span><span className="text-slate-400">ETA</span><span className="font-semibold text-right">{load.arrival}</span><span className="text-slate-400">Capacity</span><span className="font-semibold text-right">{load.utilisationPct}%</span><span className="text-slate-400">Cargo</span><span className="font-semibold text-right">{load.shipmentIds.length} / {load.parcelCount}</span></div>
                {load.delayMinutes > 0 && <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">Delay +{load.delayMinutes} min</div>}
              </div>

              <div className="absolute z-[500] left-4 bottom-4 rounded-xl border border-slate-200 bg-white/95 backdrop-blur p-3 shadow-lg text-[11px] space-y-2">
                <div className="flex items-center gap-2"><span className="w-6 h-[3px] bg-sky-600"/> Rail / road service route</div>
                <div className="flex items-center gap-2"><span className="w-6 h-[3px] bg-amber-500"/> Delayed / impacted route</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500"/> Active incident</div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b"><h2 className="font-bold text-slate-950">Shipments on {load.serviceId}</h2><p className="text-xs text-slate-500 mt-1">Load → Shipment → Parcel drill-down</p></div>
              <div className="divide-y">
                {assignedShipments.map((shipment) => <button key={shipment.id} onClick={() => { setSelectedShipmentId(shipment.id); setActiveTab('shipments'); }} className="w-full grid grid-cols-1 md:grid-cols-[.8fr_1.6fr_.7fr_.6fr] gap-2 md:gap-3 p-4 text-left hover:bg-slate-50 text-sm"><div className="font-bold text-sky-700">{shipment.id}</div><div><div>{shipment.origin} → {shipment.destination}</div><div className="text-xs text-slate-400 mt-0.5">{shipment.currentLocation}</div></div><div className="text-slate-700">ETA {shipment.eta || '—'}</div><div className="flex items-center gap-1 text-slate-600"><Package className="w-3.5 h-3.5" />{shipment.parcelCount || shipment.parcelIds?.length || 1}</div></button>)}
                {!assignedShipments.length && <div className="p-5 text-sm text-slate-500">No shipment records assigned to this load.</div>}
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2"><Icon className="w-4 h-4"/><h2 className="font-bold text-slate-950">Selected Load</h2></div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">Origin</div><div className="font-semibold">{load.originHub}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">Destination</div><div className="font-semibold">{load.destinationHub}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">Data source</div><div className="font-semibold">{load.dataSource}</div></div>
              </div>
              {relatedIncidents.length > 0 && <div className="mt-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-700"><AlertTriangle className="w-4 h-4"/>Active Incident</div>{relatedIncidents.map((incident) => <div key={incident.id} className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs"><div className="font-semibold">{incident.type}</div><div className="mt-1 text-amber-700">{incident.details}</div></div>)}</div>}
              <button onClick={() => setActiveTab('schedules')} className="mt-4 w-full rounded-xl bg-slate-950 text-white py-2.5 text-sm font-semibold">Open Schedule & Fleet</button>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
