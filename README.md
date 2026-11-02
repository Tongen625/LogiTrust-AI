# LogiTrust AI — Secure Logistics & Digital Trust

Final integrated submission build based on **Agentic_AI-main**, with the confirmed lecturer scope and the missing functions merged in.

## Confirmed Scope

The platform covers logistics **Stages 3–7 only**:

1. Stage 3 — Origin Hub & Sorting
2. Stage 4 — Route & Intermodal Schedule Planning
3. Stage 5 — Transit Monitoring
4. Stage 6 — Destination Hub
5. Stage 7 — Last-Mile Dispatch

The **Trust / Handoff Agent ends at Stage 6 (Destination Hub)**. Stage 7 is operational dispatch tracking only.

AI agents included:

- Scheduling Agent
- Disruption Agent
- Route Risk Agent
- Trust / Handoff Agent
- Decision Agent

Removed from scope: Seller, Buyer, seller/buyer portals, Proof of Delivery and Delivery Verification Agent.

## Role Workspaces

There is **no sign-in page** in this submission build. Use the **top-right role selector** to switch directly between workspaces, like the original Agentic_AI-main interface.

Available roles:

- Logistics Operations Manager
- Transport Coordinator
- Security / Risk Officer
- Hub Operator
- Driver
- Administrator

Switching a role automatically opens that role's default page and changes the sidebar to only the functions relevant to that role. Action-level role checks are still enforced.

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


## Stage 7 operational scope
Stage 7 is limited to last-mile dispatch operations: assigned driver, vehicle, dispatch route, dispatch status and operational ETA. Recipient, OTP, signature, proof-of-delivery and Delivery Verification Agent functions are intentionally excluded.
