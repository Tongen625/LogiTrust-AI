import React, { createContext, useContext, useState } from 'react';
import {
  AIAgent,
  AuditLogEntry,
  HubHandoffVerification,
  HubLocation,
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
  INITIAL_HANDOFFS,
  INITIAL_SECURITY_ALERTS,
  INITIAL_SHIPMENTS,
  INITIAL_TRAIN_SCHEDULES,
  MALAYSIA_HUBS,
  USER_PROFILES,
  WHAT_IF_SCENARIOS,
} from '../data/mockData';

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

  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('MY102938');
  const [hubs] = useState<HubLocation[]>(MALAYSIA_HUBS);
  const [agents, setAgents] = useState<AIAgent[]>(INITIAL_AI_AGENTS);
  const [trainSchedules, setTrainSchedules] = useState<TrainSchedule[]>(INITIAL_TRAIN_SCHEDULES);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(INITIAL_SECURITY_ALERTS);
  const [handoffs, setHandoffs] = useState<HubHandoffVerification[]>(INITIAL_HANDOFFS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
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
      impact: 'Estimated arrival at KL Central Destination Hub pushed from 14:30 to 16:00. High risk of missing intermodal connection window (15:30).',
      recommendation: 'Transfer shipment MY102938 to Train T108.',
      reason: 'T108 departs 35 minutes later (11:05) but operates on priority express slot, arriving at destination hub at 14:10—recovering 74 minutes.',
      expectedResult: 'Destination arrival improved by 74 minutes (New Arrival: 14:10 vs 16:00 delayed). Destination Hub transfer SLA preserved.',
      expectedImprovementMins: 74,
      capacityStatus: 'Available (46% unallocated carriage space)',
      connectionTime: 'Feasible (45 min buffer at Johor Hub Bay 4)',
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
      `Vehicle V-889 GPS: 3.4682°N, 101.7381°E (Batang Kali Bypass) | Corridor tolerance: 3.0 km`,
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
          return {
            ...s,
            status: 'Route & Schedule Planning',
            assignedVehicleOrTrain: 'Train T108',
            eta: '14:10 (Recovered)',
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
                    location: 'Johor Rail Terminal (Bay 4)',
                    notes: 'Re-allocated to Train T108 by Operations Manager. Carriage manifest locked.',
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
      `AI Recommendation Approved: Re-allocate to Train T108`,
      `Verified Train T108 capacity (54% load) & 45m hub transfer window. Notes: ${notes}`,
      'AI Recommendation REC-1029: Transfer MY102938 from T105 to T108',
      'APPROVED',
      'Shipment MY102938 assigned to Train T108. Arrival improved by 74 min (14:10). Destination Hub transfer SLA preserved.',
      rec.shipmentId
    );

    showToast(`✅ Human Approval Recorded: Shipment ${rec.shipmentId} transferred to Train T108! Arrival recovered to 14:10.`);
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
      route: newSchedule.route || 'Johor Bahru (JHB) → Kuala Lumpur (KUL)',
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

  const resetAllData = () => {
    setShipments(INITIAL_SHIPMENTS);
    setSelectedShipmentId('MY102938');
    setAgents(INITIAL_AI_AGENTS);
    setTrainSchedules(INITIAL_TRAIN_SCHEDULES);
    setSecurityAlerts(INITIAL_SECURITY_ALERTS);
    setHandoffs(INITIAL_HANDOFFS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
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
