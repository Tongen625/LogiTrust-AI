import { AuditLogEntry, HubLocation, Shipment, UserProfile } from '../types/logistics';

const cleanHubName = (value: string) => value.replace(/\s*\([^)]*\)\s*/g, ' ').trim().toLowerCase();

export const getAssignedHub = (hubs: HubLocation[], user: UserProfile) => {
  const location = cleanHubName(user.hubLocation);
  return hubs.find((hub) => {
    const name = cleanHubName(hub.name);
    return location.includes(name) || name.includes(location) || location.includes(hub.code.toLowerCase());
  });
};

export const shipmentTouchesHub = (shipment: Shipment, hub?: HubLocation) => {
  if (!hub) return false;
  const hubName = cleanHubName(hub.name);
  const hubFirst = hub.name.split(' ')[0].toLowerCase();
  const values = [shipment.originHub, shipment.destinationHub, shipment.currentLocation, ...shipment.timeline.map((t) => t.location)]
    .map(cleanHubName);
  return values.some((value) => value.includes(hubName) || value.includes(hubFirst) || value.includes(hub.code.toLowerCase()));
};

export const shipmentCurrentlyAtHub = (shipment: Shipment, hub?: HubLocation) => {
  if (!hub) return false;
  const current = cleanHubName(shipment.currentLocation);
  const name = cleanHubName(hub.name);
  return current.includes(name) || current.includes(hub.name.split(' ')[0].toLowerCase()) || current.includes(hub.code.toLowerCase());
};

export const auditTouchesHub = (log: AuditLogEntry, localShipmentIds: Set<string>, hub?: HubLocation) => {
  if (!hub) return false;
  if (log.shipmentId && localShipmentIds.has(log.shipmentId)) return true;
  const text = `${log.actor} ${log.role} ${log.event} ${log.evidence} ${log.result}`.toLowerCase();
  return text.includes(hub.name.toLowerCase()) || text.includes(hub.code.toLowerCase()) || text.includes('johor bahru') || text.includes('hub operator');
};
