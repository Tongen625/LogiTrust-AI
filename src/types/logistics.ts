export type UserRole =
  | 'Logistics Operations Manager'
  | 'Security / Risk Officer'
  | 'Hub Operator'
  | 'Transport Coordinator'
  | 'Driver'
  | 'Administrator';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  callsign: string;
  clearanceLevel: string;
  hubLocation: string;
  avatarInitials: string;
  description: string;
  permittedFunctions: string[];
}

export type ShipmentStatus =
  | 'Origin Hub'
  | 'Route & Schedule Planning'
  | 'In Transit'
  | 'Destination Hub'
  | 'Last-Mile Dispatch'
  | 'Delayed'
  | 'Security Review';

export type TransportMode = 'Road + Rail' | 'Rail Primary' | 'Road Direct' | 'Intermodal';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AIAgentName =
  | 'Scheduling Agent'
  | 'Disruption Agent'
  | 'Route Risk Agent'
  | 'Trust / Handoff Agent'
  | 'Decision Agent';

export type AIAgentStatus = 'Monitoring' | 'Analysing' | 'Completed' | 'Waiting for Approval' | 'Action Required';

export interface AIAgent {
  id: string;
  name: AIAgentName;
  status: AIAgentStatus;
  lastActive: string;
  currentTask: string;
  confidence: number;
  anomalyDetected: boolean;
}

export interface HubLocation {
  id: string;
  name: string;
  code: string;
  type: 'Origin Hub' | 'Intermodal Rail Yard' | 'Central Hub' | 'Inland Port' | 'Northern Terminal';
  state: string;
  lat: number;
  lng: number;
  activeShipments: number;
  capacityUtilization: number;
  status: 'Normal' | 'Congested' | 'Warning';
}

export interface ShipmentTimelineEvent {
  stage: ShipmentStatus;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
  notes?: string;
  verifiedBy?: string;
}

export interface Shipment {
  id: string; // e.g. MY102938
  originHub: string;
  destinationHub: string;
  origin: string;
  destination: string;
  currentLocation: string;
  status: ShipmentStatus;
  transportMode: TransportMode;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  assignedVehicleOrTrain: string;
  vehicleType: 'Train' | 'Truck' | 'Intermodal';
  eta: string;
  originalEta: string;
  targetArrival: string;
  priority: 'Standard' | 'Express' | 'High-Value' | 'Cold-Chain';
  weightKg: number;
  dimensions: string;
  category: string;
  timeline: ShipmentTimelineEvent[];
  routeCoordinates: { name: string; lat: number; lng: number }[];
  currentProgressPct: number;
  hasSecurityAlert?: boolean;
  hasPendingApproval?: boolean;
  delayMinutes: number;
}

export interface AIRecommendation {
  id: string;
  shipmentId: string;
  detectedEvent: string;
  impact: string;
  recommendation: string;
  reason: string;
  expectedResult: string;
  expectedImprovementMins: number;
  capacityStatus: 'Available' | 'Constrained' | 'Full';
  connectionTime: 'Feasible (45 min buffer)' | 'Tight (15 min)' | 'Infeasible';
  securityRisk: 'Low' | 'Medium' | 'High';
  confidence: number;
  evidence: string[];
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  timestamp: string;
  targetService?: string;
  alternativesConsidered: {
    name: string;
    eta: string;
    cost: 'Baseline' | '+4%' | '+12%' | '+28%' | '+65%';
    risk: 'Low' | 'Medium' | 'High';
    capacity: 'Available' | 'Full' | 'Limited' | 'Standby';
    deadlineFeasible: boolean;
    score: number;
  }[];
}

export type SecurityAnomalyType =
  | 'Route Deviation'
  | 'Unexpected Stop'
  | 'GPS Anomaly'
  | 'Impossible Travel'
  | 'Duplicate Scan'
  | 'Invalid Handoff'
  | 'Identity Mismatch'
  | 'Tamper Seal Breach'
  | 'Timestamp Inconsistency';

export type SecurityAlertStatus = 'Open' | 'Investigating' | 'Verification Requested' | 'Resolved' | 'Escalated';

export interface SecurityEvidenceItem {
  time: string;
  event: string;
  sensor: string;
  status: 'Verified' | 'Anomaly' | 'Warning' | 'Pending';
  details: string;
}

export interface SecurityAlert {
  id: string; // e.g. TR102
  shipmentId: string;
  anomalyType: SecurityAnomalyType;
  riskLevel: RiskLevel;
  title: string;
  detectedAt: string;
  expectedRoute: string;
  actualMovement: string;
  deviationKm?: number;
  aiAssessment: string;
  recommendedAction: string;
  evidence: SecurityEvidenceItem[];
  status: SecurityAlertStatus;
  verificationNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface TrainSchedule {
  id: string; // e.g. T105
  route: string;
  originHub: string;
  destHub: string;
  departure: string;
  arrival: string;
  status: 'On Time' | 'Delayed' | 'Departed' | 'Cancelled';
  delayMinutes: number;
  capacityAvailable: boolean;
  currentUtilisationPct: number;
  cargoCapacityTons: number;
  isManualOverride?: boolean;
  dataSource?: 'External Schedule Feed' | 'Manual Operator Override';
  notes?: string;
}

export interface HubHandoffVerification {
  id: string;
  parcelId: string;
  fromParty: string;
  toParty: string;
  location: string;
  timestamp: string;
  deviceId: string;
  checks: {
    identity: boolean;
    parcelId: boolean;
    location: boolean;
    timestamp: boolean;
    sequence: boolean;
  };
  trustScore: number;
  status: 'VERIFIED' | 'REQUIRES REVIEW' | 'FLAGGED';
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  event: string;
  evidence: string;
  aiDecision: string;
  humanDecision: string;
  result: string;
  hash: string;
  shipmentId?: string;
}

export interface WhatIfSimulationResult {
  scenarioName: string;
  baseline: {
    service: string;
    eta: string;
    delayMins: number;
    deadlineStatus: 'Missed' | 'On Time';
    costIndex: number;
    risk: RiskLevel;
  };
  alternativeA: {
    name: string;
    service: string;
    eta: string;
    improvedMins: number;
    deadlineStatus: 'Feasible' | 'Tight';
    capacity: string;
    risk: RiskLevel;
    costIndex: number;
    aiScore: number;
  };
  alternativeB: {
    name: string;
    service: string;
    eta: string;
    improvedMins: number;
    deadlineStatus: 'Feasible' | 'Tight' | 'Missed';
    capacity: string;
    risk: RiskLevel;
    costIndex: number;
    aiScore: number;
  };
  aiRecommendedOption: 'Alternative A' | 'Alternative B' | 'Baseline';
  reasoning: string;
}
