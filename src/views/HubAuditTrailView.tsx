import React, { useMemo, useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { getAssignedHub, shipmentTouchesHub } from '../utils/hubScope';
import { AuditLogEntry } from '../types/logistics';
import { FileText, Filter, Search } from 'lucide-react';

type EventFilter = 'All' | 'Arrival' | 'Receiving' | 'Reconciliation' | 'Handoff' | 'Sorting' | 'Dispatch' | 'Exception';
type ActorFilter = 'All' | 'Hub Operator' | 'Driver' | 'Scanner / Device';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

const compactHubName = (value?: string) => (value || '').replace(/\s*\([^)]*\)\s*$/g, '').trim();

const getEventType = (log: AuditLogEntry): Exclude<EventFilter, 'All'> => {
  const text = `${log.event} ${log.evidence} ${log.result}`.toLowerCase();

  if (text.includes('exception') || text.includes('missing') || text.includes('wrong hub') || text.includes('re-scan') || text.includes('flagged')) {
    return 'Exception';
  }
  if (text.includes('reconcil') || text.includes('manifest matched') || text.includes('manifest mismatch')) {
    return 'Reconciliation';
  }
  if (text.includes('handoff') || text.includes('custody')) {
    return 'Handoff';
  }
  if (text.includes('sorting') || text.includes('sorted')) {
    return 'Sorting';
  }
  if (text.includes('dispatch') || text.includes('departure') || text.includes('loaded')) {
    return 'Dispatch';
  }
  if (text.includes('arrival') || text.includes('arrived')) {
    return 'Arrival';
  }
  return 'Receiving';
};

const getActorType = (log: AuditLogEntry): Exclude<ActorFilter, 'All'> => {
  const actor = log.actor.toLowerCase();
  const role = log.role.toLowerCase();
  if (actor.includes('scanner') || actor.includes('device') || actor.includes('terminal')) return 'Scanner / Device';
  if (role.includes('driver') || actor.includes('driver')) return 'Driver';
  return 'Hub Operator';
};

const eventBadgeClass: Record<Exclude<EventFilter, 'All'>, string> = {
  Arrival: 'border-sky-200 bg-sky-50 text-sky-700',
  Receiving: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  Reconciliation: 'border-amber-200 bg-amber-50 text-amber-700',
  Handoff: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  Sorting: 'border-violet-200 bg-violet-50 text-violet-700',
  Dispatch: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Exception: 'border-rose-200 bg-rose-50 text-rose-700',
};

export const HubAuditTrailView: React.FC = () => {
  const { auditLogs, shipments, hubs, currentUser } = useLogistics();
  const hub = getAssignedHub(hubs, currentUser);

  const [query, setQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<EventFilter>('All');
  const [actorFilter, setActorFilter] = useState<ActorFilter>('All');

  const localShipmentIds = useMemo(() => {
    if (!hub) return new Set<string>();
    return new Set(shipments.filter((shipment) => shipmentTouchesHub(shipment, hub)).map((shipment) => shipment.id));
  }, [shipments, hub]);

  const localLogs = useMemo(() => {
    if (!hub) return [];

    const hubName = compactHubName(hub.name).toLowerCase();
    const hubCode = hub.code.toLowerCase();

    return auditLogs.filter((log) => {
      const combined = `${log.actor} ${log.role} ${log.event} ${log.evidence} ${log.result}`.toLowerCase();
      const isLocalOperationalActor =
        log.role === 'Hub Operator' ||
        combined.includes('receiving bay') ||
        combined.includes('outbound bay') ||
        combined.includes('hub scanner') ||
        combined.includes('rail receiving') ||
        combined.includes('jhb-srh') ||
        combined.includes(hubName) ||
        combined.includes(hubCode);

      const touchesLocalShipment = Boolean(log.shipmentId && localShipmentIds.has(log.shipmentId));
      const isSystemOnly = /scheduling agent|decision agent|disruption agent|route risk agent/i.test(log.actor);

      // A shipment may be relevant to this hub, but this audit page only shows events that actually happened at this hub.
      return !isSystemOnly && (isLocalOperationalActor || (touchesLocalShipment && combined.includes('hub')));
    });
  }, [auditLogs, hub, localShipmentIds]);

  const visibleLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return localLogs.filter((log) => {
      const eventType = getEventType(log);
      const actorType = getActorType(log);
      const matchesEvent = eventFilter === 'All' || eventType === eventFilter;
      const matchesActor = actorFilter === 'All' || actorType === actorFilter;
      const matchesQuery =
        !normalized ||
        `${log.timestamp} ${log.actor} ${log.event} ${log.evidence} ${log.result} ${log.shipmentId || ''}`
          .toLowerCase()
          .includes(normalized);

      return matchesEvent && matchesActor && matchesQuery;
    });
  }, [localLogs, query, eventFilter, actorFilter]);

  const counts = useMemo(() => {
    return localLogs.reduce(
      (acc, log) => {
        const type = getEventType(log);
        acc[type] += 1;
        return acc;
      },
      {
        Arrival: 0,
        Receiving: 0,
        Reconciliation: 0,
        Handoff: 0,
        Sorting: 0,
        Dispatch: 0,
        Exception: 0,
      } as Record<Exclude<EventFilter, 'All'>, number>
    );
  }, [localLogs]);

  if (!hub) {
    return <div className="p-6 text-rose-600 text-sm">Assigned hub could not be resolved.</div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 bg-slate-50 min-h-screen">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">My Hub Audit Trail</h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">{compactHubName(hub.name)} · Events recorded at this hub only</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {(Object.keys(counts) as Array<Exclude<EventFilter, 'All'>>).map((type) => (
          <button
            key={type}
            onClick={() => setEventFilter(type)}
            className={cx(
              'rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:border-slate-300',
              eventFilter === type && 'ring-2 ring-blue-100 border-blue-300'
            )}
          >
            <div className="text-xs text-slate-500">{type}</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{counts[type]}</div>
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shipment, parcel, load, actor or event"
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value as EventFilter)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="All">All event types</option>
              <option value="Arrival">Arrival</option>
              <option value="Receiving">Receiving</option>
              <option value="Reconciliation">Reconciliation</option>
              <option value="Handoff">Handoff</option>
              <option value="Sorting">Sorting</option>
              <option value="Dispatch">Dispatch</option>
              <option value="Exception">Exception</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value as ActorFilter)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="All">All local actors</option>
              <option value="Hub Operator">Hub Operator</option>
              <option value="Driver">Driver</option>
              <option value="Scanner / Device">Scanner / Device</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Type</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Event</th>
                <th className="p-4">Evidence</th>
                <th className="p-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleLogs.map((log) => {
                const eventType = getEventType(log);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-mono text-blue-700 whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4">
                      <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap', eventBadgeClass[eventType])}>
                        {eventType}
                      </span>
                    </td>
                    <td className="p-4 min-w-[180px]">
                      <div className="font-semibold text-slate-900">{log.actor}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{log.role}</div>
                    </td>
                    <td className="p-4 min-w-[220px]">
                      <div className="font-semibold text-slate-900">{log.event}</div>
                      {log.shipmentId && <div className="text-xs font-mono text-blue-600 mt-1">{log.shipmentId}</div>}
                    </td>
                    <td className="p-4 min-w-[300px] text-slate-600">{log.evidence}</td>
                    <td className="p-4 min-w-[260px] text-slate-700">{log.result}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleLogs.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-500">No local audit event matches the selected filters.</div>
        )}
      </div>
    </div>
  );
};
