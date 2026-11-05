# Hub Operator Final Scope Update

This patch only changes Hub Operator scope/logic and the minimum shared data/routing needed to support it.

## Hub Operator now sees only the assigned hub
Assigned workspace: Johor Bahru Southern Region Hub (JHB-SRH).

### Dashboard — My Hub Today
- Incoming
- Awaiting Receiving
- Missing / Mismatch
- Handoff Review
- Sorting Queue
- Outgoing

### Shipments
Only shipments entering, currently at, or leaving the assigned hub.

### Live Tracking
Only transports / shipments relevant to the assigned hub. Other hubs appear only as route context.

### Hub Operations
1. Incoming Manifests
2. Receiving & Scan
3. Manifest Reconciliation
4. Missing / Unexpected / Wrong-Hub Exceptions
5. Custody Verification
6. Sorting / Outbound Preparation
7. Outgoing Handoff

Hub selection/filter was removed from the Hub Operator workflow. Transport/status filters remain meaningful local filters.

### Audit Trail
Only audit events involving the assigned hub or shipments handled by it.

### Mobile App
- Scan parcel
- Review handoff
- Request re-scan
- Report exception
- Accept custody

## Logic improvements
- Wrong-hub detection is based on the actual scan hub versus shipment route, instead of manually choosing an "actual hub".
- Missing parcels are calculated from expected manifest parcels versus actual received scans.
- Hub Operator no longer has Add Shipment permission. Shipment registration remains with Manager / Transport Coordinator / Administrator for the prototype.
- Added local receiving test data (MY315044 / FD-510) so missing-parcel reconciliation can be demonstrated meaningfully at Johor Hub.
