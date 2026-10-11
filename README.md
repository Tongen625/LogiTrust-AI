# LogiTrust AI — Secure Logistics & Digital Trust

## Main Functions

- Operations Dashboard
- AI Logistics Control Tower
- Internal Shipment Management
- Dedicated Live Tracking page
- Route & Intermodal Schedule Planning
- Manual train timetable/service entry
- Manual rail-provider status update: On Time / Delayed / Departed / Cancelled
- Delay minutes and AI shipment-impact recalculation
- AI alternatives and what-if analysis
- Human approval for consequential rerouting
- Route anomaly and digital-trust investigation
- Hub handoff five-point verification through Destination Hub
- Driver handoff evidence submission for Hub Operator verification
- Audit Trail
- Administrator RBAC / governance view

## Role Responsibilities

- **Operations Manager:** AI Control Tower, shipment/network oversight, schedules read-only, AI approval/rejection.
- **Transport Coordinator:** train timetable entry, provider status/delay updates, route/intermodal planning.
- **Security / Risk Officer:** route/security anomaly investigation, verification requests, escalation and resolution.
- **Hub Operator:** custody evidence review and handoff verification through Destination Hub.
- **Driver:** mobile operations, movement updates, incident reports and handoff evidence submission; cannot self-verify a handoff.
- **Administrator:** RBAC/governance and audit oversight.

## Railway Integration Fallback

If an external railway-provider system is unavailable or not integrated, the **Transport Coordinator can manually add train times and update train status**. Delay updates trigger the disruption/scheduling workflow for affected shipments and create an audit record.

## Run

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:3000
```

Optional production build:

```bash
npm run build
```

## Data Note

This project uses synthetic operational data and front-end state for evaluation. It does not claim a live KTM/railway or logistics-provider integration.
