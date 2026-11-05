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
  const permittedTabs = ROLE_PERMITTED_TABS[userRole] || [];

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
  const [incidents, setIncidents] = useState<LogisticsIncident[]>([
    {
      id: 'INC-1001',
      type: 'Train Delay',
      category: 'Transport',
      occurredAt: '10:02 Today',
      location: 'Kluang mainline corridor',
      severity: 'High',
      status: 'Pending Approval',
      createdBy: 'Transport Coordinator',
      details: 'Train T105 delayed 90 minutes after provider phone update.',
      transportType: 'Train',
      affectedServiceId: 'T105',
      affectedShipmentIds: ['MY102938', 'MY309812', 'MY287611'],
      recommendation: 'Transfer priority shipment MY102938 to Train T108; hold or re-plan remaining cargo based on SLA.',
      decisionFactors: {
        etaImpact: 'T105 ETA 16:00 vs T108 ETA 14:10',
        capacity: 'T108 has 46% unallocated capacity',
        cost: '+4% marginal vs +65% road hotshot',
        security: 'Low risk; custody chain retained',
        sla: 'T108 preserves destination hub SLA',
      },
      requiresApproval: true,
    },
  ]);
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

  const setActiveTab = (tab: NavigationTab) => {
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
    if (!rec) return;

    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'Approved' } : r))
    );

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === rec.shipmentId) {
          const isOriginalT108Scenario = rec.id === 'REC-1029' || rec.targetService === 'Train T108';
          const targetService = isOriginalT108Scenario
            ? 'Train T108'
            : (rec.targetService && rec.targetService !== 'Best Available Alternative' ? rec.targetService : s.assignedVehicleOrTrain);
          return {
            ...s,
            status: 'Route & Schedule Planning',
            assignedVehicleOrTrain: targetService,
            eta: isOriginalT108Scenario ? '14:10 (Recovered)' : 'Recalculated after approved recovery plan',
            riskLevel: 'Low',
            riskScore: 18,
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
        }
        return s;
      })
    );

    setAgents((prev) =>
      prev.map((a) => {
        if (a.name === 'Decision Agent') {
          return { ...a, status: 'Completed', currentTask: 'Recommendation REC-1029 approved and executed' };
        }
        if (a.name === 'Scheduling Agent') {
          return { ...a, status: 'Monitoring', currentTask: 'Train T108 manifest updated. Slot locked.' };
        }
        return a;
      })
    );

    logAudit(
      'Operations Manager (User)',
      userRole,
      `AI Recommendation Approved: ${rec.recommendation}`,
      `Verified Train T108 capacity (54% load) & 45m hub transfer window. Notes: ${notes}`,
      'AI Recommendation REC-1029: Transfer MY102938 from T105 to T108',
      'APPROVED',
      rec.id === 'REC-1029' ? 'Shipment MY102938 assigned to Train T108. Arrival improved by 74 min (14:10). Destination Hub transfer SLA preserved.' : `Recovery plan applied to shipment ${rec.shipmentId}; route/schedule returned to human-governed planning.`,
      rec.shipmentId
    );

    showToast(rec.id === 'REC-1029' ? `✅ Human Approval Recorded: Shipment ${rec.shipmentId} transferred to Train T108! Arrival recovered to 14:10.` : `✅ Recovery plan approved for ${rec.shipmentId}. Execution and audit trail updated.`);
  };

  // 4. REJECT RECOMMENDATION
  const rejectRecommendation = (recId: string, reason = 'Operator decided to hold') => {
    if (!requireRole(['Logistics Operations Manager'], 'reject AI recommendations')) return;
    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'Rejected' } : r))
    );

    const rec = recommendations.find((r) => r.id === recId);
    if (rec) {
      setShipments((prev) =>
        prev.map((s) => (s.id === rec.shipmentId ? { ...s, hasPendingApproval: false } : s))
      );
    }

    logAudit(
      'Operations Manager (User)',
      userRole,
      `AI Recommendation Rejected`,
      `Reason: ${reason}`,
      `AI Recommended transfer to T108`,
      'REJECTED',
      'Original schedule retained. Manual oversight logged.',
      rec?.shipmentId
    );

    showToast(`Recommendation ${recId} rejected. Baseline schedule maintained.`);
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
    if (!requireRole(['Logistics Operations Manager', 'Transport Coordinator', 'Administrator'], 'add operational shipments')) return;

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
    const allowed: UserRole[] = ['Logistics Operations Manager', 'Transport Coordinator', 'Hub Operator', 'Security / Risk Officer', 'Driver'];
    if (!requireRole(allowed, 'register incidents')) return;

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

    const recommendationByType: Record<IncidentType, string> = {
      'Train Delay': 'Compare next rail service, wait baseline and emergency road option; reroute SLA-critical shipments.',
      Flood: 'Avoid affected corridor; compare alternate road, rail and temporary hold options.',
      Traffic: 'Recalculate ETA and compare alternate road corridor or rail transfer.',
      'Vehicle Breakdown': 'Hold cargo securely and compare replacement vehicle, rail transfer or recovery wait.',
      Accident: 'Prioritise safety, hold affected cargo and compare replacement transport / reroute options.',
      'Hub Congestion': 'Re-slot inbound flow, delay selected arrivals or divert eligible shipments to an alternate hub.',
      'Missing Parcel': 'Freeze affected handoff, reconcile manifest vs scans, search last custody point and escalate if not found.',
      'Wrong Hub': 'Hold parcel at current hub and generate recovery route to the planned destination hub.',
      'Route Deviation': 'Request driver verification, compare telemetry evidence and escalate if deviation is not justified.',
      'Invalid Scan': 'Block custody progression, request rescan and verify identity / parcel / location / timestamp / sequence.',
    };

    const category =
      ['Train Delay', 'Flood', 'Traffic', 'Vehicle Breakdown', 'Accident'].includes(input.type) ? 'Transport'
      : ['Hub Congestion', 'Wrong Hub'].includes(input.type) ? 'Hub'
      : ['Route Deviation', 'Invalid Scan'].includes(input.type) ? 'Security'
      : 'Parcel';

    const requiresApproval = !['Missing Parcel', 'Invalid Scan', 'Route Deviation'].includes(input.type);
    const incident: LogisticsIncident = {
      id: incidentId,
      type: input.type,
      category: category as LogisticsIncident['category'],
      occurredAt: input.occurredAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: input.location,
      severity,
      status: requiresApproval ? 'Pending Approval' : 'Analysing',
      createdBy: `${currentUser.name} (${userRole})`,
      details: input.details,
      transportType: input.transportType,
      affectedServiceId: input.affectedServiceId,
      affectedHubId: input.affectedHubId,
      shipmentId: input.shipmentId,
      affectedShipmentIds: affectedIds,
      recommendation: recommendationByType[input.type],
      decisionFactors: {
        etaImpact: affected.length ? `${affected.length} shipment(s) require ETA recalculation` : 'No assigned shipment matched yet',
        capacity: 'Check next available service / hub capacity before reroute',
        cost: 'Compare baseline vs alternate transport cost',
        security: input.type === 'Route Deviation' || input.type === 'Invalid Scan' || input.type === 'Missing Parcel' ? 'Elevated — evidence verification required' : 'Re-check custody when route changes',
        sla: affected.some((s) => s.priority === 'High-Value' || s.priority === 'Cold-Chain') ? 'Priority SLA at risk' : 'Assess against target arrival',
      },
      requiresApproval,
    };

    setIncidents((prev) => [incident, ...prev]);

    if (affectedIds.length) {
      setShipments((prev) => prev.map((s) => affectedIds.includes(s.id) ? {
        ...s,
        status: input.type === 'Route Deviation' || input.type === 'Invalid Scan' || input.type === 'Missing Parcel' ? 'Security Review' : 'Delayed',
        riskLevel: severity === 'Critical' ? 'Critical' : severity === 'High' ? 'High' : 'Medium',
        riskScore: severity === 'Critical' ? 95 : severity === 'High' ? 78 : 55,
        hasSecurityAlert: ['Route Deviation', 'Invalid Scan', 'Missing Parcel'].includes(input.type) || s.hasSecurityAlert,
        hasPendingApproval: requiresApproval,
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

    if (requiresApproval && affected[0]) {
      const s = affected[0];
      const recId = `REC-${Date.now().toString().slice(-4)}`;
      setRecommendations((prev) => [{
        id: recId,
        shipmentId: s.id,
        detectedEvent: `${input.type} at ${input.location}`,
        impact: `${affectedIds.length || 1} shipment(s) affected. ${input.details}`,
        recommendation: recommendationByType[input.type],
        reason: `Decision engine considered ETA, capacity, cost, security risk and SLA impact for ${s.id}.`,
        expectedResult: 'Restore a feasible route while preserving custody evidence and operational accountability.',
        expectedImprovementMins: 30,
        capacityStatus: 'Available',
        connectionTime: 'Feasible (45 min buffer at alternate transfer point)',
        securityRisk: input.type === 'Flood' || input.type === 'Accident' ? 'Medium' : 'Low',
        confidence: 88,
        targetService: input.affectedServiceId || 'Best Available Alternative',
        status: 'Pending Approval',
        timestamp: 'Now',
        evidence: [
          `Incident ${incidentId}: ${input.type}`,
          `Location: ${input.location}`,
          `Affected shipments: ${affectedIds.join(', ') || s.id}`,
          'Operational factors: ETA, capacity, cost, security and SLA',
        ],
        alternativesConsidered: [
          { name: 'Recommended Recovery Plan', eta: 'Best feasible ETA', cost: '+8%', risk: 'Low', capacity: 'Available', deadlineFeasible: true, score: 90 },
          { name: 'Hold / Wait Baseline', eta: 'Delayed', cost: 'Baseline', risk: 'High', capacity: 'Booked', deadlineFeasible: false, score: 42 },
          { name: 'Emergency Road / Alternate Hub', eta: 'Fallback', cost: '+28%', risk: 'Medium', capacity: 'Standby', deadlineFeasible: true, score: 70 },
        ],
      }, ...prev]);
    }

    setAgents((prev) => prev.map((a) => {
      if (a.name === 'Disruption Agent' && category === 'Transport') return { ...a, status: 'Analysing', anomalyDetected: true, currentTask: `${input.type}: impact analysis for ${affectedIds.length} shipment(s)` };
      if (a.name === 'Scheduling Agent' && requiresApproval) return { ...a, status: 'Analysing', currentTask: `Generating reroute options for ${incidentId}` };
      if (a.name === 'Route Risk Agent' && category === 'Security') return { ...a, status: 'Action Required', anomalyDetected: true, currentTask: `${input.type}: evidence verification required` };
      if (a.name === 'Trust / Handoff Agent' && (category === 'Parcel' || category === 'Hub')) return { ...a, status: 'Action Required', anomalyDetected: true, currentTask: `${input.type}: custody reconciliation in progress` };
      if (a.name === 'Decision Agent' && requiresApproval) return { ...a, status: 'Waiting for Approval', currentTask: `Incident ${incidentId} recovery plan awaiting manager` };
      return a;
    }));

    logAudit(
      currentUser.name,
      userRole,
      `Incident Registered: ${input.type} (${incidentId})`,
      `${input.details} | Location: ${input.location} | Affected: ${affectedIds.join(', ') || 'No current match'}`,
      recommendationByType[input.type],
      requiresApproval ? 'PENDING MANAGER APPROVAL' : 'INVESTIGATION STARTED',
      affectedIds.length ? `${affectedIds.length} shipment(s) flagged and routed to relevant agent workflow` : 'Incident stored; no currently assigned shipment matched',
      affectedIds[0]
    );
    showToast(`⚠️ ${input.type} incident created. ${affectedIds.length} shipment(s) affected.`);
  };

  const resolveIncident = (incidentId: string, resolution = 'Incident reviewed and operational recovery completed') => {
    if (!requireRole(['Logistics Operations Manager', 'Transport Coordinator', 'Hub Operator', 'Security / Risk Officer'], 'resolve incidents')) return;
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
    setIncidents([]);
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
