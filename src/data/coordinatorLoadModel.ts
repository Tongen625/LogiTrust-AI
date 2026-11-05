import { COORDINATOR_ROAD_SERVICES } from './transportCoordinatorDemoData';

export type CoordinatorTransportType = 'Train' | 'Truck' | 'Intermodal';
export type CoordinatorLoadStatus = 'On Time' | 'Delayed' | 'Departed' | 'Cancelled';

export interface CoordinatorLoad {
  id: string;
  serviceId: string;
  transportType: CoordinatorTransportType;
  route: string;
  originHub: string;
  destinationHub: string;
  departure: string;
  arrival: string;
  status: CoordinatorLoadStatus;
  delayMinutes: number;
  utilisationPct: number;
  capacityAvailable: boolean;
  shipmentIds: string[];
  parcelCount: number;
  dataSource: string;
  incidentIds: string[];
  incidentTypes: string[];
  requiresCoordinatorAction: boolean;
}

const serviceToken = (value = '') => {
  const match = value.match(/(?:Train\s+)?(T\d+|TR-\d+|FD-\d+[A-Z]?)/i);
  return match?.[1]?.toUpperCase() || value.trim();
};

const deriveRoute = (shipments: any[]) => {
  const first = shipments[0];
  if (!first) return 'Route not assigned';
  return `${first.origin || first.originHub || 'Origin'} → ${first.destination || first.destinationHub || 'Destination'}`;
};

export const buildCoordinatorLoads = (
  trainSchedules: any[],
  shipments: any[],
  incidents: any[]
): CoordinatorLoad[] => {
  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved');

  const railLoads: CoordinatorLoad[] = trainSchedules.map((service) => {
    const assigned = shipments.filter((shipment) => serviceToken(shipment.assignedVehicleOrTrain) === service.id);
    const relatedIncidents = activeIncidents.filter((incident) => incident.affectedServiceId === service.id);
    const routeParts = String(service.route || '').split('→').map((x: string) => x.trim());
    return {
      id: `LOAD-${service.id}`,
      serviceId: service.id,
      transportType: 'Train',
      route: service.route || deriveRoute(assigned),
      originHub: routeParts[0] || assigned[0]?.originHub || 'Origin hub',
      destinationHub: routeParts[1] || assigned[0]?.destinationHub || 'Destination hub',
      departure: service.departure || '—',
      arrival: service.arrival || '—',
      status: service.status || 'On Time',
      delayMinutes: service.delayMinutes || 0,
      utilisationPct: service.currentUtilisationPct ?? 0,
      capacityAvailable: service.capacityAvailable ?? true,
      shipmentIds: assigned.map((shipment) => shipment.id),
      parcelCount: assigned.reduce((sum, shipment) => sum + (shipment.parcelCount || shipment.parcelIds?.length || 1), 0),
      dataSource: service.dataSource || 'External Schedule Feed',
      incidentIds: relatedIncidents.map((incident) => incident.id),
      incidentTypes: relatedIncidents.map((incident) => incident.type),
      requiresCoordinatorAction: relatedIncidents.length > 0 || ['Delayed', 'Cancelled'].includes(service.status),
    };
  });

  const railIds = new Set(railLoads.map((load) => load.serviceId));
  const roadLoads: CoordinatorLoad[] = COORDINATOR_ROAD_SERVICES
    .filter((service) => !railIds.has(service.id))
    .map((service) => {
      const assigned = shipments.filter((shipment) =>
        service.affectedShipmentIds.includes(shipment.id) || serviceToken(shipment.assignedVehicleOrTrain) === service.id
      );
      const shipmentIds = Array.from(new Set([...service.affectedShipmentIds, ...assigned.map((s) => s.id)]));
      const relatedIncidents = activeIncidents.filter((incident) => incident.affectedServiceId === service.id);
      return {
        id: `LOAD-${service.id}`,
        serviceId: service.id,
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
        shipmentIds,
        parcelCount: shipments
          .filter((shipment) => shipmentIds.includes(shipment.id))
          .reduce((sum, shipment) => sum + (shipment.parcelCount || shipment.parcelIds?.length || 1), 0),
        dataSource: service.dataSource,
        incidentIds: relatedIncidents.map((incident) => incident.id),
        incidentTypes: relatedIncidents.map((incident) => incident.type),
        requiresCoordinatorAction: relatedIncidents.length > 0 || ['Delayed', 'Cancelled'].includes(service.status),
      };
    });

  return [...railLoads, ...roadLoads];
};

export const getLoadForShipment = (loads: CoordinatorLoad[], shipment: any) => {
  return loads.find((load) => load.shipmentIds.includes(shipment.id)) || null;
};
