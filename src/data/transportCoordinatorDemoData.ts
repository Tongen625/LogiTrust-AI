export type CoordinatorServiceStatus = 'On Time' | 'Delayed' | 'Departed' | 'Cancelled';
export type CoordinatorTransportType = 'Truck' | 'Train' | 'Intermodal';

export interface CoordinatorRoadService {
  id: string;
  transportType: CoordinatorTransportType;
  routeId: string;
  route: string;
  originHub: string;
  destinationHub: string;
  departure: string;
  arrival: string;
  status: CoordinatorServiceStatus;
  delayMinutes: number;
  utilisationPct: number;
  capacityAvailable: boolean;
  affectedShipmentIds: string[];
  dataSource: 'Manual Operator Update' | 'Fleet Dispatch Feed';
}

export interface CoordinatorNetworkRoute {
  id: string;
  name: string;
  originHub: string;
  destinationHub: string;
  corridor: string;
  transportTypes: CoordinatorTransportType[];
  serviceIds: string[];
}

export const COORDINATOR_ROAD_SERVICES: CoordinatorRoadService[] = [
  {
    id: 'TR-720',
    transportType: 'Truck',
    routeId: 'R-JB-MKZ',
    route: 'Johor Bahru → Melaka',
    originHub: 'Johor Bahru Southern Region Hub',
    destinationHub: 'Melaka Branch Transfer Node',
    departure: '11:45',
    arrival: '14:10',
    status: 'Departed',
    delayMinutes: 0,
    utilisationPct: 74,
    capacityAvailable: true,
    affectedShipmentIds: ['MY410105', 'MY410108'],
    dataSource: 'Fleet Dispatch Feed',
  },
  {
    id: 'TR-801',
    transportType: 'Truck',
    routeId: 'R-MKZ-PJ',
    route: 'Melaka → Petaling Jaya',
    originHub: 'Melaka Branch Transfer Node',
    destinationHub: 'Petaling Jaya Auto Hub',
    departure: '12:20',
    arrival: '15:05',
    status: 'On Time',
    delayMinutes: 0,
    utilisationPct: 68,
    capacityAvailable: true,
    affectedShipmentIds: ['MY410101', 'MY410102', 'MY410103', 'MY410115'],
    dataSource: 'Fleet Dispatch Feed',
  },
  {
    id: 'TR-228',
    transportType: 'Truck',
    routeId: 'R-MKZ-JB',
    route: 'Melaka → Johor Bahru',
    originHub: 'Melaka Branch Transfer Node',
    destinationHub: 'Johor Bahru Southern Region Hub',
    departure: '09:15',
    arrival: '11:20',
    status: 'Delayed',
    delayMinutes: 25,
    utilisationPct: 82,
    capacityAvailable: true,
    affectedShipmentIds: ['MY410109', 'MY410111'],
    dataSource: 'Manual Operator Update',
  },
  {
    id: 'TR-642',
    transportType: 'Truck',
    routeId: 'R-PJ-IPH',
    route: 'Petaling Jaya → Ipoh',
    originHub: 'Petaling Jaya Auto Hub',
    destinationHub: 'Ipoh / Perak Regional Node',
    departure: '13:00',
    arrival: '15:40',
    status: 'On Time',
    delayMinutes: 0,
    utilisationPct: 91,
    capacityAvailable: true,
    affectedShipmentIds: ['MY410104', 'MY410106', 'MY410113', 'MY410114'],
    dataSource: 'Fleet Dispatch Feed',
  },
  {
    id: 'TR-771',
    transportType: 'Truck',
    routeId: 'R-IPH-BWH',
    route: 'Ipoh → Butterworth',
    originHub: 'Ipoh / Perak Regional Node',
    destinationHub: 'Butterworth Northern Region Hub',
    departure: '15:50',
    arrival: '18:00',
    status: 'On Time',
    delayMinutes: 0,
    utilisationPct: 57,
    capacityAvailable: true,
    affectedShipmentIds: ['MY410104', 'MY410114'],
    dataSource: 'Fleet Dispatch Feed',
  },
  {
    id: 'TR-991',
    transportType: 'Truck',
    routeId: 'R-MKZ-PJ',
    route: 'Melaka → Petaling Jaya',
    originHub: 'Melaka Branch Transfer Node',
    destinationHub: 'Petaling Jaya Auto Hub',
    departure: '11:30',
    arrival: '14:20',
    status: 'Delayed',
    delayMinutes: 40,
    utilisationPct: 76,
    capacityAvailable: true,
    affectedShipmentIds: ['MY410115'],
    dataSource: 'Manual Operator Update',
  },
  {
    id: 'TR-845',
    transportType: 'Truck',
    routeId: 'R-PJ-JB',
    route: 'Petaling Jaya → Johor Bahru',
    originHub: 'Petaling Jaya Auto Hub',
    destinationHub: 'Johor Bahru Southern Region Hub',
    departure: '14:10',
    arrival: '18:25',
    status: 'On Time',
    delayMinutes: 0,
    utilisationPct: 63,
    capacityAvailable: true,
    affectedShipmentIds: ['MY410110', 'MY410112'],
    dataSource: 'Fleet Dispatch Feed',
  },
  {
    id: 'TR-503',
    transportType: 'Truck',
    routeId: 'R-JB-PJ',
    route: 'Johor Bahru → Petaling Jaya',
    originHub: 'Johor Bahru Southern Region Hub',
    destinationHub: 'Petaling Jaya Auto Hub',
    departure: '16:00',
    arrival: '20:15',
    status: 'Cancelled',
    delayMinutes: 0,
    utilisationPct: 0,
    capacityAvailable: false,
    affectedShipmentIds: [],
    dataSource: 'Manual Operator Update',
  },
];

export const COORDINATOR_NETWORK_ROUTES: CoordinatorNetworkRoute[] = [
  {
    id: 'R-JB-PJ',
    name: 'Johor Bahru → Petaling Jaya',
    originHub: 'Johor Bahru Southern Region Hub',
    destinationHub: 'Petaling Jaya Auto Hub',
    corridor: 'Southern–Central',
    transportTypes: ['Train', 'Truck', 'Intermodal'],
    serviceIds: ['T105', 'T108', 'TR-503'],
  },
  {
    id: 'R-JB-MKZ',
    name: 'Johor Bahru → Melaka',
    originHub: 'Johor Bahru Southern Region Hub',
    destinationHub: 'Melaka Branch Transfer Node',
    corridor: 'Southern Feeder',
    transportTypes: ['Truck'],
    serviceIds: ['TR-720'],
  },
  {
    id: 'R-MKZ-JB',
    name: 'Melaka → Johor Bahru',
    originHub: 'Melaka Branch Transfer Node',
    destinationHub: 'Johor Bahru Southern Region Hub',
    corridor: 'Southern Feeder',
    transportTypes: ['Truck'],
    serviceIds: ['TR-228'],
  },
  {
    id: 'R-MKZ-PJ',
    name: 'Melaka → Petaling Jaya',
    originHub: 'Melaka Branch Transfer Node',
    destinationHub: 'Petaling Jaya Auto Hub',
    corridor: 'Central Feeder',
    transportTypes: ['Truck'],
    serviceIds: ['TR-801', 'TR-991'],
  },
  {
    id: 'R-PJ-IPH',
    name: 'Petaling Jaya → Ipoh',
    originHub: 'Petaling Jaya Auto Hub',
    destinationHub: 'Ipoh / Perak Regional Node',
    corridor: 'Central–Northern',
    transportTypes: ['Truck', 'Intermodal'],
    serviceIds: ['TR-642'],
  },
  {
    id: 'R-IPH-BWH',
    name: 'Ipoh → Butterworth',
    originHub: 'Ipoh / Perak Regional Node',
    destinationHub: 'Butterworth Northern Region Hub',
    corridor: 'Northern Feeder',
    transportTypes: ['Truck'],
    serviceIds: ['TR-771'],
  },
  {
    id: 'R-PJ-JB',
    name: 'Petaling Jaya → Johor Bahru',
    originHub: 'Petaling Jaya Auto Hub',
    destinationHub: 'Johor Bahru Southern Region Hub',
    corridor: 'Central–Southern',
    transportTypes: ['Train', 'Truck'],
    serviceIds: ['T097', 'TR-845'],
  },
];
