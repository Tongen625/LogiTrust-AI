import React, { createContext, useContext, useState } from 'react';
import {
  AIAgent,
  AuditLogEntry,
  HubHandoffVerification,
  HubLocation,
  HubManifest,
  LogisticsIncident,
  IncidentType,
  SecurityAlert,
  Shipment,
  TrainSchedule,
  UserProfile,
  UserRole,
  WhatIfSimulationResult,
} from '../types/logistics';
import {
  INITIAL_AI_AGENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SECURITY_ALERTS,
  INITIAL_SHIPMENTS,
  INITIAL_TRAIN_SCHEDULES,
  MALAYSIA_HUBS,
  USER_PROFILES,
  WHAT_IF_SCENARIOS,
} from '../data/mockData';
import { HUB_DEMO_AUDIT_LOGS, HUB_DEMO_HANDOFFS, HUB_DEMO_MANIFESTS, HUB_DEMO_SHIPMENTS } from '../data/hubDemoData';

export type NavigationTab =
  | 'dashboard'
  | 'control-tower'
  | 'shipments'
  | 'tracking'
  | 'schedules'
  | 'security'
  | 'approvals'
  | 'hub-ops'
  | 'audit'
  | 'users'
  | 'driver-view'
  | 'manager-app'
  | 'coordinator-app'
  | 'security-app'
  | 'hub-app';

export const ROLE_PERMITTED_TABS: Record<UserRole, NavigationTab[]> = {
  'Logistics Operations Manager': ['control-tower','dashboard','shipments','tracking','approvals','schedules','audit','manager-app'],
  'Security / Risk Officer': ['dashboard','shipments','tracking','security','audit','security-app'],
  'Hub Operator': ['dashboard','shipments','tracking','hub-ops','audit','hub-app'],
  'Transport Coordinator': ['dashboard','shipments','tracking','schedules','audit','coordinator-app'],
  'Driver': ['driver-view'],
  'Administrator': ['dashboard','users','audit','manager-app'],
};


export const ROLE_LOCKED_TABS: Record<UserRole, NavigationTab[]> = {
  'Logistics Operations Manager': ['dashboard','manager-app'],
  'Security / Risk Officer': ['dashboard','security-app'],
  'Hub Operator': ['dashboard','hub-app'],
  'Transport Coordinator': ['dashboard','coordinator-app'],
  'Driver': ['driver-view'],
  'Administrator': ['dashboard','users','audit','manager-app'],
};

export const ROLE_ASSIGNABLE_TABS: Record<UserRole, NavigationTab[]> = {
  'Logistics Operations Manager': ['control-tower','dashboard','shipments','tracking','approvals','schedules','audit','manager-app'],
  'Security / Risk Officer': ['dashboard','shipments','tracking','security','audit','security-app'],
  'Hub Operator': ['dashboard','shipments','tracking','hub-ops','audit','hub-app'],
  'Transport Coordinator': ['dashboard','shipments','tracking','schedules','audit','coordinator-app'],
  'Driver': ['driver-view'],
  'Administrator': ['dashboard','users','audit','manager-app'],
};

const MOBILE_APP_TABS: NavigationTab[] = ['driver-view', 'coordinator-app', 'security-app', 'hub-app', 'manager-app'];

export const ROLE_DEFAULT_TAB: Record<UserRole, NavigationTab> = {
  'Logistics Operations Manager': 'control-tower',
  'Security / Risk Officer': 'security',
  'Hub Operator': 'hub-ops',
  'Transport Coordinator': 'schedules',
  'Driver': 'driver-view',
  'Administrator': 'users',
};

interface LogisticsContextType {
  // Role-based workspace switching
  currentUser: UserProfile;
  userRole: UserRole;
  permittedTabs: NavigationTab[];
  switchRole: (role: UserRole) => void;
  isTabPermitted: (tab: NavigationTab) => boolean;
  rolePermissions: Record<UserRole, NavigationTab[]>;
  updateRolePermission: (role: UserRole, tab: NavigationTab, enabled: boolean) => void;
  resetRolePermissions: () => void;

  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  shipments: Shipment[];
  selectedShipmentId: string;
  setSelectedShipmentId: (id: string) => void;
  selectedShipment: Shipment | undefined;
  hubs: HubLocation[];
  agents: AIAgent[];
  trainSchedules: TrainSchedule[];
  securityAlerts: SecurityAlert[];
  recommendations: any[];
  handoffs: HubHandoffVerification[];
  auditLogs: AuditLogEntry[];
  incidents: LogisticsIncident[];
  hubManifests: HubManifest[];
  simulationResult: WhatIfSimulationResult;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notification: string | null;
  clearNotification: () => void;

  // Working Operations
  injectTrainDelay: (trainId?: string, minutes?: number) => void;
  injectRouteAnomaly: (shipmentId?: string) => void;
  approveRecommendation: (recId: string, notes?: string) => void;
  rejectRecommendation: (recId: string, reason?: string) => void;
  submitRecommendationForManagerApproval: (recId: string, notes?: string) => void;
  applyCoordinatorOperationalRecovery: (recId: string, notes?: string) => void;
  requestDriverVerification: (alertId: string, notes?: string) => void;
  resolveSecurityAlert: (alertId: string, notes?: string) => void;
  escalateSecurityAlert: (alertId: string, reason?: string) => void;
  verifyHandoffAction: (handoffId: string) => void;
  submitHandoffEvidence: (handoffId: string) => void;
  
  // Manual Train / Rail Provider Management
  updateTrainStatus: (
    trainId: string,
    status: 'On Time' | 'Delayed' | 'Departed' | 'Cancelled',
    delayMinutes?: number,
    notes?: string
  ) => void;
  addNewTrainSchedule: (newSchedule: Partial<TrainSchedule>) => void;
  deleteTrainSchedule: (trainId: string) => void;

  addShipment: (input: Partial<Shipment> & { id?: string }) => void;
  addIncident: (input: {
    type: IncidentType;
    occurredAt?: string;
    location: string;
    severity?: 'Low' | 'Medium' | 'High' | 'Critical';
    transportType?: 'Train' | 'Truck' | 'Intermodal';
    affectedServiceId?: string;
    affectedHubId?: string;
    shipmentId?: string;
    details: string;
  }) => void;
  resolveIncident: (incidentId: string, resolution?: string) => void;
  reportManifestReceipt: (manifestId: string, parcelId: string) => void;
  completeManifestReceiving: (manifestId: string) => void;
  markManifestReadyForDispatch: (manifestId: string) => void;
  markManifestDeparted: (manifestId: string) => void;

  resetAllData: () => void;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<UserRole>('Logistics Operations Manager');
  const [activeTab, setActiveTabState] = useState<NavigationTab>('control-tower');

  const currentUser = USER_PROFILES[userRole];
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, NavigationTab[]>>(() => ({
    'Logistics Operations Manager': [...ROLE_PERMITTED_TABS['Logistics Operations Manager']],
    'Security / Risk Officer': [...ROLE_PERMITTED_TABS['Security / Risk Officer']],
    'Hub Operator': [...ROLE_PERMITTED_TABS['Hub Operator']],
    'Transport Coordinator': [...ROLE_PERMITTED_TABS['Transport Coordinator']],
    'Driver': [...ROLE_PERMITTED_TABS['Driver']],
    'Administrator': [...ROLE_PERMITTED_TABS['Administrator']],
  }));
  const permittedTabs = rolePermissions[userRole] || [];

  const isTabPermitted = (tab: NavigationTab) => {
    return permittedTabs.includes(tab);
  };

  const [shipments, setShipments] = useState<Shipment[]>([...INITIAL_SHIPMENTS, ...HUB_DEMO_SHIPMENTS]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('MY102938');
  const [hubs] = useState<HubLocation[]>(MALAYSIA_HUBS);
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AI_AGENTS);
  const [trainSchedules, setTrainSchedules] = useState<TrainSchedule[]>(INITIAL_TRAIN_SCHEDULES);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(INITIAL_SECURITY_ALERTS);
  const [handoffs, setHandoffs] = useState<HubHandoffVerification[]>([...HUB_DEMO_HANDOFFS]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([...INITIAL_AUDIT_LOGS, ...HUB_DEMO_AUDIT_LOGS]);
  const INITIAL_MOCK_INCIDENTS: LogisticsIncident[] = [
    {
      id: 'INC-MOCK-001',
      type: 'Invalid Scan',
      category: 'Parcel',
      occurredAt: '10:44 Today',
      location: 'Johor Bahru Southern Region Hub',
      severity: 'Medium',
      status: 'Analysing',
      createdBy: 'Hub Operator',
      details: '[Manifest Mismatch] Receiving reconciliation for FD-610 found one expected parcel not yet reconciled against the manifest.',
      transportType: 'Truck',
      affectedServiceId: 'FD-610',
      affectedHubId: 'hub-jb',
      shipmentId: 'MY410102',
      affectedShipmentIds: ['MY410102'],
      recommendation: 'Trust / Handoff Agent should reconcile manifest and scan evidence. Hub Operator should re-scan or confirm the mismatch before escalation.',
      decisionFactors: {
        etaImpact: 'Local receiving review; no route change yet',
        capacity: 'No transport capacity action required',
        cost: 'Local hub handling only',
        security: 'Custody evidence verification required',
        sla: 'Monitor only if receiving review causes delay',
      },
      requiresApproval: false,
    },
    {
      id: 'INC-MOCK-002',
      type: 'Wrong Hub',
      category: 'Hub',
      occurredAt: '11:06 Today',
      location: 'Johor Bahru Southern Region Hub',
      severity: 'High',
      status: 'Analysing',
      createdBy: 'Hub Operator',
      details: 'P-MY410115-01 was scanned at Johor Bahru but is not planned for this hub. Parcel is held for recovery routing.',
      transportType: 'Truck',
      affectedServiceId: 'TR-991',
      affectedHubId: 'hub-jb',
      shipmentId: 'MY410115',
      affectedShipmentIds: ['MY410115'],
      recommendation: 'Transport Coordinator should review the planned destination and choose a feasible recovery service. Manager approval is only needed if the recovery becomes a major consequential change.',
      decisionFactors: {
        etaImpact: 'Recovery ETA must be recalculated',
        capacity: 'Check next service capacity to the planned hub',
        cost: 'Compare normal recovery vs major reroute cost',
        security: 'Keep parcel on hold until route and custody are verified',
        sla: 'Coordinator checks whether recovery still meets target arrival',
      },
      requiresApproval: false,
    },
    {
      id: 'INC-MOCK-003',
      type: 'Hub Congestion',
      category: 'Hub',
      occurredAt: '11:18 Today',
      location: 'Johor Bahru Southern Region Hub',
      severity: 'High',
      status: 'Analysing',
      createdBy: 'Hub Operator',
      details: 'Hub utilisation exceeded the operating threshold. Sorting and outbound queues may affect Train T112 departure readiness.',
      transportType: 'Train',
      affectedServiceId: 'T112',
      affectedHubId: 'hub-jb',
      affectedShipmentIds: ['MY410113', 'MY410114'],
      recommendation: 'Transport Coordinator should review departure slot, available capacity and re-slot options. Escalate to Manager only if a major reroute or material schedule change is selected.',
      decisionFactors: {
        etaImpact: 'MY410113 and MY410114 may miss planned outbound timing',
        capacity: 'Review T112 and alternate service capacity',
        cost: 'Prefer re-slotting before costly diversion',
        security: 'Maintain custody controls during any re-planning',
        sla: 'Check both shipments before changing the transport plan',
      },
      requiresApproval: false,
    },
    {
      id: 'INC-MOCK-004',
      type: 'Train Delay',
      category: 'Transport',
      occurredAt: '10:02 Today',
      location: 'Kluang mainline corridor',
      severity: 'High',
      status: 'Analysing',
      createdBy: 'Transport Coordinator',
      details: 'Train T105 delayed 90 minutes after manual provider status update.',
      transportType: 'Train',
      affectedServiceId: 'T105',
      affectedShipmentIds: ['MY102938', 'MY309812', 'MY287611'],
      recommendation: 'Disruption, Scheduling and Decision Agents compare T108, continue T105 and road hotshot. Coordinator reviews the recovery option before any approval request.',
      decisionFactors: {
        etaImpact: 'T105 ETA 16:00 vs T108 ETA 14:10',
        capacity: 'T108 has 46% unallocated capacity',
        cost: '+4% marginal vs +65% road hotshot',
        security: 'Low route risk; preserve custody chain',
        sla: 'T108 can preserve the priority shipment SLA',
      },
      requiresApproval: false,
    },

    {
      id: 'INC-MOCK-005',
      type: 'Traffic',
      category: 'Transport',
      occurredAt: '09:42 Today',
      location: 'Northbound corridor between Melaka and Johor Bahru',
      severity: 'Medium',
      status: 'Analysing',
      createdBy: 'Transport Coordinator',
      details: 'Truck TR-228 is delayed 25 minutes due to road congestion on the Melaka to Johor Bahru corridor.',
      transportType: 'Truck',
      affectedServiceId: 'TR-228',
      affectedShipmentIds: ['MY410109', 'MY410111'],
      recommendation: 'Disruption Agent should verify the delay impact while Scheduling Agent checks whether the current service can still meet downstream connections before any reroute is considered.',
      decisionFactors: {
        etaImpact: 'Estimated 25-minute delay to Johor Bahru arrival',
        capacity: 'TR-228 remains within usable capacity; no immediate vehicle replacement required',
        cost: 'Continue current service unless downstream SLA impact becomes material',
        security: 'No abnormal custody or route-risk signal detected',
        sla: 'Check whether MY410109 and MY410111 still meet their next connection windows',
      },
      requiresApproval: false,
    },
    {
      id: 'INC-MOCK-006',
      type: 'Traffic',
      category: 'Transport',
      occurredAt: '11:34 Today',
      location: 'Melaka to Petaling Jaya road corridor',
      severity: 'Medium',
      status: 'Analysing',
      createdBy: 'Transport Coordinator',
      details: 'Truck TR-991 is delayed 40 minutes by heavy traffic while carrying MY410115 toward Petaling Jaya.',
      transportType: 'Truck',
      affectedServiceId: 'TR-991',
      shipmentId: 'MY410115',
      affectedShipmentIds: ['MY410115'],
      recommendation: 'Disruption and Scheduling Agents should recalculate ETA and compare continuing TR-991 with the next feasible recovery service. Coordinator reviews the option before any major change is escalated.',
      decisionFactors: {
        etaImpact: 'Estimated 40-minute delay on the recovery movement',
        capacity: 'Review alternate road or rail capacity only if the current delay threatens the target arrival',
        cost: 'Prefer continuing the current service unless recovery benefit justifies a switch',
        security: 'Maintain custody hold and verified handoff records for MY410115',
        sla: 'Recalculate target arrival before selecting a recovery option',
      },
      requiresApproval: false,
    },
  ];

  const [incidents, setIncidents] = useState<LogisticsIncident[]>(INITIAL_MOCK_INCIDENTS);
  const [hubManifests, setHubManifests] = useState<HubManifest[]>([
    {
      id: 'MAN-T105-PJ',
      hubId: 'hub-kl',
      hubName: 'Petaling Jaya Auto Hub (HQ)',
      transportType: 'Train',
      serviceId: 'T105',
      expectedShipmentIds: ['MY102938', 'MY309812', 'MY287611'],
      expectedParcelIds: ['P-MY102938-01', 'P-MY309812-01', 'P-MY287611-01'],
      receivedParcelIds: ['P-MY102938-01', 'P-MY309812-01'],
      status: 'Mismatch',
      lastUpdated: '16:02 Today',
    },
    {
      id: 'MAN-TR489-BWH',
      hubId: 'hub-penang',
      hubName: 'Butterworth Northern Region Hub',
      transportType: 'Truck',
      serviceId: 'TR-489',
      expectedShipmentIds: ['MY205721'],
      expectedParcelIds: ['P-MY205721-01'],
      receivedParcelIds: ['P-MY205721-01'],
      status: 'Matched',
      lastUpdated: '16:48 Today',
    },
    ...HUB_DEMO_MANIFESTS,
  ]);
  const [simulationResult] = useState<WhatIfSimulationResult>(WHAT_IF_SCENARIOS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 6000);
  };

  const clearNotification = () => setNotification(null);

  const updateRolePermission = (role: UserRole, tab: NavigationTab, enabled: boolean) => {
    if (userRole !== 'Administrator') {
      showToast('⛔ Only the Administrator can change workspace privileges.');
      return;
    }
    if (!ROLE_ASSIGNABLE_TABS[role].includes(tab)) {
      showToast(`⛔ ${tab} is outside the approved workspace scope for ${role}.`);
      return;
    }
    if (!enabled && ROLE_LOCKED_TABS[role].includes(tab)) {
      showToast(`⛔ ${tab} is a required privilege for ${role} and cannot be removed.`);
      return;
    }
    setRolePermissions((prev) => {
      const current = prev[role] || [];
      const next = enabled ? Array.from(new Set([...current, tab])) : current.filter((item) => item !== tab);
      return { ...prev, [role]: next };
    });
    logAudit(
      currentUser.name,
      userRole,
      `RBAC Privilege ${enabled ? 'Granted' : 'Revoked'}: ${role} / ${tab}`,
      `Administrator changed workspace access for ${role}.`,
      'No AI decision',
      enabled ? 'PRIVILEGE GRANTED' : 'PRIVILEGE REVOKED',
      'RBAC matrix updated'
    );
    showToast(`${enabled ? '✅ Granted' : '🔒 Revoked'} ${tab} access for ${role}.`);
  };

  const resetRolePermissions = () => {
    if (userRole !== 'Administrator') {
      showToast('⛔ Only the Administrator can reset workspace privileges.');
      return;
    }
    setRolePermissions({
      'Logistics Operations Manager': [...ROLE_PERMITTED_TABS['Logistics Operations Manager']],
      'Security / Risk Officer': [...ROLE_PERMITTED_TABS['Security / Risk Officer']],
      'Hub Operator': [...ROLE_PERMITTED_TABS['Hub Operator']],
      'Transport Coordinator': [...ROLE_PERMITTED_TABS['Transport Coordinator']],
      'Driver': [...ROLE_PERMITTED_TABS['Driver']],
      'Administrator': [...ROLE_PERMITTED_TABS['Administrator']],
    });
    showToast('RBAC workspace privileges restored to the approved baseline.');
  };

  const setActiveTab = (tab: NavigationTab) => {
    // Role mobile apps are isolated from the desktop console. If a legacy/global
    // handler tries to navigate to a web console while an app is open, ignore it.
    const activeIsMobileApp = MOBILE_APP_TABS.includes(activeTab);
    const targetIsMobileApp = MOBILE_APP_TABS.includes(tab);
    if (activeIsMobileApp && !targetIsMobileApp) {
      return;
    }

    if (!isTabPermitted(tab)) {
      showToast(`⛔ Access Denied: "${userRole}" is not authorized to access "${tab}". Permitted: ${permittedTabs.join(', ')}.`);
      return;
    }
    setActiveTabState(tab);
  };

  const switchRole = (role: UserRole) => {
    setUserRoleState(role);
    const defaultTab = ROLE_DEFAULT_TAB[role];
    setActiveTabState(defaultTab);
    const profile = USER_PROFILES[role];
    showToast(`Workspace switched to ${role} — ${profile.name}.`);
  };

  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([
    {
      id: 'REC-1029',
      shipmentId: 'MY102938',
      detectedEvent: 'Train T105 delayed by 90 minutes due to mainline signaling fault.',
      impact: 'Estimated arrival at Petaling Jaya Auto Hub pushed from 14:30 to 16:00. High risk of missing intermodal connection window (15:30).',
      recommendation: 'Transfer shipment MY102938 to Train T108.',
      reason: 'T108 departs 35 minutes later (11:05) but operates on priority express slot, arriving at destination hub at 14:10—recovering 74 minutes.',
      expectedResult: 'Destination arrival improved by 74 minutes (New Arrival: 14:10 vs 16:00 delayed). Destination Hub transfer SLA preserved.',
      expectedImprovementMins: 74,
      capacityStatus: 'Available (46% unallocated carriage space)',
      connectionTime: 'Feasible (45 min buffer at Johor Bahru Southern Region Hub Bay 4)',
      securityRisk: 'Low (Continuous biometric custody chain retained)',
      confidence: 92,
      targetService: 'Train T108',
      status: 'Pending Approval',
      timestamp: '10:02 Today',
      evidence: [
        'Rail provider status alert: Mainline signal interlocking delay on T105 (+90 min)',
        'Consignment current status: Staged at Johor Sentral Origin Hub Bay 3',
        'Train T108 manifest check: 240 tons unallocated carriage capacity',
        'Origin hub connection time: 45 minutes transfer buffer verified',
        'Destination hub arrival deadline: 15:30 strict transfer requirement',
      ],
      alternativesConsidered: [
        { name: 'Option A: Transfer to Train T108 (Recommended)', eta: '14:10', cost: '+4%', risk: 'Low', capacity: 'Available', deadlineFeasible: true, score: 94 },
        { name: 'Option B: Hold on delayed Train T105', eta: '16:00', cost: 'Baseline', risk: 'High', capacity: 'Booked', deadlineFeasible: false, score: 32 },
        { name: 'Option C: Emergency Dedicated Linehaul Truck', eta: '15:15', cost: '+65%', risk: 'Medium', capacity: 'Standby', deadlineFeasible: true, score: 68 },
      ],
    },
  ]);

  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];

  const logAudit = (
    actor: string,
    role: string,
    event: string,
    evidence: string,
    aiDecision: string,
    humanDecision: string,
    result: string,
    shipmentId?: string
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      actor,
      role,
      event,
      evidence,
      aiDecision,
      humanDecision,
      result,
      hash: `AUDREF-${Date.now().toString(36).toUpperCase()}-${(auditLogs.length + 1).toString().padStart(4, '0')}`, 
      shipmentId,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const requireRole = (allowed: UserRole[], action: string) => {
    if (!allowed.includes(userRole)) {
      showToast(`⛔ Permission denied: ${userRole} cannot ${action}.`);
      return false;
    }
    return true;
  };

  // 1. REGISTER / PROCESS TRAIN DELAY
  const injectTrainDelay = (trainId = 'T105', minutes = 90) => {
    if (!requireRole(['Transport Coordinator'], 'register or modify transport delays')) return;
    const affectedIds = shipments.filter((s) => s.assignedVehicleOrTrain.includes(trainId)).map((s) => s.id);

    setTrainSchedules((prev) =>
      prev.map((t) => (t.id === trainId ? { ...t, status: 'Delayed', delayMinutes: minutes, isManualOverride: true, dataSource: 'Manual Operator Override' } : t))
    );

    setShipments((prev) => prev.map((s) => affectedIds.includes(s.id) ? {
      ...s,
      status: 'Delayed',
      delayMinutes: minutes,
      eta: `${s.originalEta} (+${minutes}m delay risk)`,
      riskLevel: minutes >= 60 ? 'High' : 'Medium',
      riskScore: minutes >= 60 ? 78 : 55,
      hasPendingApproval: s.id === 'MY102938',
    } : s));

    setAgents((prev) => prev.map((a) => {
      if (a.name === 'Disruption Agent') return { ...a, status: 'Analysing', currentTask: `Detected ${minutes}m delay on ${trainId}; evaluating affected hub arrivals`, anomalyDetected: true };
      if (a.name === 'Scheduling Agent') return { ...a, status: 'Analysing', currentTask: `Evaluating alternative road / rail capacity for ${trainId}` };
      if (a.name === 'Decision Agent' && affectedIds.includes('MY102938')) return { ...a, status: 'Waiting for Approval', currentTask: 'Recommendation prepared for Operations Manager' };
      return a;
    }));

    if (affectedIds.includes('MY102938')) {
      setRecommendations((prev) => prev.map((r) => r.shipmentId === 'MY102938' ? { ...r, status: 'Pending Approval', detectedEvent: `Train ${trainId} delayed by ${minutes} minutes.` } : r));
    }

    logAudit(
      currentUser.name,
      userRole,
      `Train ${trainId} Delay Registered (+${minutes} min)`,
      `Manual/provider status update recorded for ${trainId}. Affected shipments: ${affectedIds.join(', ') || 'None currently assigned'}`,
      affectedIds.length ? 'Disruption Agent assessed impact and Scheduling Agent evaluated alternatives' : 'No active shipment impact detected',
      'TRANSPORT STATUS UPDATED',
      affectedIds.length ? `${affectedIds.length} shipment(s) flagged for impact review` : 'Schedule board updated with no active shipment impact',
      affectedIds[0]
    );

    showToast(affectedIds.length ? `⚠️ ${trainId} delayed ${minutes} min. ${affectedIds.length} assigned shipment(s) sent for AI impact analysis.` : `🚂 ${trainId} delay recorded. No active assigned shipments were affected.`);
  };

  // 2. INJECT ROUTE ANOMALY
  const injectRouteAnomaly = (shipmentId = 'MY441829') => {
    if (!requireRole(['Security / Risk Officer'], 'register route anomalies')) return;
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === shipmentId) {
          return {
            ...s,
            status: 'Security Review',
            riskLevel: 'Critical',
            riskScore: 92,
            hasSecurityAlert: true,
            currentLocation: 'Batang Kali Rural Road (18.4 km off-corridor)',
          };
        }
        return s;
      })
    );

    setSecurityAlerts((prev) => {
      const exists = prev.find((a) => a.shipmentId === shipmentId && a.id === 'TR102');
      if (exists) {
        return prev.map((a) => (a.id === 'TR102' ? { ...a, status: 'Open' } : a));
      }
      return prev;
    });

    setAgents((prev) =>
      prev.map((a) => {
        if (a.name === 'Route Risk Agent') {
          return { ...a, status: 'Action Required', currentTask: 'Geofence corridor breach: 18.4 km lateral deviation', anomalyDetected: true };
        }
        return a;
      })
    );

    logAudit(
      'Route Risk Agent',
      'System AI',
      `High-Risk Route Deviation Breach (18.4 km)`,
      `Vehicle V-889 GPS: 3.4682°N, 101.6372°E (Batang Kali Bypass) | Corridor tolerance: 3.0 km`,
      'Flagged as Potential Anomaly / Evidence Inconsistent; recommended driver telematics query',
      'Pending Security Officer Review',
      'Security Alert #TR102 activated; dispatch telematics query',
      shipmentId
    );

    showToast('🚨 Cybersecurity Alert: 18.4 km Route Deviation detected on shipment MY441829!');
  };

  // 3. APPROVE RECOMMENDATION
  const approveRecommendation = (recId: string, notes = 'Rescheduling approved by Operations Manager') => {
    if (!requireRole(['Logistics Operations Manager'], 'approve AI recommendations')) return;
    const rec = recommendations.find((r) => r.id === recId);
    if (!rec) {
      showToast(`Recommendation ${recId} was not found.`);
      return;
    }
    if (rec.status !== 'Pending Approval') {
      showToast(`Recommendation ${recId} is already ${rec.status}.`);
      return;
    }

    const isOriginalT108Scenario = rec.id === 'REC-1029' || rec.targetService === 'Train T108';
    const incidentId = rec.incidentId;

    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'Approved', managerNotes: notes } : r))
    );

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id !== rec.shipmentId) return s;
        const targetService = isOriginalT108Scenario
          ? 'Train T108'
          : (rec.targetService && rec.targetService !== 'Best Available Alternative'
            ? rec.targetService
            : s.assignedVehicleOrTrain);
        return {
          ...s,
          status: 'Route & Schedule Planning',
          assignedVehicleOrTrain: targetService,
          eta: isOriginalT108Scenario ? '14:10 (Recovered)' : 'Recalculated after approved recovery plan',
          riskLevel: s.hasSecurityAlert ? s.riskLevel : 'Low',
          riskScore: s.hasSecurityAlert ? s.riskScore : 18,
          hasPendingApproval: false,
          delayMinutes: 0,
          timeline: s.timeline.map((item) =>
            item.stage === 'Route & Schedule Planning'
              ? {
                  ...item,
                  completed: true,
                  current: true,
                  location: isOriginalT108Scenario ? 'Johor Rail Terminal (Bay 4)' : s.currentLocation,
                  notes: `Recovery plan approved by Operations Manager. ${rec.recommendation}`,
                  verifiedBy: 'Operations Manager & AI Orchestrator',
                }
              : item
          ),
        };
      })
    );

    if (incidentId) {
      setIncidents((prev) => prev.map((incident) => incident.id === incidentId ? {
        ...incident,
        status: 'Resolved',
        requiresApproval: false,
        resolution: `Manager approved ${recId}. ${rec.recommendation}`,
      } : incident));
    }

    setAgents((prev) =>
      prev.map((a) => {
        if (a.name === 'Decision Agent') {
          return { ...a, status: 'Completed', currentTask: `${recId} approved by Operations Manager and released for execution` };
        }
        if (a.name === 'Scheduling Agent') {
          return { ...a, status: 'Monitoring', currentTask: `Monitoring approved recovery for ${rec.shipmentId}` };
        }
        if (a.name === 'Disruption Agent') {
          return { ...a, status: 'Monitoring', currentTask: `Monitoring post-recovery conditions for ${rec.shipmentId}` };
        }
        return a;
      })
    );

    logAudit(
      currentUser.name,
      userRole,
      `AI Recommendation Approved: ${recId}`,
      `${rec.detectedEvent || 'Operational exception'} | Manager notes: ${notes}`,
      rec.recommendation,
      'APPROVED BY OPERATIONS MANAGER',
      isOriginalT108Scenario
        ? `Shipment ${rec.shipmentId} assigned to Train T108. Arrival recovered to 14:10.`
        : `Approved recovery plan executed for shipment ${rec.shipmentId}.`,
      rec.shipmentId
    );

    showToast(isOriginalT108Scenario
      ? `Human approval recorded: ${rec.shipmentId} transferred to Train T108 and ETA recovered to 14:10.`
      : `Recovery plan ${recId} approved and executed for ${rec.shipmentId}.`);
  };

  // 4. REJECT RECOMMENDATION
  const rejectRecommendation = (recId: string, reason = 'Manager decided to retain the current plan') => {
    if (!requireRole(['Logistics Operations Manager'], 'reject AI recommendations')) return;
    const rec = recommendations.find((r) => r.id === recId);
    if (!rec) {
      showToast(`Recommendation ${recId} was not found.`);
      return;
    }
    if (rec.status !== 'Pending Approval') {
      showToast(`Recommendation ${recId} is already ${rec.status}.`);
      return;
    }

    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'Rejected', managerNotes: reason } : r))
    );

    setShipments((prev) =>
      prev.map((s) => (s.id === rec.shipmentId ? { ...s, hasPendingApproval: false } : s))
    );

    if (rec.incidentId) {
      setIncidents((prev) => prev.map((incident) => incident.id === rec.incidentId ? {
        ...incident,
        status: 'Analysing',
        requiresApproval: false,
        resolution: undefined,
      } : incident));
    }

    setAgents((prev) => prev.map((a) => {
      if (a.name === 'Decision Agent') {
        return { ...a, status: 'Action Required', currentTask: `${recId} rejected by Manager; Transport Coordinator must revise or retain baseline plan` };
      }
      if (a.name === 'Scheduling Agent') {
        return { ...a, status: 'Analysing', currentTask: `Reassessing alternatives for ${rec.shipmentId} after manager rejection` };
      }
      return a;
    }));

    logAudit(
      currentUser.name,
      userRole,
      `AI Recommendation Rejected: ${recId}`,
      `Reason: ${reason}`,
      rec.recommendation,
      'REJECTED BY OPERATIONS MANAGER',
      rec.incidentId
        ? 'Recommendation returned to Transport Coordinator for revised operational review.'
        : 'Baseline schedule retained and human oversight recorded.',
      rec.shipmentId
    );

    showToast(rec.incidentId
      ? `${recId} rejected. Case returned to Transport Coordinator for revised review.`
      : `${recId} rejected. Baseline schedule retained.`);
  };

  // 5. REQUEST DRIVER VERIFICATION
  const requestDriverVerification = (alertId: string, notes = 'Telematics verification requested') => {
    if (!requireRole(['Security / Risk Officer'], 'request driver verification')) return;
    setSecurityAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Verification Requested', verificationNotes: notes } : a))
    );

    logAudit(
      'Security / Risk Officer',
      userRole,
      `Driver Verification Requested (Alert #${alertId})`,
      `In-cab telematics prompt sent to Driver D-118 (Ahmad Faiz). ${notes}`,
      'AI suggested safe telematics query rather than punitive accusation',
      'Verification Prompt Sent',
      'Pending driver telemetry and dispatch acknowledgement',
      'MY441829'
    );

    showToast(`📡 Verification Query Dispatched: Driver D-118 prompted for location acknowledgement.`);
  };

  // 6. RESOLVE SECURITY ALERT
  const resolveSecurityAlert = (
    alertId: string,
    notes = 'Driver confirmed local road blockage (fallen branch); verified rejoining PLUS corridor at KM 54.'
  ) => {
    if (!requireRole(['Security / Risk Officer'], 'resolve security alerts')) return;
    setSecurityAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'Resolved',
              resolvedAt: new Date().toTimeString().split(' ')[0],
              resolvedBy: userRole,
              verificationNotes: notes,
            }
          : a
      )
    );

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === 'MY441829') {
          return {
            ...s,
            status: 'In Transit',
            riskLevel: 'Low',
            riskScore: 22,
            hasSecurityAlert: false,
            currentLocation: 'PLUS E1 Corridor Northbound KM 54',
          };
        }
        return s;
      })
    );

    setAgents((prev) =>
      prev.map((a) => (a.name === 'Route Risk Agent' ? { ...a, status: 'Monitoring', anomalyDetected: false } : a))
    );

    logAudit(
      'Security / Risk Officer',
      userRole,
      `Security Alert #${alertId} Resolved`,
      `Investigation findings: ${notes} | Telemetry confirms vehicle safely re-entered PLUS corridor`,
      'AI recommended corridor re-acquisition validation',
      'RESOLVED - NO ANOMALY CONFIRMED',
      'Shipment MY441829 status restored to In Transit (Normal)',
      'MY441829'
    );

    showToast(`🛡️ Security Alert #${alertId} Resolved: Investigation concluded with full audit verification.`);
  };

  // 7. ESCALATE SECURITY ALERT
  const escalateSecurityAlert = (alertId: string, reason = 'No driver response after repeated telemetry pings') => {
    if (!requireRole(['Security / Risk Officer'], 'escalate security alerts')) return;
    setSecurityAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Escalated', verificationNotes: reason } : a))
    );

    logAudit(
      'Security / Risk Officer',
      userRole,
      `Security Alert #${alertId} Escalated to Transport Ops`,
      `Reason: ${reason}`,
      'AI elevated risk score to 98% and recommended fleet halt check',
      'ESCALATED',
      'Field transport coordination alerted; hub security on standby',
      'MY441829'
    );

    showToast(`🚨 Alert #${alertId} Escalated: Transport coordination alerted.`);
  };

  // Driver submits evidence; only Hub Operator can verify the handoff.
  const submitHandoffEvidence = (handoffId: string) => {
    if (!requireRole(['Driver'], 'submit driver handoff evidence')) return;
    setHandoffs((prev) => prev.map((h) => h.id === handoffId ? {
      ...h,
      status: 'REQUIRES REVIEW',
      notes: 'Driver submitted gate scan, timestamp and location evidence. Awaiting Hub Operator verification.'
    } : h));
    logAudit(
      currentUser.name,
      userRole,
      `Driver Handoff Evidence Submitted: ${handoffId}`,
      'Gate scan + device timestamp + current location submitted from driver terminal',
      'Trust / Handoff Agent queued five-point evidence checks',
      'AWAITING HUB OPERATOR',
      'Custody handoff remains unverified until Hub Operator review'
    );
    showToast(`📨 Handoff evidence ${handoffId} submitted for Hub Operator verification.`);
  };

  // 8. VERIFY HUB HANDOFF (Until Hub)
  const verifyHandoffAction = (handoffId: string) => {
    if (!requireRole(['Hub Operator'], 'verify custody handoffs')) return;
    setHandoffs((prev) =>
      prev.map((h) =>
        h.id === handoffId
          ? {
              ...h,
              status: 'VERIFIED',
              trustScore: 94,
              notes: 'Manual supervisory override: physical seals and driver identity re-verified at hub gate.',
              checks: { ...h.checks, location: true, sequence: true },
            }
          : h
      )
    );

    logAudit(
      'Hub Operator',
      userRole,
      `Hub Handoff #${handoffId} Verified`,
      'Gate seal inspection + supervisor smartcard override',
      'Trust / Handoff Agent evaluated custody token re-alignment',
      'VERIFIED BY OPERATOR',
      'Trust score elevated to 94%; custody chain integrity restored'
    );

    showToast(`✅ Hub Custody Handoff #${handoffId} verified and token cleared.`);
  };

  // 9. MANUAL TRAIN SCHEDULE STATUS & SCHEDULE ADDITION
  // Manual provider fallback: status update + train timetable entry
  const updateTrainStatus = (
    trainId: string,
    status: 'On Time' | 'Delayed' | 'Departed' | 'Cancelled',
    delayMinutes = 0,
    notes?: string
  ) => {
    if (!requireRole(['Transport Coordinator'], 'update train service status')) return;
    setTrainSchedules((prev) =>
      prev.map((t) =>
        t.id === trainId
          ? {
              ...t,
              status,
              delayMinutes: status === 'Delayed' ? delayMinutes || 30 : 0,
              isManualOverride: true,
              dataSource: 'Manual Operator Override',
              notes: notes || `Manually set to ${status} by ${userRole}`,
            }
          : t
      )
    );

    // If delayed, trigger AI agents
    if (status === 'Delayed') {
      injectTrainDelay(trainId, delayMinutes || 30);
    } else {
      logAudit(
        userRole,
        userRole,
        `Train ${trainId} Status Manually Updated to ${status}`,
        `Standalone rail-provider schedule override. Delay: ${delayMinutes}m`,
        'Scheduling Agent updated slot timetable availability',
        'APPLIED BY OPERATOR',
        `Train ${trainId} status set to ${status}`
      );
      showToast(`🚂 Train ${trainId} status manually updated to: ${status}`);
    }
  };

  const addNewTrainSchedule = (newSchedule: Partial<TrainSchedule>) => {
    if (!requireRole(['Transport Coordinator'], 'add train schedules')) return;
    const id = newSchedule.id?.trim().toUpperCase() || `T${Math.floor(400 + Math.random() * 500)}`;
    const schedule: TrainSchedule = {
      id,
      route: newSchedule.route || 'Johor Bahru → Klang Valley',
      originHub: newSchedule.originHub || 'hub-jb',
      destHub: newSchedule.destHub || 'hub-kl',
      departure: newSchedule.departure || '14:00',
      arrival: newSchedule.arrival || '17:30',
      status: (newSchedule.status as any) || 'On Time',
      delayMinutes: newSchedule.delayMinutes || 0,
      capacityAvailable: true,
      currentUtilisationPct: newSchedule.currentUtilisationPct || 45,
      cargoCapacityTons: newSchedule.cargoCapacityTons || 500,
      isManualOverride: true,
      dataSource: 'Manual Operator Override',
      notes: newSchedule.notes || 'Manually scheduled intermodal rail service',
    };

    setTrainSchedules((prev) => [...prev, schedule]);

    logAudit(
      userRole,
      userRole,
      `New Train Schedule Added: ${schedule.id}`,
      `Route: ${schedule.route} | Departure: ${schedule.departure} | Arrival: ${schedule.arrival}`,
      'Scheduling Agent registered manual train slot into routing engine',
      'MANUAL ENTRY APPROVED',
      `Train ${schedule.id} active in intermodal schedule planning`
    );

    showToast(`✅ New train service ${schedule.id} (${schedule.departure} → ${schedule.arrival}) manually registered!`);
  };

  const deleteTrainSchedule = (trainId: string) => {
    if (!requireRole(['Transport Coordinator'], 'delete train schedules')) return;
    setTrainSchedules((prev) => prev.filter((t) => t.id !== trainId));
    logAudit(
      userRole,
      userRole,
      `Train Service Deleted: ${trainId}`,
      `Service removed from intermodal planning matrix`,
      'Scheduling Agent re-indexed available rail capacity',
      'DELETED',
      `Train ${trainId} removed`
    );
    showToast(`Train service ${trainId} removed from schedule.`);
  };


  const addShipment = (input: Partial<Shipment> & { id?: string }) => {
    if (!requireRole(['Transport Coordinator'], 'add operational shipments')) return;

    const id = input.id?.trim().toUpperCase() || `MY${Math.floor(100000 + Math.random() * 899999)}`;
    if (shipments.some((s) => s.id === id)) {
      showToast(`Shipment ${id} already exists.`);
      return;
    }

    const parcelCount = Math.max(1, input.parcelCount || 1);
    const parcelIds = input.parcelIds?.length
      ? input.parcelIds
      : Array.from({ length: parcelCount }, (_, i) => `P-${id}-${String(i + 1).padStart(2, '0')}`);

    const shipment: Shipment = {
      id,
      originHub: input.originHub || 'Johor Bahru Southern Region Hub (JHB-SRH)',
      destinationHub: input.destinationHub || 'Petaling Jaya Auto Hub (PJ-AH)',
      origin: input.origin || 'Johor Bahru',
      destination: input.destination || 'Kuala Lumpur',
      currentLocation: input.currentLocation || 'Johor Bahru Southern Region Hub',
      status: input.status || 'Origin Hub',
      transportMode: input.transportMode || 'Road + Rail',
      riskLevel: input.riskLevel || 'Low',
      riskScore: input.riskScore ?? 10,
      assignedVehicleOrTrain: input.assignedVehicleOrTrain || 'Unassigned',
      vehicleType: input.vehicleType || 'Intermodal',
      eta: input.eta || 'Pending planning',
      originalEta: input.originalEta || input.eta || 'Pending planning',
      targetArrival: input.targetArrival || 'Today 18:00',
      priority: input.priority || 'Standard',
      weightKg: input.weightKg ?? 1,
      dimensions: input.dimensions || '30 x 20 x 15 cm',
      category: input.category || 'General Parcel',
      timeline: input.timeline || [
        { stage: 'Origin Hub', location: input.originHub || 'Johor Bahru Southern Region Hub', timestamp: 'Now', completed: true, current: true },
        { stage: 'Route & Schedule Planning', location: 'Pending assignment', timestamp: 'Pending', completed: false },
        { stage: 'In Transit', location: 'Pending', timestamp: 'Pending', completed: false },
        { stage: 'Destination Hub', location: input.destinationHub || 'Petaling Jaya Auto Hub (HQ)', timestamp: 'Pending', completed: false },
        { stage: 'Last-Mile Dispatch', location: input.destination || 'Destination Zone', timestamp: 'Pending', completed: false },
      ],
      routeCoordinates: input.routeCoordinates || [],
      currentProgressPct: input.currentProgressPct ?? 20,
      hasSecurityAlert: false,
      hasPendingApproval: false,
      delayMinutes: 0,
      parcelCount,
      receivedParcelCount: input.receivedParcelCount ?? 0,
      parcelIds,
    };

    setShipments((prev) => [shipment, ...prev]);
    setSelectedShipmentId(id);
    logAudit(
      currentUser.name,
      userRole,
      `Operational Shipment Added: ${id}`,
      `${parcelCount} parcel(s) registered: ${parcelIds.join(', ')}`,
      'Shipment entered normal Stage 3 operational workflow',
      'REGISTERED',
      `Shipment ${id} available for hub, transport and incident testing`,
      id
    );
    showToast(`📦 Shipment ${id} added with ${parcelCount} parcel(s).`);
  };

  const addIncident = (input: {
    type: IncidentType;
    occurredAt?: string;
    location: string;
    severity?: 'Low' | 'Medium' | 'High' | 'Critical';
    transportType?: 'Train' | 'Truck' | 'Intermodal';
    affectedServiceId?: string;
    affectedHubId?: string;
    shipmentId?: string;
    details: string;
  }) => {
    if (!requireRole(['Transport Coordinator', 'Hub Operator', 'Driver', 'Security / Risk Officer'], 'report incidents')) return;

    const affected = shipments.filter((s) => {
      if (input.shipmentId && s.id === input.shipmentId) return true;
      if (input.affectedServiceId && s.assignedVehicleOrTrain.includes(input.affectedServiceId)) return true;
      if (input.transportType && s.vehicleType === input.transportType) return true;
      if (input.affectedHubId) {
        const hub = hubs.find((h) => h.id === input.affectedHubId);
        if (hub && (s.originHub.includes(hub.name.split(' ')[0]) || s.destinationHub.includes(hub.name.split(' ')[0]) || s.currentLocation.includes(hub.name.split(' ')[0]))) return true;
      }
      return false;
    });

    const affectedIds = affected.map((s) => s.id);
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    const severity = input.severity || 'High';

    const hubReportLabelMatch = input.details.match(/^\[([^\]]+)\]/);
    const hubReportLabel = hubReportLabelMatch?.[1] || '';
    const isWrongHub = input.type === 'Wrong Hub';
    const isHubCongestion = input.type === 'Hub Congestion';
    const isTransportIncident = ['Train Delay', 'Flood', 'Traffic', 'Vehicle Breakdown', 'Accident'].includes(input.type);
    const isRouteSecurity = input.type === 'Route Deviation';
    const isHubSortingProblem = hubReportLabel === 'Sorting / Outbound Problem';
    const isHubTrustException =
      ['Receiving Problem', 'Manifest Mismatch', 'Handoff / Custody Issue', 'Other Hub Issue'].includes(hubReportLabel)
      || ['Missing Parcel', 'Invalid Scan'].includes(input.type);
    const needsCoordinatorReview = isWrongHub || isHubCongestion || isTransportIncident;

    const recommendationByType: Record<IncidentType, string> = {
      'Train Delay': 'Compare next rail service, current wait baseline and road fallback; Transport Coordinator selects the feasible recovery plan.',
      Flood: 'Avoid the affected corridor and compare alternate road, rail or temporary hold options before changing the transport plan.',
      Traffic: 'Recalculate ETA and compare an alternate road corridor or rail transfer before changing the transport plan.',
      'Vehicle Breakdown': 'Secure the load and compare replacement vehicle, rail transfer or recovery wait options.',
      Accident: 'Prioritise safety, secure the affected load and compare replacement transport / reroute options.',
      'Hub Congestion': 'Transport Coordinator reviews arrival slots, capacity and service timing; use re-slotting first and escalate only if a major reroute is needed.',
      'Missing Parcel': 'Hub Operator freezes the affected handoff, reconciles manifest vs scans, searches the last custody point and escalates only if the parcel is not found.',
      'Wrong Hub': 'Hold the parcel, verify the planned hub and route, then send it to Transport Coordinator for a recovery service back to the correct route.',
      'Route Deviation': 'Request driver verification, compare telemetry evidence and escalate to Security / Risk Officer if the deviation is not justified.',
      'Invalid Scan': 'Pause custody progression, request a re-scan and verify identity, parcel, location, timestamp and handoff sequence.',
    };

    let recommendation = recommendationByType[input.type];
    if (hubReportLabel === 'Receiving Problem') {
      recommendation = 'Hub Operator pauses the affected receiving task, verifies the load / parcel reference and repeats the receiving scan before escalation.';
    } else if (hubReportLabel === 'Manifest Mismatch') {
      recommendation = 'Hub Operator completes receiving, reconciles expected vs received parcels, then confirms any missing or unexpected parcel before escalation.';
    } else if (hubReportLabel === 'Handoff / Custody Issue') {
      recommendation = 'Hub Operator requests fresh handoff evidence or re-scan and accepts custody only after identity, parcel, location and sequence checks pass.';
    } else if (isHubSortingProblem) {
      recommendation = 'Hub Operator keeps the shipment at the hub, corrects the sorting / outbound assignment and resumes outbound preparation after verification.';
    } else if (hubReportLabel === 'Other Hub Issue') {
      recommendation = 'Hub Operator handles the local operational issue first; escalate only if it becomes a transport, custody or security exception.';
    }

    const category =
      isTransportIncident ? 'Transport'
      : isWrongHub || isHubCongestion || isHubSortingProblem ? 'Hub'
      : isRouteSecurity ? 'Security'
      : input.type === 'Invalid Scan' && !isHubTrustException ? 'Security'
      : 'Parcel';

    // Important responsibility rule:
    // Reporting an incident never jumps straight to manager approval.
    // Hub-local issues stay with Hub Operator. Network transport issues go to Transport Coordinator.
    // Manager approval is requested only later, after Coordinator review, for a consequential change.
    const requiresApproval = false;
    const incident: LogisticsIncident = {
      id: incidentId,
      type: input.type,
      category: category as LogisticsIncident['category'],
      occurredAt: input.occurredAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: input.location,
      severity,
      status: 'Analysing',
      createdBy: `${currentUser.name} (${userRole})`,
      details: input.details,
      transportType: input.transportType,
      affectedServiceId: input.affectedServiceId,
      affectedHubId: input.affectedHubId,
      shipmentId: input.shipmentId,
      affectedShipmentIds: affectedIds,
      recommendation,
      decisionFactors: {
        etaImpact: affected.length ? `${affected.length} shipment(s) require ETA / operational impact review` : 'No assigned shipment matched yet',
        capacity: needsCoordinatorReview ? 'Transport Coordinator checks service / hub capacity before any route change' : 'Not required unless this hub exception affects outbound flow',
        cost: needsCoordinatorReview ? 'Compare current plan vs recovery option before escalation' : 'Local hub handling first',
        security: isRouteSecurity || input.type === 'Invalid Scan' || input.type === 'Missing Parcel' || isWrongHub ? 'Evidence verification required' : 'Normal operational controls',
        sla: needsCoordinatorReview ? 'Coordinator checks SLA impact before selecting recovery action' : 'Monitor only if local handling creates delay',
      },
      requiresApproval,
    };

    setIncidents((prev) => [incident, ...prev]);

    if (affectedIds.length) {
      setShipments((prev) => prev.map((s) => affectedIds.includes(s.id) ? {
        ...s,
        status: isRouteSecurity || input.type === 'Invalid Scan' || input.type === 'Missing Parcel' || isWrongHub ? 'Security Review' : isHubSortingProblem ? s.status : 'Delayed',
        riskLevel: severity === 'Critical' ? 'Critical' : severity === 'High' ? 'High' : 'Medium',
        riskScore: severity === 'Critical' ? 95 : severity === 'High' ? 78 : 55,
        hasSecurityAlert: [ 'Route Deviation', 'Invalid Scan', 'Missing Parcel', 'Wrong Hub' ].includes(input.type) || s.hasSecurityAlert,
        hasPendingApproval: false,
      } : s));
    }

    if (input.type === 'Train Delay' && input.affectedServiceId) {
      setTrainSchedules((prev) => prev.map((t) => t.id === input.affectedServiceId ? {
        ...t,
        status: 'Delayed',
        delayMinutes: 90,
        isManualOverride: true,
        dataSource: 'Manual Operator Override',
        notes: input.details,
      } : t));
    }

    if (needsCoordinatorReview && affected[0]) {
      const s = affected[0];
      const recId = `REC-${Date.now().toString().slice(-4)}`;
      setRecommendations((prev) => [{
        id: recId,
        incidentId,
        shipmentId: s.id,
        detectedEvent: `${input.type} at ${input.location}`,
        impact: `${affectedIds.length || 1} shipment(s) affected. ${input.details}`,
        recommendation,
        reason: `Decision support considered ETA, capacity, cost, security risk and SLA impact. Transport Coordinator must review before execution or manager escalation.`,
        expectedResult: 'Restore a feasible transport plan while preserving custody evidence and operational accountability.',
        expectedImprovementMins: 30,
        capacityStatus: 'Check alternatives',
        connectionTime: 'To be confirmed by Transport Coordinator',
        securityRisk: isWrongHub || input.type === 'Flood' || input.type === 'Accident' ? 'Medium' : 'Low',
        confidence: 88,
        targetService: input.affectedServiceId || 'Best Available Alternative',
        status: 'Coordinator Review',
        timestamp: 'Now',
        evidence: [
          `Incident ${incidentId}: ${input.type}`,
          `Location: ${input.location}`,
          `Affected shipments: ${affectedIds.join(', ') || s.id}`,
          'Operational factors: ETA, capacity, cost, security and SLA',
        ],
        alternativesConsidered: [
          { name: 'Recommended Recovery Plan', eta: 'Best feasible ETA', cost: '+8%', risk: 'Low', capacity: 'Available', deadlineFeasible: true, score: 90 },
          { name: 'Hold / Wait Baseline', eta: 'Delayed', cost: 'Baseline', risk: 'Medium', capacity: 'Booked', deadlineFeasible: false, score: 48 },
          { name: 'Alternate Transport / Hub', eta: 'Fallback', cost: '+28%', risk: 'Medium', capacity: 'Standby', deadlineFeasible: true, score: 70 },
        ],
      }, ...prev]);
    }

    setAgents((prev) => prev.map((a) => {
      if (isWrongHub && a.name === 'Trust / Handoff Agent') {
        return { ...a, status: 'Action Required', anomalyDetected: true, currentTask: `Wrong-hub evidence check for ${incidentId}` };
      }
      if (isWrongHub && a.name === 'Scheduling Agent') {
        return { ...a, status: 'Analysing', currentTask: `Finding recovery service to return affected parcel to the planned route` };
      }
      if (isWrongHub && a.name === 'Decision Agent') {
        return { ...a, status: 'Action Required', currentTask: `Recovery options ready for Transport Coordinator review` };
      }
      if (isHubCongestion && a.name === 'Disruption Agent') {
        return { ...a, status: 'Analysing', anomalyDetected: true, currentTask: `Hub congestion at ${input.location}: transport impact analysis` };
      }
      if (isHubCongestion && a.name === 'Scheduling Agent') {
        return { ...a, status: 'Analysing', currentTask: `Checking arrival slots and alternate capacity for ${input.location}` };
      }
      if (isHubCongestion && a.name === 'Decision Agent') {
        return { ...a, status: 'Action Required', currentTask: `Congestion recovery options ready for Transport Coordinator review` };
      }
      if (isHubTrustException && a.name === 'Trust / Handoff Agent') {
        return { ...a, status: 'Action Required', anomalyDetected: true, currentTask: `${hubReportLabel || input.type}: reconciling manifest, scan and custody evidence` };
      }
      if (isTransportIncident && a.name === 'Disruption Agent') {
        return { ...a, status: 'Analysing', anomalyDetected: true, currentTask: `${input.type}: impact analysis for ${affectedIds.length} shipment(s)` };
      }
      if (isTransportIncident && a.name === 'Scheduling Agent') {
        return { ...a, status: 'Analysing', currentTask: `Generating transport recovery options for ${incidentId}` };
      }
      if (isTransportIncident && a.name === 'Decision Agent') {
        return { ...a, status: 'Action Required', currentTask: `Recovery options ready for Transport Coordinator review` };
      }
      if (isRouteSecurity && a.name === 'Route Risk Agent') {
        return { ...a, status: 'Action Required', anomalyDetected: true, currentTask: `${input.type}: route / telemetry evidence verification required` };
      }
      return a;
    }));

    const outcome = needsCoordinatorReview
      ? 'TRANSPORT COORDINATOR REVIEW'
      : isRouteSecurity
      ? 'SECURITY REVIEW'
      : 'HUB OPERATOR ACTION';

    logAudit(
      currentUser.name,
      userRole,
      `Incident Registered: ${input.type} (${incidentId})`,
      `${input.details} | Location: ${input.location} | Affected: ${affectedIds.join(', ') || 'No current match'}`,
      recommendation,
      outcome,
      needsCoordinatorReview
        ? 'Recovery options routed to Transport Coordinator; no manager approval requested yet'
        : isHubSortingProblem
        ? 'Local sorting / outbound exception remains with Hub Operator'
        : 'Incident routed to the relevant operational / evidence workflow',
      affectedIds[0]
    );

    const workflowMessage = isWrongHub
      ? 'Trust / Handoff Agent verifies the wrong-hub evidence; recovery options are routed to Transport Coordinator.'
      : isHubCongestion
      ? 'Disruption, Scheduling and Decision Agents are analysing transport impact for Transport Coordinator review.'
      : isHubSortingProblem
      ? 'This remains a Hub Operator operational issue. Correct the sorting / outbound assignment and resume preparation.'
      : isHubTrustException
      ? 'Trust / Handoff Agent is reconciling manifest, scan and custody evidence.'
      : isRouteSecurity
      ? 'Route Risk Agent is verifying route and telemetry evidence.'
      : isTransportIncident
      ? 'Disruption, Scheduling and Decision Agents are preparing recovery options for Transport Coordinator review.'
      : 'Relevant workflow started.';
    showToast(`⚠️ ${input.type} incident created. ${workflowMessage}`);
  };

  const submitRecommendationForManagerApproval = (recId: string, notes = 'Consequential transport change requires Operations Manager approval') => {
    if (!requireRole(['Transport Coordinator'], 'submit recommendations for manager approval')) return;
    const rec = recommendations.find((r: any) => r.id === recId);
    if (!rec) return;
    const incidentId = rec.incidentId;
    setRecommendations((prev) => prev.map((r: any) => r.id === recId ? { ...r, status: 'Pending Approval', coordinatorNotes: notes } : r));
    if (incidentId) {
      setIncidents((prev) => prev.map((i) => i.id === incidentId ? { ...i, status: 'Pending Approval', requiresApproval: true } : i));
    }
    setShipments((prev) => prev.map((s) => s.id === rec.shipmentId ? { ...s, hasPendingApproval: true } : s));
    setAgents((prev) => prev.map((a) => a.name === 'Decision Agent'
      ? { ...a, status: 'Waiting for Approval', currentTask: `${recId} submitted by Transport Coordinator for Operations Manager approval` }
      : a));
    logAudit(currentUser.name, userRole, `Manager Approval Requested: ${recId}`, notes, rec.recommendation || 'Recovery recommendation', 'PENDING MANAGER APPROVAL', 'Operations Manager must approve or reject before consequential execution', rec.shipmentId);
    showToast(`📨 ${recId} submitted to Operations Manager for approval.`);
  };

  const applyCoordinatorOperationalRecovery = (recId: string, notes = 'Minor operational transport adjustment applied by Transport Coordinator') => {
    if (!requireRole(['Transport Coordinator'], 'apply operational transport recovery')) return;
    const rec = recommendations.find((r: any) => r.id === recId);
    if (!rec) return;
    const incidentId = rec.incidentId;
    setRecommendations((prev) => prev.map((r: any) => r.id === recId ? { ...r, status: 'Implemented', coordinatorNotes: notes } : r));
    if (incidentId) {
      setIncidents((prev) => prev.map((i) => i.id === incidentId ? { ...i, status: 'Resolved', requiresApproval: false, resolution: notes } : i));
    }
    setShipments((prev) => prev.map((s) => s.id === rec.shipmentId ? { ...s, hasPendingApproval: false } : s));
    setAgents((prev) => prev.map((a) => ['Scheduling Agent', 'Decision Agent', 'Disruption Agent'].includes(a.name)
      ? { ...a, status: 'Monitoring', currentTask: `Monitoring operational recovery after ${recId}` }
      : a));
    logAudit(currentUser.name, userRole, `Operational Recovery Applied: ${recId}`, notes, rec.recommendation || 'Recovery recommendation', 'IMPLEMENTED BY TRANSPORT COORDINATOR', 'Minor transport adjustment completed without manager approval', rec.shipmentId);
    showToast(`✅ ${recId} applied as an operational adjustment.`);
  };

  const resolveIncident = (incidentId: string, resolution = 'Incident reviewed and operational recovery completed') => {
    if (!requireRole(['Transport Coordinator', 'Hub Operator', 'Security / Risk Officer'], 'resolve incidents')) return;
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return;
    setIncidents((prev) => prev.map((i) => i.id === incidentId ? { ...i, status: 'Resolved', resolution } : i));
    setShipments((prev) => prev.map((s) => incident.affectedShipmentIds.includes(s.id) ? {
      ...s,
      hasPendingApproval: false,
      riskLevel: s.hasSecurityAlert ? s.riskLevel : 'Low',
      riskScore: s.hasSecurityAlert ? s.riskScore : 20,
    } : s));
    logAudit(currentUser.name, userRole, `Incident Resolved: ${incident.type} (${incidentId})`, resolution, 'Recovery workflow completed', 'RESOLVED', 'Incident closed with audit record', incident.affectedShipmentIds[0]);
    showToast(`✅ Incident ${incidentId} resolved.`);
  };

  const reportManifestReceipt = (manifestId: string, parcelId: string) => {
    if (!requireRole(['Hub Operator'], 'update hub manifest receipts')) return;
    const manifest = hubManifests.find((m) => m.id === manifestId);
    if (!manifest) return;
    if ((manifest.direction || 'Incoming') !== 'Incoming') {
      showToast('⛔ Receiving scan is only available for incoming loads.');
      return;
    }
    if (manifest.hubStatus === 'In Transit') {
      showToast(`⛔ ${manifest.serviceId} has not arrived at the hub yet.`);
      return;
    }
    if (manifest.hubStatus === 'Received') {
      showToast(`ℹ️ Receiving for ${manifest.serviceId} has already been completed.`);
      return;
    }

    setHubManifests((prev) => prev.map((m) => {
      if (m.id !== manifestId) return m;
      const received = m.receivedParcelIds.includes(parcelId) ? m.receivedParcelIds : [...m.receivedParcelIds, parcelId];
      return {
        ...m,
        receivedParcelIds: received,
        status: 'Pending',
        hubStatus: 'Receiving',
        lastUpdated: 'Now',
      };
    }));
    showToast(`📦 Parcel ${parcelId} scanned under ${manifest.serviceId}.`);
  };

  const completeManifestReceiving = (manifestId: string) => {
    if (!requireRole(['Hub Operator'], 'complete hub receiving')) return;
    const manifest = hubManifests.find((m) => m.id === manifestId);
    if (!manifest) return;
    if ((manifest.direction || 'Incoming') !== 'Incoming' || manifest.hubStatus === 'In Transit') {
      showToast('⛔ This load is not ready for receiving completion.');
      return;
    }
    const missing = manifest.expectedParcelIds.filter((id) => !manifest.receivedParcelIds.includes(id));
    const unexpected = manifest.receivedParcelIds.filter((id) => !manifest.expectedParcelIds.includes(id));
    const finalStatus: HubManifest['status'] = missing.length === 0 && unexpected.length === 0 ? 'Matched' : 'Mismatch';
    setHubManifests((prev) => prev.map((m) => m.id === manifestId ? {
      ...m,
      status: finalStatus,
      hubStatus: 'Received',
      lastUpdated: 'Now',
    } : m));
    logAudit(
      currentUser.name,
      userRole,
      `Receiving Completed: ${manifest.serviceId}`,
      `${manifest.expectedParcelIds.length} expected | ${manifest.receivedParcelIds.length} scanned | ${missing.length} missing | ${unexpected.length} unexpected`,
      'Hub receiving and manifest reconciliation completed',
      finalStatus === 'Matched' ? 'MATCHED' : 'MISMATCH FOUND',
      finalStatus === 'Matched' ? 'Load cleared for hub processing' : 'Exceptions require follow-up'
    );
    showToast(finalStatus === 'Matched'
      ? `✅ ${manifest.serviceId} receiving completed with no mismatch.`
      : `⚠️ ${manifest.serviceId} receiving completed with ${missing.length} missing and ${unexpected.length} unexpected parcel(s).`);
  };

  const markManifestReadyForDispatch = (manifestId: string) => {
    if (!requireRole(['Hub Operator'], 'prepare outgoing load')) return;
    const manifest = hubManifests.find((m) => m.id === manifestId);
    if (!manifest || manifest.direction !== 'Outgoing') return;
    const allLoaded = manifest.expectedParcelIds.every((id) => manifest.receivedParcelIds.includes(id));
    if (!allLoaded) {
      showToast(`⛔ ${manifest.serviceId} cannot be marked ready until all expected parcels are loaded.`);
      return;
    }
    setHubManifests((prev) => prev.map((m) => m.id === manifestId ? {
      ...m,
      status: 'Matched',
      hubStatus: 'Ready for Dispatch',
      lastUpdated: 'Now',
    } : m));
    showToast(`✅ ${manifest.serviceId} is ready for dispatch.`);
  };

  const markManifestDeparted = (manifestId: string) => {
    if (!requireRole(['Hub Operator'], 'confirm outgoing handoff')) return;
    const manifest = hubManifests.find((m) => m.id === manifestId);
    if (!manifest || manifest.direction !== 'Outgoing') return;
    if (manifest.hubStatus !== 'Ready for Dispatch') {
      showToast(`⛔ ${manifest.serviceId} must be ready for dispatch before departure is confirmed.`);
      return;
    }
    setHubManifests((prev) => prev.map((m) => m.id === manifestId ? {
      ...m,
      status: 'Matched',
      hubStatus: 'Departed',
      lastUpdated: 'Now',
    } : m));
    logAudit(
      currentUser.name,
      userRole,
      `Outgoing Handoff Completed: ${manifest.serviceId}`,
      `${manifest.expectedShipmentIds.length} shipment(s), ${manifest.expectedParcelIds.length} parcel(s) departed ${manifest.hubName}`,
      'Outbound custody and load departure confirmed',
      'DEPARTED',
      `Load released to ${manifest.destinationName || 'next destination'}`
    );
    showToast(`🚚 ${manifest.serviceId} departure confirmed.`);
  };

  const resetAllData = () => {
    setShipments([...INITIAL_SHIPMENTS, ...HUB_DEMO_SHIPMENTS]);
    setSelectedShipmentId('MY102938');
    setAgents(INITIAL_AI_AGENTS);
    setTrainSchedules(INITIAL_TRAIN_SCHEDULES);
    setSecurityAlerts(INITIAL_SECURITY_ALERTS);
    setHandoffs([...HUB_DEMO_HANDOFFS]);
    setAuditLogs([...INITIAL_AUDIT_LOGS, ...HUB_DEMO_AUDIT_LOGS]);
    setIncidents(INITIAL_MOCK_INCIDENTS);
    setRolePermissions({
      'Logistics Operations Manager': [...ROLE_PERMITTED_TABS['Logistics Operations Manager']],
      'Security / Risk Officer': [...ROLE_PERMITTED_TABS['Security / Risk Officer']],
      'Hub Operator': [...ROLE_PERMITTED_TABS['Hub Operator']],
      'Transport Coordinator': [...ROLE_PERMITTED_TABS['Transport Coordinator']],
      'Driver': [...ROLE_PERMITTED_TABS['Driver']],
      'Administrator': [...ROLE_PERMITTED_TABS['Administrator']],
    });
    setHubManifests([
      {
        id: 'MAN-T105-PJ',
        hubId: 'hub-kl',
        hubName: 'Petaling Jaya Auto Hub (HQ)',
        transportType: 'Train',
        serviceId: 'T105',
        expectedShipmentIds: ['MY102938', 'MY309812', 'MY287611'],
        expectedParcelIds: ['P-MY102938-01', 'P-MY309812-01', 'P-MY287611-01'],
        receivedParcelIds: ['P-MY102938-01', 'P-MY309812-01'],
        status: 'Mismatch',
        lastUpdated: '16:02 Today',
      },
      ...HUB_DEMO_MANIFESTS,
    ]);
    showToast('Platform reset to initial mid-mile baseline.');
  };

  return (
    <LogisticsContext.Provider
      value={{
        currentUser,
        userRole,
        permittedTabs,
        switchRole,
        isTabPermitted,
        rolePermissions,
        updateRolePermission,
        resetRolePermissions,

        activeTab,
        setActiveTab,
        shipments,
        selectedShipmentId,
        setSelectedShipmentId,
        selectedShipment,
        hubs,
        agents,
        trainSchedules,
        securityAlerts,
        recommendations,
        handoffs,
        auditLogs,
        incidents,
        hubManifests,
        simulationResult,
        searchQuery,
        setSearchQuery,
        notification,
        clearNotification,

        injectTrainDelay,
        injectRouteAnomaly,
        approveRecommendation,
        rejectRecommendation,
        submitRecommendationForManagerApproval,
        applyCoordinatorOperationalRecovery,
        requestDriverVerification,
        resolveSecurityAlert,
        escalateSecurityAlert,
        verifyHandoffAction,
        submitHandoffEvidence,

        updateTrainStatus,
        addNewTrainSchedule,
        deleteTrainSchedule,

        addShipment,
        addIncident,
        resolveIncident,
        reportManifestReceipt,
        completeManifestReceiving,
        markManifestReadyForDispatch,
        markManifestDeparted,

        resetAllData,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
