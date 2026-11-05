import { AuditLogEntry, HubHandoffVerification, HubManifest, ParcelItem, Shipment } from '../types/logistics';

const JB = 'Johor Bahru Southern Region Hub (JHB-SRH)';
const PJ = 'Petaling Jaya Auto Hub (PJ-AH)';
const MKZ = 'Melaka Branch Transfer Node (MKZ-BR)';
const BWH = 'Butterworth Northern Region Hub (BWH-NRH)';


const buildParcels = (
  shipmentId: string,
  parcelIds: string[],
  priority: Shipment['priority'],
  currentLocation: string,
  note: string
): ParcelItem[] => {
  const packageTypes: ParcelItem['packageType'][] = ['Box', 'Satchel', 'Document', 'Fragile'];
  const weights = [2.4, 0.8, 4.6, 1.7, 3.2];
  const dimensions = ['32 x 24 x 18 cm', '28 x 20 x 6 cm', '38 x 30 x 22 cm', '24 x 18 x 12 cm', '42 x 32 x 26 cm'];
  return parcelIds.map((id, index) => {
    const packageType = packageTypes[(Number(shipmentId.slice(-2)) + index) % packageTypes.length];
    const handling: ParcelItem['handling'] = priority === 'High-Value'
      ? 'High-Value'
      : packageType === 'Fragile'
        ? 'Fragile'
        : 'Normal';
    const status: ParcelItem['status'] = currentLocation.includes('Outbound')
      ? 'Ready Outbound'
      : currentLocation.includes('Sorting')
        ? 'Sorting'
        : currentLocation.includes('Exception')
          ? 'Hold'
          : note.toLowerCase().includes('received')
            ? 'Received'
            : 'Expected';
    return {
      id,
      packageType,
      weightKg: weights[(index + Number(shipmentId.slice(-1))) % weights.length],
      dimensions: dimensions[(index + Number(shipmentId.slice(-1))) % dimensions.length],
      handling,
      status,
      currentHub: currentLocation.includes('Johor Bahru') ? JB : undefined,
      lastScan: currentLocation.includes('Johor Bahru') ? `${currentLocation} • ${index === 0 ? '10:42' : '10:44'}` : currentLocation,
    };
  });
};

const parcelIdsFor = (shipmentId: string, count: number) =>
  Array.from({ length: count }, (_, index) => `P-${shipmentId}-${String(index + 1).padStart(2, '0')}`);

const mkShipment = (
  id: string,
  origin: string,
  destination: string,
  originHub: string,
  destinationHub: string,
  currentLocation: string,
  status: Shipment['status'],
  service: string,
  vehicleType: Shipment['vehicleType'],
  eta: string,
  parcelIds: string[],
  priority: Shipment['priority'] = 'Standard',
  note = 'Awaiting local processing.'
): Shipment => {
  const parcels = buildParcels(id, parcelIds, priority, currentLocation, note);
  const totalWeight = Number(parcels.reduce((sum, parcel) => sum + parcel.weightKg, 0).toFixed(1));
  return {
    id,
    originHub,
    destinationHub,
    origin,
    destination,
    currentLocation,
    status,
    transportMode: vehicleType === 'Train' ? 'Rail Primary' : vehicleType === 'Intermodal' ? 'Intermodal' : 'Road Direct',
    riskLevel: 'Low',
    riskScore: 18,
    assignedVehicleOrTrain: service,
    vehicleType,
    eta,
    originalEta: eta,
    targetArrival: 'Today',
    priority,
    weightKg: totalWeight,
    dimensions: `${parcelIds.length} parcel shipment`,
    category: 'Mixed Parcel Consignment',
    timeline: [
      { stage: status, location: currentLocation, timestamp: eta, completed: false, current: true, notes: note },
    ],
    routeCoordinates: [],
    currentProgressPct: status === 'Origin Hub' ? 22 : status === 'Destination Hub' ? 82 : 55,
    delayMinutes: 0,
    parcelCount: parcelIds.length,
    receivedParcelCount: currentLocation.includes('Johor Bahru') ? parcelIds.length : 0,
    parcelIds,
    parcels,
  };
};

export const HUB_DEMO_SHIPMENTS: Shipment[] = [
  mkShipment('MY410101','Muar','Kuala Lumpur',JB,PJ,'Johor Bahru Southern Region Hub — Receiving Bay A1','Origin Hub','Train T108','Train','10:42',parcelIdsFor('MY410101', 8),'Express','Received; sorting pending.'),
  mkShipment('MY410102','Muar','Kuala Lumpur',JB,PJ,'Johor Bahru Southern Region Hub — Receiving Bay A1','Origin Hub','Train T108','Train','10:42',parcelIdsFor('MY410102', 6),'Standard','Received; sorting pending.'),
  mkShipment('MY410103','Batu Pahat','Kuala Lumpur',JB,PJ,'Johor Bahru Southern Region Hub — Sorting Zone S2','Origin Hub','Train T108','Train','11:05',parcelIdsFor('MY410103', 5),'High-Value','Sorting completed; ready for outbound loading.'),
  mkShipment('MY410104','Kluang','Penang',JB,BWH,'Johor Bahru Southern Region Hub — Sorting Zone S3','Origin Hub','Train T112','Train','12:30',parcelIdsFor('MY410104', 8),'Express','Sorting completed; next transfer ready.'),
  mkShipment('MY410105','Segamat','Melaka',JB,MKZ,'Johor Bahru Southern Region Hub — Sorting Zone S1','Origin Hub','Truck TR-720','Truck','11:45',parcelIdsFor('MY410105', 6),'Standard','Sorting completed; awaiting outbound bay.'),
  mkShipment('MY410106','Kota Tinggi','Kuala Lumpur',JB,PJ,'Johor Bahru Southern Region Hub — Receiving Bay B2','Origin Hub','Train T112','Train','11:18',parcelIdsFor('MY410106', 7),'Standard','Received; sorting pending.'),
  mkShipment('MY410107','Johor Bahru','Kuala Lumpur',JB,PJ,'Johor Bahru Southern Region Hub — Outbound Bay C1','Origin Hub','Train T108','Train','11:05',parcelIdsFor('MY410107', 8),'High-Value','Loaded; awaiting outbound custody scan.'),
  mkShipment('MY410108','Johor Bahru','Melaka',JB,MKZ,'Johor Bahru Southern Region Hub — Outbound Bay C2','Origin Hub','Truck TR-720','Truck','11:45',parcelIdsFor('MY410108', 5),'Standard','Loaded; awaiting outbound custody scan.'),
  mkShipment('MY410109','Melaka','Johor Bahru',MKZ,JB,'Inbound Truck TR-228 — 18 km from Johor Hub','In Transit','Truck TR-228','Truck','11:20',parcelIdsFor('MY410109', 6),'Standard','Inbound to Johor Bahru hub.'),
  mkShipment('MY410110','Petaling Jaya','Johor Bahru',PJ,JB,'Train T097 — Southern Corridor','In Transit','Train T097','Train','12:05',parcelIdsFor('MY410110', 8),'Express','Inbound to Johor Bahru hub.'),
  mkShipment('MY410111','Melaka','Johor Bahru',MKZ,JB,'Johor Bahru Southern Region Hub — Receiving Bay B1','Destination Hub','Truck TR-228','Truck','10:58',parcelIdsFor('MY410111', 7),'Standard','Received; handoff review pending.'),
  mkShipment('MY410112','Petaling Jaya','Johor Bahru',PJ,JB,'Johor Bahru Southern Region Hub — Receiving Bay B1','Destination Hub','Train T097','Train','11:58',parcelIdsFor('MY410112', 6),'High-Value','Received; identity check pending.'),
  mkShipment('MY410113','Pasir Gudang','Kuala Lumpur',JB,PJ,'Johor Bahru Southern Region Hub — Sorting Zone S4','Origin Hub','Train T112','Train','12:30',parcelIdsFor('MY410113', 8),'Standard','Received; sorting pending.'),
  mkShipment('MY410114','Skudai','Penang',JB,BWH,'Johor Bahru Southern Region Hub — Sorting Zone S3','Origin Hub','Train T112','Train','12:30',parcelIdsFor('MY410114', 5),'Express','Sorting completed; ready for outbound loading.'),
  mkShipment('MY410115','Melaka','Kuala Lumpur',MKZ,PJ,'Johor Bahru Southern Region Hub — Exception Hold','Security Review','Truck TR-991','Truck','11:30',parcelIdsFor('MY410115', 7),'Standard','Unexpected parcel scanned at Johor hub; held for route check.'),
];

export const HUB_DEMO_MANIFESTS: HubManifest[] = [
  // Incoming loads still travelling to Johor Hub
  {
    id:'MAN-FD515-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Truck', serviceId:'FD-515',
    expectedShipmentIds:['MY410106'], expectedParcelIds:parcelIdsFor('MY410106',7), receivedParcelIds:[],
    status:'Pending', hubStatus:'In Transit', lastUpdated:'11:05', direction:'Incoming', originName:'Kota Tinggi Service Point', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'11:15', dock:'Receiving Bay B2'
  },
  {
    id:'MAN-TR229-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Truck', serviceId:'TR-229',
    expectedShipmentIds:['MY410109'], expectedParcelIds:parcelIdsFor('MY410109',6), receivedParcelIds:[],
    status:'Pending', hubStatus:'In Transit', lastUpdated:'11:02', direction:'Incoming', originName:'Melaka Branch Transfer Node', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'11:20', dock:'Receiving Bay B1'
  },
  {
    id:'MAN-T099-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Train', serviceId:'T099',
    expectedShipmentIds:['MY410110'], expectedParcelIds:parcelIdsFor('MY410110',8), receivedParcelIds:[],
    status:'Pending', hubStatus:'In Transit', lastUpdated:'11:40', direction:'Incoming', originName:'Petaling Jaya Auto Hub', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'12:05', dock:'Rail Receiving R1'
  },

  // Loads already at Johor Hub and still being received / reconciled
  {
    id:'MAN-FD610-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Truck', serviceId:'FD-610',
    expectedShipmentIds:['MY410101','MY410102'],
    expectedParcelIds:[...parcelIdsFor('MY410101',8), ...parcelIdsFor('MY410102',6)],
    receivedParcelIds:[...parcelIdsFor('MY410101',8), ...parcelIdsFor('MY410102',5), 'P-MY410115-01'],
    status:'Mismatch', hubStatus:'Receiving', lastUpdated:'10:42', direction:'Incoming', originName:'Muar Service Point', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'10:40', dock:'Receiving Bay A1'
  },
  {
    id:'MAN-FD611-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Truck', serviceId:'FD-611',
    expectedShipmentIds:['MY410104'], expectedParcelIds:parcelIdsFor('MY410104',8), receivedParcelIds:parcelIdsFor('MY410104',6),
    status:'Mismatch', hubStatus:'Receiving', lastUpdated:'10:55', direction:'Incoming', originName:'Kluang Branch', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'10:50', dock:'Receiving Bay A4'
  },
  {
    id:'MAN-TR228-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Truck', serviceId:'TR-228',
    expectedShipmentIds:['MY410111'], expectedParcelIds:parcelIdsFor('MY410111',7), receivedParcelIds:parcelIdsFor('MY410111',7),
    status:'Matched', hubStatus:'Receiving', lastUpdated:'10:58', direction:'Incoming', originName:'Melaka Branch Transfer Node', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'10:55', dock:'Receiving Bay B1'
  },
  {
    id:'MAN-T097-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Train', serviceId:'T097',
    expectedShipmentIds:['MY410112'], expectedParcelIds:parcelIdsFor('MY410112',6), receivedParcelIds:parcelIdsFor('MY410112',6),
    status:'Matched', hubStatus:'Receiving', lastUpdated:'11:58', direction:'Incoming', originName:'Petaling Jaya Auto Hub', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'11:55', dock:'Rail Receiving R1'
  },
  {
    id:'MAN-FD402X-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Truck', serviceId:'FD-402X',
    expectedShipmentIds:['MY410103'], expectedParcelIds:parcelIdsFor('MY410103',5), receivedParcelIds:parcelIdsFor('MY410103',5),
    status:'Matched', hubStatus:'Received', lastUpdated:'10:12', direction:'Incoming', originName:'Batu Pahat Branch', destinationName:'Johor Bahru Southern Region Hub', scheduledTime:'10:10', dock:'Receiving Bay A3'
  },

  // Outgoing loads from Johor Hub
  {
    id:'MAN-T108-OUT-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Train', serviceId:'T108',
    expectedShipmentIds:['MY410101','MY410102','MY410103','MY410107'],
    expectedParcelIds:[...parcelIdsFor('MY410101',8), ...parcelIdsFor('MY410102',6), ...parcelIdsFor('MY410103',5), ...parcelIdsFor('MY410107',8)],
    receivedParcelIds:[...parcelIdsFor('MY410101',8), ...parcelIdsFor('MY410102',6), ...parcelIdsFor('MY410103',5), ...parcelIdsFor('MY410107',8)],
    status:'Pending', hubStatus:'Ready for Dispatch', lastUpdated:'10:50', direction:'Outgoing', originName:'Johor Bahru Southern Region Hub', destinationName:'Petaling Jaya Auto Hub', scheduledTime:'11:05', dock:'Outbound Bay C1'
  },
  {
    id:'MAN-TR720-OUT-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Truck', serviceId:'TR-720',
    expectedShipmentIds:['MY410105','MY410108'],
    expectedParcelIds:[...parcelIdsFor('MY410105',6), ...parcelIdsFor('MY410108',5)],
    receivedParcelIds:[...parcelIdsFor('MY410105',6), ...parcelIdsFor('MY410108',5)],
    status:'Matched', hubStatus:'Departed', lastUpdated:'11:10', direction:'Outgoing', originName:'Johor Bahru Southern Region Hub', destinationName:'Melaka Branch Transfer Node', scheduledTime:'11:45', dock:'Outbound Bay C2'
  },
  {
    id:'MAN-T112-OUT-JB', hubId:'hub-jb', hubName:'Johor Bahru Southern Region Hub', transportType:'Train', serviceId:'T112',
    expectedShipmentIds:['MY410104','MY410106','MY410113','MY410114'],
    expectedParcelIds:[...parcelIdsFor('MY410104',8), ...parcelIdsFor('MY410106',7), ...parcelIdsFor('MY410113',8), ...parcelIdsFor('MY410114',5)],
    receivedParcelIds:[...parcelIdsFor('MY410104',6), ...parcelIdsFor('MY410113',4), ...parcelIdsFor('MY410114',5)],
    status:'Pending', hubStatus:'Preparing Dispatch', lastUpdated:'11:12', direction:'Outgoing', originName:'Johor Bahru Southern Region Hub', destinationName:'Petaling Jaya / Northern connection', scheduledTime:'12:30', dock:'Outbound Rail R2'
  },
];

export const HUB_DEMO_HANDOFFS: HubHandoffVerification[] = [
  // Shared hub custody records moved out of mockData.ts
{
    id: 'HO-8891',
    shipmentId: 'MY102938',
    parcelId: 'P-MY102938-01',
    hubId: 'hub-jb',
    transportType: 'Truck',
    fromParty: 'Inbound Feeder D-402 (Ibrahim Rahman)',
    toParty: 'Johor Bahru Southern Hub Supervisor (Zulkifli M.)',
    location: 'Johor Bahru Southern Region Hub Bay 3',
    timestamp: '09:45:12 Today',
    deviceId: 'HANDHELD-JB-SCAN-04',
    checks: {
      identity: true,
      parcelId: true,
      location: true,
      timestamp: true,
      sequence: true,
    },
    trustScore: 96,
    status: 'VERIFIED',
    notes: 'Custody evidence chain validated at the origin hub gate.',
  },
  {
    id: 'HO-1029',
    shipmentId: 'MY102938',
    parcelId: 'P-MY102938-01',
    hubId: 'hub-kl',
    transportType: 'Train',
    fromParty: 'Intermodal Driver D-118 (Faiz Rahman)',
    toParty: 'Petaling Jaya Auto Hub Receiving Gate',
    location: 'Petaling Jaya Auto Hub Gate 2',
    timestamp: 'Pending Driver Submission',
    deviceId: 'DRIVER-TERM-D118',
    checks: {
      identity: true,
      parcelId: true,
      location: false,
      timestamp: false,
      sequence: true,
    },
    trustScore: 72,
    status: 'REQUIRES REVIEW',
    notes: 'Awaiting driver gate evidence submission and Hub Operator review at the destination hub.',
  },
  {
    id: 'HO-8894',
    shipmentId: 'MY441829',
    parcelId: 'P-MY441829-01',
    hubId: 'hub-kl',
    transportType: 'Truck',
    fromParty: 'Petaling Jaya Auto Hub Security Vault Bay',
    toParty: 'Inter-Hub Linehaul Driver D-118 (Ahmad Faiz)',
    location: 'Petaling Jaya Auto Hub — Security Gate 1',
    timestamp: '09:15:30 Today',
    deviceId: 'TERMINAL-KUL-SEC-01',
    checks: {
      identity: true,
      parcelId: true,
      location: true,
      timestamp: true,
      sequence: true,
    },
    trustScore: 98,
    status: 'VERIFIED',
    notes: 'High-value security custody seals inspected and verified intact before corridor departure.',
  },
  {
    id: 'HO-8820',
    shipmentId: 'MY205721',
    parcelId: 'P-MY205721-01',
    hubId: 'hub-melaka',
    transportType: 'Truck',
    fromParty: 'Cross-Dock Transit Driver',
    toParty: 'Melaka Branch Transfer Staging Area',
    location: 'Outside Staging Area (2.4 km away)',
    timestamp: '08:22:04 Today',
    deviceId: 'UNREGISTERED-APP-ID-44',
    checks: {
      identity: true,
      parcelId: true,
      location: false,
      timestamp: true,
      sequence: false,
    },
    trustScore: 58,
    status: 'REQUIRES REVIEW',
    notes: 'Location mismatch: Scan coordinates outside authorized perimeter. Prior stage handoff token missing sequence tag.',
  },
  // Johor Hub operating demo records
{id:'HO-JB-4101',shipmentId:'MY410101',parcelId:'P-MY410101-01',hubId:'hub-jb',transportType:'Truck',fromParty:'Feeder Driver D-610',toParty:'Receiving Bay A1',location:'Johor Bahru Southern Region Hub — Bay A1',timestamp:'10:41',deviceId:'JB-SCAN-11',checks:{identity:true,parcelId:true,location:true,timestamp:true,sequence:true},trustScore:97,status:'VERIFIED'},
  {id:'HO-JB-4102',shipmentId:'MY410102',parcelId:'P-MY410102-01',hubId:'hub-jb',transportType:'Truck',fromParty:'Feeder Driver D-610',toParty:'Receiving Bay A1',location:'Johor Bahru Southern Region Hub — Bay A1',timestamp:'10:43',deviceId:'JB-SCAN-11',checks:{identity:true,parcelId:false,location:true,timestamp:true,sequence:true},trustScore:80,status:'REQUIRES REVIEW',notes:'Barcode not confirmed at receiving scanner.'},
  {id:'HO-JB-4103',shipmentId:'MY410103',parcelId:'P-MY410103-01',hubId:'hub-jb',transportType:'Truck',fromParty:'Batu Pahat Feeder D-402',toParty:'Receiving Bay A3',location:'Johor Bahru Southern Region Hub — Bay A3',timestamp:'10:12',deviceId:'JB-SCAN-07',checks:{identity:true,parcelId:true,location:true,timestamp:true,sequence:true},trustScore:98,status:'VERIFIED'},
  {id:'HO-JB-4104',shipmentId:'MY410104',parcelId:'P-MY410104-01',hubId:'hub-jb',transportType:'Truck',fromParty:'Kluang Feeder D-611',toParty:'Receiving Bay A4',location:'Johor Bahru Southern Region Hub — Bay A4',timestamp:'10:54',deviceId:'JB-SCAN-09',checks:{identity:true,parcelId:true,location:true,timestamp:true,sequence:true},trustScore:96,status:'VERIFIED'},
  {id:'HO-JB-4105',shipmentId:'MY410111',parcelId:'P-MY410111-01',hubId:'hub-jb',transportType:'Truck',fromParty:'Linehaul Driver D-228',toParty:'Receiving Bay B1',location:'Johor Bahru Southern Region Hub — Bay B1',timestamp:'10:58',deviceId:'JB-SCAN-15',checks:{identity:true,parcelId:true,location:true,timestamp:true,sequence:false},trustScore:84,status:'REQUIRES REVIEW',notes:'Previous handoff reference not yet matched.'},
  {id:'HO-JB-4106',shipmentId:'MY410112',parcelId:'P-MY410112-01',hubId:'hub-jb',transportType:'Train',fromParty:'Rail Transfer Crew T097',toParty:'Rail Receiving R1',location:'Johor Bahru Southern Region Hub — Rail R1',timestamp:'11:58',deviceId:'JB-RAIL-03',checks:{identity:false,parcelId:true,location:true,timestamp:true,sequence:true},trustScore:76,status:'FLAGGED',notes:'Crew identity credential requires supervisor check.'},
  {id:'HO-JB-4107',shipmentId:'MY410107',parcelId:'P-MY410107-01',hubId:'hub-jb',transportType:'Train',fromParty:'Outbound Bay C1',toParty:'Train T108 Load Crew',location:'Johor Bahru Southern Region Hub — Bay C1',timestamp:'11:00',deviceId:'JB-OUT-04',checks:{identity:true,parcelId:true,location:true,timestamp:true,sequence:true},trustScore:99,status:'VERIFIED'},
  {id:'HO-JB-4108',shipmentId:'MY410108',parcelId:'P-MY410108-01',hubId:'hub-jb',transportType:'Truck',fromParty:'Outbound Bay C2',toParty:'Truck TR-720 Driver',location:'Johor Bahru Southern Region Hub — Bay C2',timestamp:'11:28',deviceId:'JB-OUT-05',checks:{identity:true,parcelId:true,location:true,timestamp:true,sequence:true},trustScore:98,status:'VERIFIED'},
  {id:'HO-JB-4109',shipmentId:'MY410114',parcelId:'P-MY410114-01',hubId:'hub-jb',transportType:'Train',fromParty:'Sorting Zone S3',toParty:'Outbound Rail R2',location:'Johor Bahru Southern Region Hub — Rail R2',timestamp:'11:16',deviceId:'JB-OUT-07',checks:{identity:true,parcelId:true,location:true,timestamp:false,sequence:true},trustScore:86,status:'REQUIRES REVIEW',notes:'Loading timestamp confirmation pending.'},
];

export const HUB_DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-JB-100',
    timestamp: '09:45:12',
    actor: 'Driver Handheld D-402',
    role: 'Driver',
    event: 'Inbound custody handed over at JHB-SRH',
    evidence: 'P-MY102938-01 scanned at Johor Bahru Southern Region Hub gate; driver and hub scan matched.',
    aiDecision: '—',
    humanDecision: 'Hub Operator confirmed handoff',
    result: 'Custody transferred to Johor Bahru Southern Region Hub.',
    hash: 'AUDREF-JB100',
    shipmentId: 'MY102938',
  },
  {
    id: 'AUD-JB-101',
    timestamp: '10:12',
    actor: 'Hub Scanner JB-SCAN-07',
    role: 'Hub Operator',
    event: 'Receiving completed for FD-402X',
    evidence: 'All expected parcels for MY410103 were scanned against the incoming manifest.',
    aiDecision: '—',
    humanDecision: 'Receiving confirmed',
    result: 'Manifest matched; shipment released to sorting.',
    hash: 'AUDREF-JB101',
    shipmentId: 'MY410103',
  },
  {
    id: 'AUD-JB-102',
    timestamp: '10:41',
    actor: 'Hub Scanner JB-SCAN-11',
    role: 'Hub Operator',
    event: 'Parcel received',
    evidence: 'P-MY410101-01 matched the FD-610 incoming manifest at Receiving Bay A1.',
    aiDecision: '—',
    humanDecision: 'Scan accepted',
    result: 'FD-610 receiving progress updated.',
    hash: 'AUDREF-JB102',
    shipmentId: 'MY410101',
  },
  {
    id: 'AUD-JB-103',
    timestamp: '10:43',
    actor: 'Hub Scanner JB-SCAN-11',
    role: 'Hub Operator',
    event: 'Parcel re-scan requested',
    evidence: 'P-MY410102-01 barcode was not confirmed during the first receiving scan.',
    aiDecision: '—',
    humanDecision: 'Re-scan requested',
    result: 'Handoff review remains open; parcel not accepted yet.',
    hash: 'AUDREF-JB103',
    shipmentId: 'MY410102',
  },
  {
    id: 'AUD-JB-104',
    timestamp: '10:54',
    actor: 'Receiving Bay A4',
    role: 'Hub Operator',
    event: 'Receiving progress updated',
    evidence: 'FD-611 has 6 of 8 expected parcels scanned at Receiving Bay A4.',
    aiDecision: '—',
    humanDecision: 'Continue receiving',
    result: 'Receiving remains open; no parcel is declared missing until reconciliation is completed.',
    hash: 'AUDREF-JB104',
    shipmentId: 'MY410104',
  },
  {
    id: 'AUD-JB-105',
    timestamp: '10:58',
    actor: 'Receiving Bay B1',
    role: 'Hub Operator',
    event: 'Incoming load arrived',
    evidence: 'TR-228 arrived at Johor Bahru Southern Region Hub and receiving was opened.',
    aiDecision: '—',
    humanDecision: 'Receiving started',
    result: 'Load moved from Incoming to Awaiting Receiving / Receiving.',
    hash: 'AUDREF-JB105',
    shipmentId: 'MY410111',
  },
  {
    id: 'AUD-JB-106',
    timestamp: '11:00',
    actor: 'Outbound Bay C1',
    role: 'Hub Operator',
    event: 'Outbound custody accepted',
    evidence: 'P-MY410107-01 custody was transferred from Outbound Bay C1 to the T108 load crew.',
    aiDecision: '—',
    humanDecision: 'Custody accepted',
    result: 'Parcel marked loaded for outbound dispatch.',
    hash: 'AUDREF-JB106',
    shipmentId: 'MY410107',
  },
  {
    id: 'AUD-JB-107',
    timestamp: '11:10',
    actor: 'Outbound Bay C2',
    role: 'Hub Operator',
    event: 'Outgoing load departed',
    evidence: 'TR-720 outbound manifest matched before departure from Johor Bahru Southern Region Hub.',
    aiDecision: '—',
    humanDecision: 'Departure confirmed',
    result: 'TR-720 marked Departed and shipments completed at this hub.',
    hash: 'AUDREF-JB107',
    shipmentId: 'MY410108',
  },
  {
    id: 'AUD-JB-108',
    timestamp: '11:16',
    actor: 'Outbound Rail R2',
    role: 'Hub Operator',
    event: 'Outgoing handoff requires review',
    evidence: 'P-MY410114-01 loading timestamp was not confirmed during the outbound custody check.',
    aiDecision: '—',
    humanDecision: 'Review requested',
    result: 'Outgoing handoff held; departure cannot be confirmed until the check is resolved.',
    hash: 'AUDREF-JB108',
    shipmentId: 'MY410114',
  },
  {
    id: 'AUD-JB-109',
    timestamp: '11:22',
    actor: 'Receiving Bay A1',
    role: 'Hub Operator',
    event: 'Unexpected parcel held for route check',
    evidence: 'P-MY410115-01 was scanned at JHB-SRH but is not expected on the active FD-610 manifest.',
    aiDecision: '—',
    humanDecision: 'Parcel placed on hold',
    result: 'Unexpected parcel exception opened for wrong-hub / routing verification.',
    hash: 'AUDREF-JB109',
    shipmentId: 'MY410115',
  },
];
