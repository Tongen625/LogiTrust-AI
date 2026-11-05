import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { IncidentType, TrainSchedule } from '../types/logistics';
import { COORDINATOR_ROAD_SERVICES } from '../data/transportCoordinatorDemoData';
import {
  AlertTriangle,
  ArrowRight,
  BusFront,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Train,
  Truck,
  X,
} from 'lucide-react';

type UnifiedServiceStatus = 'On Time' | 'Delayed' | 'Departed' | 'Cancelled';
type UnifiedTransportType = 'Train' | 'Truck' | 'Intermodal';
type StatusFilter = 'All' | UnifiedServiceStatus;
type TransportFilter = 'All' | UnifiedTransportType;

interface UnifiedService {
  id: string;
  transportType: UnifiedTransportType;
  route: string;
  originHub: string;
  destinationHub: string;
  departure: string;
  arrival: string;
  status: UnifiedServiceStatus;
  delayMinutes: number;
  utilisationPct: number;
  capacityAvailable: boolean;
  affectedShipmentIds: string[];
  dataSource: string;
  isTrain: boolean;
  originalTrain?: TrainSchedule;
}

const cx = (...items: Array<string | false | undefined | null>) => items.filter(Boolean).join(' ');

const statusClass: Record<UnifiedServiceStatus, string> = {
  'On Time': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Delayed: 'border-amber-200 bg-amber-50 text-amber-700',
  Departed: 'border-blue-200 bg-blue-50 text-blue-700',
  Cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

const incidentTypes: IncidentType[] = ['Train Delay', 'Flood', 'Traffic', 'Vehicle Breakdown', 'Accident'];

const capacityLabel = (pct: number) => {
  if (pct >= 95) return 'Near full';
  if (pct >= 80) return 'High';
  return 'Available';
};

const capacityClass = (pct: number) => {
  if (pct >= 95) return 'bg-rose-500';
  if (pct >= 80) return 'bg-amber-500';
  return 'bg-emerald-500';
};

const transportIcon = (type: UnifiedTransportType) => {
  if (type === 'Train') return <Train className="w-4 h-4" />;
  if (type === 'Truck') return <Truck className="w-4 h-4" />;
  return <BusFront className="w-4 h-4" />;
};

export const SchedulesView: React.FC = () => {
  const {
    trainSchedules,
    shipments,
    incidents,
    recommendations,
    userRole,
    updateTrainStatus,
    addNewTrainSchedule,
    addIncident,
    submitRecommendationForManagerApproval,
    applyCoordinatorOperationalRecovery,
    setSelectedShipmentId,
    setActiveTab,
  } = useLogistics();

  const canEdit = userRole === 'Transport Coordinator';

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [transportFilter, setTransportFilter] = useState<TransportFilter>('All');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [showTrainStatusModal, setShowTrainStatusModal] = useState(false);

  const [incidentType, setIncidentType] = useState<IncidentType>('Train Delay');
  const [incidentTransport, setIncidentTransport] = useState<UnifiedTransportType>('Train');
  const [incidentServiceId, setIncidentServiceId] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [incidentDetails, setIncidentDetails] = useState('');

  const [newTrainId, setNewTrainId] = useState('');
  const [newTrainRoute, setNewTrainRoute] = useState('Johor Bahru → Petaling Jaya');
  const [newTrainOrigin, setNewTrainOrigin] = useState('hub-jb');
  const [newTrainDestination, setNewTrainDestination] = useState('hub-pj');
  const [newTrainDeparture, setNewTrainDeparture] = useState('14:00');
  const [newTrainArrival, setNewTrainArrival] = useState('17:15');
  const [newTrainCapacity, setNewTrainCapacity] = useState('450');
  const [newTrainUtilisation, setNewTrainUtilisation] = useState('40');

  const [trainStatus, setTrainStatus] = useState<UnifiedServiceStatus>('On Time');
  const [trainDelayMinutes, setTrainDelayMinutes] = useState(0);
  const [trainStatusNote, setTrainStatusNote] = useState('Manual provider status update');

  const services = useMemo<UnifiedService[]>(() => {
    const trainRows: UnifiedService[] = trainSchedules.map((train) => ({
      id: train.id,
      transportType: 'Train',
      route: train.route,
      originHub: train.originHub,
      destinationHub: train.destHub,
      departure: train.departure,
      arrival: train.arrival,
      status: train.status,
      delayMinutes: train.delayMinutes,
      utilisationPct: train.currentUtilisationPct,
      capacityAvailable: train.capacityAvailable,
      affectedShipmentIds: shipments.filter((shipment) => shipment.assignedVehicleOrTrain.includes(train.id)).map((shipment) => shipment.id),
      dataSource: train.dataSource || 'External Schedule Feed',
      isTrain: true,
      originalTrain: train,
    }));

    const roadRows: UnifiedService[] = COORDINATOR_ROAD_SERVICES.map((service) => ({
      id: service.id,
      transportType: service.transportType,
      route: service.route,
      originHub: service.originHub,
      destinationHub: service.destinationHub,
      departure: service.departure,
      arrival: service.arrival,
      status: service.status,
      delayMinutes: service.delayMinutes,
      utilisationPct: service.utilisationPct,
      capacityAvailable: service.capacityAvailable,
      affectedShipmentIds: service.affectedShipmentIds,
      dataSource: service.dataSource,
      isTrain: false,
    }));

    return [...trainRows, ...roadRows];
  }, [trainSchedules, shipments]);

  const visibleServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesStatus = statusFilter === 'All' || service.status === statusFilter;
      const matchesTransport = transportFilter === 'All' || service.transportType === transportFilter;
      const matchesQuery = !normalized || `${service.id} ${service.route} ${service.originHub} ${service.destinationHub}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesTransport && matchesQuery;
    });
  }, [services, query, statusFilter, transportFilter]);

  const selectedService = services.find((service) => service.id === selectedServiceId) || visibleServices[0] || services[0];

  const selectedIncidents = useMemo(() => {
    if (!selectedService) return [];
    return incidents.filter((incident) => incident.affectedServiceId === selectedService.id && incident.status !== 'Resolved');
  }, [incidents, selectedService]);

  const selectedRecommendations = useMemo(() => {
    if (!selectedService) return [];
    const affected = new Set(selectedService.affectedShipmentIds);
    return recommendations.filter((recommendation: any) =>
      affected.has(recommendation.shipmentId) && ['Coordinator Review', 'Pending Approval'].includes(recommendation.status)
    );
  }, [recommendations, selectedService]);

  const alternativeServices = useMemo(() => {
    if (!selectedService) return [];
    return services
      .filter((service) => service.id !== selectedService.id)
      .filter((service) => service.status !== 'Cancelled')
      .filter((service) => service.capacityAvailable && service.utilisationPct < 95)
      .filter((service) => service.transportType === selectedService.transportType || selectedService.status === 'Delayed' || selectedService.status === 'Cancelled')
      .sort((a, b) => a.utilisationPct - b.utilisationPct)
      .slice(0, 3);
  }, [services, selectedService]);

  const stats = useMemo(() => ({
    services: services.length,
    active: services.filter((service) => service.status === 'On Time' || service.status === 'Delayed').length,
    delayed: services.filter((service) => service.status === 'Delayed').length,
    capacityRisk: services.filter((service) => service.status !== 'Cancelled' && service.utilisationPct >= 80).length,
    openIncidents: incidents.filter((incident) => incident.category === 'Transport' && incident.status !== 'Resolved').length,
  }), [services, incidents]);

  const openIncidentModal = (service?: UnifiedService) => {
    if (service) {
      setIncidentServiceId(service.id);
      setIncidentTransport(service.transportType);
      setIncidentLocation(service.route);
      setIncidentType(service.transportType === 'Train' ? 'Train Delay' : 'Traffic');
    }
    setIncidentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setShowIncidentModal(true);
  };

  const submitIncident = (event: React.FormEvent) => {
    event.preventDefault();
    addIncident({
      type: incidentType,
      occurredAt: incidentTime || undefined,
      location: incidentLocation || 'Transport route',
      severity: incidentSeverity,
      transportType: incidentTransport,
      affectedServiceId: incidentServiceId || undefined,
      details: incidentDetails || `${incidentType} reported for ${incidentServiceId || incidentTransport}.`,
    });
    setShowIncidentModal(false);
    setIncidentDetails('');
  };

  const submitTrain = (event: React.FormEvent) => {
    event.preventDefault();
    addNewTrainSchedule({
      id: newTrainId.trim().toUpperCase() || undefined,
      route: newTrainRoute,
      originHub: newTrainOrigin,
      destHub: newTrainDestination,
      departure: newTrainDeparture,
      arrival: newTrainArrival,
      status: 'On Time',
      delayMinutes: 0,
      capacityAvailable: true,
      currentUtilisationPct: Number(newTrainUtilisation) || 40,
      cargoCapacityTons: Number(newTrainCapacity) || 450,
      dataSource: 'Manual Operator Override',
      isManualOverride: true,
      notes: 'Manual railway timetable entry',
    });
    setShowTrainModal(false);
    setNewTrainId('');
  };

  const openTrainStatusEditor = (service: UnifiedService) => {
    if (!service.originalTrain) return;
    setSelectedServiceId(service.id);
    setTrainStatus(service.status);
    setTrainDelayMinutes(service.delayMinutes || 0);
    setTrainStatusNote(service.originalTrain.notes || 'Manual provider status update');
    setShowTrainStatusModal(true);
  };

  const saveTrainStatus = () => {
    if (!selectedService?.originalTrain) return;
    updateTrainStatus(selectedService.id, trainStatus, trainStatus === 'Delayed' ? trainDelayMinutes : 0, trainStatusNote);
    setShowTrainStatusModal(false);
  };

  const selectedAffectedShipments = selectedService
    ? shipments.filter((shipment) => selectedService.affectedShipmentIds.includes(shipment.id))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 space-y-5 text-slate-900">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Schedule & Fleet</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">Coordinate train and road services across hubs, monitor capacity, and handle transport incidents.</p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openIncidentModal(selectedService)} className="px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Add Transport Incident
            </button>
            <button onClick={() => setShowTrainModal(true)} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Add Manual Train Service
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Services', value: stats.services },
          { label: 'Active / Delayed', value: stats.active },
          { label: 'Delayed', value: stats.delayed },
          { label: 'Capacity Watch', value: stats.capacityRisk },
          { label: 'Open Transport Incidents', value: stats.openIncidents },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">{item.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <SlidersHorizontal className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-blue-900">Rail schedule fallback</div>
          <div className="text-xs text-blue-800 mt-1 leading-relaxed">Train schedule and status can be entered manually when provider integration is unavailable. Road services remain visible from fleet dispatch data, while disruptions are recorded through Transport Incidents.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Transport Services</h2>
                <p className="text-xs text-slate-500 mt-1">Train, truck and intermodal schedules managed across the network.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[240px_150px_150px] gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search service or route" className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-400" />
                </div>
                <div className="relative">
                  <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select value={transportFilter} onChange={(event) => setTransportFilter(event.target.value as TransportFilter)} className="w-full appearance-none border border-slate-200 rounded-xl pl-9 pr-2 py-2 text-xs bg-white outline-none focus:border-blue-400">
                    <option value="All">All Transport</option>
                    <option value="Train">Train</option>
                    <option value="Truck">Truck</option>
                    <option value="Intermodal">Intermodal</option>
                  </select>
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-blue-400">
                  <option value="All">All Status</option>
                  <option value="On Time">On Time</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Departed">Departed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3">Service</th>
                  <th className="text-left px-4 py-3">Route</th>
                  <th className="text-left px-4 py-3">Schedule</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Capacity</th>
                  <th className="text-left px-4 py-3">Shipments</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleServices.map((service) => (
                  <tr key={service.id} className={cx('hover:bg-slate-50 transition', selectedService?.id === service.id && 'bg-blue-50/60')}>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedServiceId(service.id)} className="text-left">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">{transportIcon(service.transportType)}</span>
                          {service.id}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 ml-10">{service.transportType} · {service.dataSource}</div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{service.route}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{service.departure} <ArrowRight className="w-3 h-3 inline mx-1" /> {service.arrival}</div>
                      {service.delayMinutes > 0 && <div className="text-amber-700 mt-1">+{service.delayMinutes} min delay</div>}
                    </td>
                    <td className="px-4 py-3"><span className={cx('rounded-full border px-2.5 py-1 text-xs font-semibold', statusClass[service.status])}>{service.status}</span></td>
                    <td className="px-4 py-3 min-w-[150px]">
                      <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">{capacityLabel(service.utilisationPct)}</span><span className="font-semibold text-slate-800">{service.utilisationPct}%</span></div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className={cx('h-full rounded-full', capacityClass(service.utilisationPct))} style={{ width: `${Math.min(service.utilisationPct, 100)}%` }} /></div>
                    </td>
                    <td className="px-4 py-3"><span className="font-semibold text-slate-900">{service.affectedShipmentIds.length}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {service.isTrain && canEdit && <button onClick={() => openTrainStatusEditor(service)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50">Update Status</button>}
                        {canEdit && <button onClick={() => openIncidentModal(service)} className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-700 hover:bg-rose-50">Report Incident</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          {selectedService ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500">Selected Service</div>
                    <div className="flex items-center gap-2 mt-1"><span className="text-blue-700">{transportIcon(selectedService.transportType)}</span><h2 className="text-xl font-bold">{selectedService.id}</h2></div>
                    <div className="text-sm text-slate-600 mt-1">{selectedService.route}</div>
                  </div>
                  <span className={cx('rounded-full border px-2.5 py-1 text-xs font-semibold', statusClass[selectedService.status])}>{selectedService.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Departure</div><div className="font-semibold mt-1">{selectedService.departure}</div></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Arrival</div><div className="font-semibold mt-1">{selectedService.arrival}</div></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Utilisation</div><div className="font-semibold mt-1">{selectedService.utilisationPct}% · {capacityLabel(selectedService.utilisationPct)}</div></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Affected / Assigned</div><div className="font-semibold mt-1">{selectedService.affectedShipmentIds.length} shipments</div></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold">Affected / Assigned Shipments</h3>
                  <p className="text-xs text-slate-500 mt-1">Shipments currently linked to this service.</p>
                </div>
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                  {selectedAffectedShipments.length ? selectedAffectedShipments.map((shipment) => (
                    <button key={shipment.id} onClick={() => { setSelectedShipmentId(shipment.id); setActiveTab('shipments'); }} className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between gap-3">
                      <div><div className="font-semibold text-blue-700 text-sm">{shipment.id}</div><div className="text-xs text-slate-500 mt-0.5">{shipment.origin} → {shipment.destination}</div></div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )) : <div className="p-4 text-sm text-slate-500">No shipment currently assigned to this service.</div>}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Transport Incidents</h2>
              <p className="text-xs text-slate-500 mt-1">Open disruptions affecting schedule, route or fleet availability.</p>
            </div>
            {canEdit && <button onClick={() => openIncidentModal(selectedService)} className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Incident</button>}
          </div>
          <div className="divide-y divide-slate-100">
            {incidents.filter((incident) => incident.category === 'Transport' && incident.status !== 'Resolved').slice(0, 6).map((incident) => (
              <div key={incident.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /><span className="font-semibold text-slate-900">{incident.type}</span>{incident.affectedServiceId && <span className="text-xs font-mono text-blue-700">{incident.affectedServiceId}</span>}</div>
                    <div className="text-xs text-slate-500 mt-1"><MapPin className="w-3 h-3 inline mr-1" />{incident.location} · <Clock3 className="w-3 h-3 inline mx-1" />{incident.occurredAt}</div>
                    <div className="text-sm text-slate-600 mt-2">{incident.details}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700">{incident.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5"><span className="text-slate-500">Affected shipments</span><div className="font-semibold text-slate-900 mt-1">{incident.affectedShipmentIds.length}</div></div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5"><span className="text-slate-500">Approval</span><div className="font-semibold text-slate-900 mt-1">{incident.requiresApproval ? 'Pending Manager approval' : incident.category === 'Transport' || incident.type === 'Hub Congestion' || incident.type === 'Wrong Hub' ? 'Coordinator review first' : 'Operational handling'}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold">Alternative Service Review</h2>
            <p className="text-xs text-slate-500 mt-1">Available capacity options for the selected disrupted or constrained service.</p>
          </div>

          {selectedService && (selectedService.status === 'Delayed' || selectedService.status === 'Cancelled' || selectedService.utilisationPct >= 80 || selectedIncidents.length > 0) ? (
            <div className="p-4 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs font-semibold text-amber-800">Why review alternatives?</div>
                <div className="text-sm text-amber-900 mt-1">{selectedService.id} is {selectedService.status.toLowerCase()} {selectedService.utilisationPct >= 80 ? `and at ${selectedService.utilisationPct}% utilisation` : ''}. Check capacity before moving affected shipments.</div>
              </div>

              {alternativeServices.length ? alternativeServices.map((service) => (
                <div key={service.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="flex items-center gap-2 font-semibold">{transportIcon(service.transportType)} {service.id}</div><div className="text-xs text-slate-500 mt-1">{service.route}</div></div>
                    <span className="text-xs font-semibold text-emerald-700">{100 - service.utilisationPct}% available</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">Departure</div><div className="font-semibold mt-1">{service.departure}</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">Arrival</div><div className="font-semibold mt-1">{service.arrival}</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">Utilisation</div><div className="font-semibold mt-1">{service.utilisationPct}%</div></div>
                  </div>
                </div>
              )) : <div className="text-sm text-slate-500">No suitable alternative service currently has enough capacity.</div>}

              {selectedRecommendations.length > 0 && (
                <div className="space-y-3">
                  {selectedRecommendations.map((recommendation: any) => (
                    <div key={recommendation.id} className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-blue-900">{recommendation.id} · {recommendation.status}</div>
                          <div className="text-sm text-blue-900 mt-1">{recommendation.recommendation}</div>
                          <div className="text-xs text-blue-800 mt-2">Transport Coordinator reviews feasibility first. Manager approval is only requested for a consequential transport change.</div>
                        </div>
                        {recommendation.status === 'Coordinator Review' && canEdit && (
                          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => applyCoordinatorOperationalRecovery(recommendation.id, 'Operational adjustment selected after ETA, capacity, cost, security and SLA review.')}
                              className="px-3 py-2 rounded-lg border border-emerald-300 bg-white text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                            >
                              Apply Minor Adjustment
                            </button>
                            <button
                              type="button"
                              onClick={() => submitRecommendationForManagerApproval(recommendation.id, 'Consequential reroute / schedule change selected after Transport Coordinator review.')}
                              className="px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800"
                            >
                              Submit Major Change for Manager Approval
                            </button>
                          </div>
                        )}
                        {recommendation.status === 'Pending Approval' && (
                          <div className="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold shrink-0">
                            Awaiting Operations Manager
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">Select a delayed, cancelled, high-utilisation, or incident-affected service to review alternatives.</div>
          )}
        </div>
      </div>

      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitIncident} className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between"><div><h3 className="text-lg font-bold">Add Transport Incident</h3><p className="text-xs text-slate-500 mt-1">Record the actual transport problem and affected service.</p></div><button type="button" onClick={() => setShowIncidentModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Incident Type</span><select value={incidentType} onChange={(event) => setIncidentType(event.target.value as IncidentType)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5">{incidentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Transport Type</span><select value={incidentTransport} onChange={(event) => setIncidentTransport(event.target.value as UnifiedTransportType)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"><option value="Train">Train</option><option value="Truck">Truck</option><option value="Intermodal">Intermodal</option></select></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Service ID</span><select value={incidentServiceId} onChange={(event) => { const id = event.target.value; setIncidentServiceId(id); const service = services.find((row) => row.id === id); if (service) { setIncidentTransport(service.transportType); setIncidentLocation(service.route); } }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"><option value="">Select service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.id} · {service.route}</option>)}</select></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Incident Time</span><input value={incidentTime} onChange={(event) => setIncidentTime(event.target.value)} placeholder="e.g. 14:20" className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">Location</span><input value={incidentLocation} onChange={(event) => setIncidentLocation(event.target.value)} placeholder="Affected corridor / location" className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Severity</span><select value={incidentSeverity} onChange={(event) => setIncidentSeverity(event.target.value as typeof incidentSeverity)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></label>
              <div className="hidden md:block" />
              <label className="space-y-1 md:col-span-2"><span className="text-xs font-medium text-slate-600">Details</span><textarea value={incidentDetails} onChange={(event) => setIncidentDetails(event.target.value)} rows={3} placeholder="What happened? Example: KTM provider called to report T105 delayed by 90 minutes." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 resize-none" /></label>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2"><button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold">Create Incident</button></div>
          </form>
        </div>
      )}

      {showTrainModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitTrain} className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between"><div><h3 className="text-lg font-bold">Add Manual Train Service</h3><p className="text-xs text-slate-500 mt-1">Fallback for unavailable external railway schedule integration.</p></div><button type="button" onClick={() => setShowTrainModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Service ID</span><input value={newTrainId} onChange={(event) => setNewTrainId(event.target.value)} placeholder="T120" className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Route</span><input value={newTrainRoute} onChange={(event) => setNewTrainRoute(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Origin Hub ID</span><input value={newTrainOrigin} onChange={(event) => setNewTrainOrigin(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Destination Hub ID</span><input value={newTrainDestination} onChange={(event) => setNewTrainDestination(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Departure</span><input value={newTrainDeparture} onChange={(event) => setNewTrainDeparture(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Arrival</span><input value={newTrainArrival} onChange={(event) => setNewTrainArrival(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Capacity (tons)</span><input value={newTrainCapacity} onChange={(event) => setNewTrainCapacity(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
              <label className="space-y-1"><span className="text-xs font-medium text-slate-600">Current Utilisation %</span><input value={newTrainUtilisation} onChange={(event) => setNewTrainUtilisation(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2"><button type="button" onClick={() => setShowTrainModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold">Cancel</button><button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Add Train Service</button></div>
          </form>
        </div>
      )}

      {showTrainStatusModal && selectedService?.originalTrain && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between"><div><h3 className="text-lg font-bold">Update Train Status</h3><p className="text-xs text-slate-500 mt-1">{selectedService.id} · manual provider update</p></div><button onClick={() => setShowTrainStatusModal(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <div className="p-5 space-y-4 text-sm">
              <label className="space-y-1 block"><span className="text-xs font-medium text-slate-600">Status</span><select value={trainStatus} onChange={(event) => setTrainStatus(event.target.value as UnifiedServiceStatus)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5"><option value="On Time">On Time</option><option value="Delayed">Delayed</option><option value="Departed">Departed</option><option value="Cancelled">Cancelled</option></select></label>
              {trainStatus === 'Delayed' && <label className="space-y-1 block"><span className="text-xs font-medium text-slate-600">Delay Minutes</span><input type="number" min={0} value={trainDelayMinutes} onChange={(event) => setTrainDelayMinutes(Number(event.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" /></label>}
              <label className="space-y-1 block"><span className="text-xs font-medium text-slate-600">Update Note</span><textarea rows={3} value={trainStatusNote} onChange={(event) => setTrainStatusNote(event.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 resize-none" /></label>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2"><button onClick={() => setShowTrainStatusModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold">Cancel</button><button onClick={saveTrainStatus} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Save Update</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
