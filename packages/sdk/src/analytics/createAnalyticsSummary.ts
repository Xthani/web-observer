import type {
  ObserverAnalyticsSummary,
  ObserverDropOffPoint,
  ObserverEvent,
  ObserverFlowSummary,
  ObserverEventType,
  ObserverLocalAggregates,
  ObserverPeriodComparison,
  ObserverProblemSignal,
  ObserverRoleBreakdown,
  ObserverTopEvent,
  ObserverTopRoute,
} from "../types";

const MEANINGFUL_FLOW_EVENT_TYPES = new Set<ObserverEventType>([
  "click",
  "change",
  "dead_click",
  "rage_click",
  "error",
]);

const increment = <T extends string>(
  map: Partial<Record<T, number>>,
  key: T,
): void => {
  map[key] = (map[key] ?? 0) + 1;
};

const getTopEntries = <T>(
  map: Map<string, T & { count: number }>,
  limit: number,
): Array<T & { count: number }> => {
  return [...map.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
};

const addTopEvent = (
  map: Map<string, ObserverTopEvent>,
  event: ObserverEvent,
): void => {
  const topEvent = map.get(event.eventKey);

  map.set(event.eventKey, {
    eventKey: event.eventKey,
    type: event.type,
    label: event.label,
    count: (topEvent?.count ?? 0) + 1,
  });
};

const getEventsBySession = (
  events: ObserverEvent[],
): Map<string, ObserverEvent[]> => {
  const eventsBySession = new Map<string, ObserverEvent[]>();

  for (const event of events) {
    const sessionEvents = eventsBySession.get(event.sessionId) ?? [];
    sessionEvents.push(event);
    eventsBySession.set(event.sessionId, sessionEvents);
  }

  return eventsBySession;
};

const createFlowSummaries = (
  eventsBySession: Map<string, ObserverEvent[]>,
): ObserverFlowSummary[] => {
  const flowMap = new Map<string, ObserverFlowSummary>();

  for (const sessionEvents of eventsBySession.values()) {
    const steps = sessionEvents
      .filter((event) => MEANINGFUL_FLOW_EVENT_TYPES.has(event.type))
      .map((event) => event.eventKey)
      .filter((eventKey, index, eventKeys) => {
        return index === 0 || eventKey !== eventKeys[index - 1];
      })
      .slice(0, 8);

    if (!steps.length) {
      continue;
    }

    const flowKey = steps.join(" -> ");
    const flow = flowMap.get(flowKey);

    flowMap.set(flowKey, {
      flowKey,
      steps,
      count: (flow?.count ?? 0) + 1,
    });
  }

  return getTopEntries(flowMap, 10);
};

const createDropOffs = (
  eventsBySession: Map<string, ObserverEvent[]>,
): ObserverDropOffPoint[] => {
  const dropOffMap = new Map<string, ObserverDropOffPoint>();

  for (const sessionEvents of eventsBySession.values()) {
    const meaningfulEvents = sessionEvents.filter((event) =>
      MEANINGFUL_FLOW_EVENT_TYPES.has(event.type),
    );
    const lastMeaningfulEvent =
      meaningfulEvents[meaningfulEvents.length - 1];

    if (!lastMeaningfulEvent) {
      continue;
    }

    const dropOff = dropOffMap.get(lastMeaningfulEvent.eventKey);
    dropOffMap.set(lastMeaningfulEvent.eventKey, {
      eventKey: lastMeaningfulEvent.eventKey,
      label: lastMeaningfulEvent.label,
      count: (dropOff?.count ?? 0) + 1,
    });
  }

  return getTopEntries(dropOffMap, 10);
};

const createRoleBreakdown = (
  events: ObserverEvent[],
): ObserverRoleBreakdown[] => {
  const roleMap = new Map<
    string,
    {
      events: number;
      sessions: Set<string>;
      topEventsMap: Map<string, ObserverTopEvent>;
    }
  >();

  for (const event of events) {
    const role = event.user?.role ?? "unknown";
    const roleData = roleMap.get(role) ?? {
      events: 0,
      sessions: new Set<string>(),
      topEventsMap: new Map<string, ObserverTopEvent>(),
    };

    roleData.events += 1;
    roleData.sessions.add(event.sessionId);
    addTopEvent(roleData.topEventsMap, event);
    roleMap.set(role, roleData);
  }

  return [...roleMap.entries()]
    .map(([role, roleData]) => ({
      role,
      events: roleData.events,
      sessions: roleData.sessions.size,
      topEvents: getTopEntries(roleData.topEventsMap, 5),
    }))
    .sort((left, right) => right.events - left.events);
};

const createPeriodComparison = (
  events: ObserverEvent[],
): ObserverPeriodComparison => {
  if (events.length < 2) {
    return {
      previousEvents: events.length,
      currentEvents: 0,
      eventTypeDelta: {},
    };
  }

  const firstTime = Date.parse(events[0].timestamp);
  const lastTime = Date.parse(events[events.length - 1].timestamp);
  const middleTime = firstTime + (lastTime - firstTime) / 2;
  const previousEventTypes: Partial<Record<ObserverEventType, number>> = {};
  const currentEventTypes: Partial<Record<ObserverEventType, number>> = {};
  let previousEvents = 0;
  let currentEvents = 0;

  for (const event of events) {
    const eventTime = Date.parse(event.timestamp);
    const targetMap =
      Number.isFinite(eventTime) && eventTime > middleTime
        ? currentEventTypes
        : previousEventTypes;

    if (targetMap === currentEventTypes) {
      currentEvents += 1;
    } else {
      previousEvents += 1;
    }

    increment(targetMap, event.type);
  }

  const eventTypes = new Set<ObserverEventType>([
    ...Object.keys(previousEventTypes),
    ...Object.keys(currentEventTypes),
  ] as ObserverEventType[]);
  const eventTypeDelta: Partial<Record<ObserverEventType, number>> = {};

  for (const eventType of eventTypes) {
    eventTypeDelta[eventType] =
      (currentEventTypes[eventType] ?? 0) -
      (previousEventTypes[eventType] ?? 0);
  }

  return {
    previousEvents,
    currentEvents,
    eventTypeDelta,
  };
};

const createLocalAggregates = (
  events: ObserverEvent[],
  eventsBySession: Map<string, ObserverEvent[]>,
): ObserverLocalAggregates => {
  const dayMap = new Map<
    string,
    {
      events: number;
      sessions: Set<string>;
      eventTypes: Partial<Record<ObserverEventType, number>>;
    }
  >();

  for (const event of events) {
    const date = event.timestamp.slice(0, 10);
    const dayData = dayMap.get(date) ?? {
      events: 0,
      sessions: new Set<string>(),
      eventTypes: {},
    };

    dayData.events += 1;
    dayData.sessions.add(event.sessionId);
    increment(dayData.eventTypes, event.type);
    dayMap.set(date, dayData);
  }

  return {
    byDay: [...dayMap.entries()].map(([date, dayData]) => ({
      date,
      events: dayData.events,
      sessions: dayData.sessions.size,
      eventTypes: dayData.eventTypes,
    })),
    bySession: [...eventsBySession.entries()].map(
      ([sessionId, sessionEvents]) => {
        const routes = [
          ...new Set(sessionEvents.map((event) => event.routePattern)),
        ];

        return {
          sessionId,
          events: sessionEvents.length,
          routes,
          startedAt: sessionEvents[0]?.timestamp,
          endedAt: sessionEvents[sessionEvents.length - 1]?.timestamp,
        };
      },
    ),
  };
};

export const createAnalyticsSummary = (
  events: ObserverEvent[],
): ObserverAnalyticsSummary => {
  const sortedEvents = events
    .slice()
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  const sessions = new Set<string>();
  const routes = new Set<string>();
  const eventTypes: Partial<Record<ObserverEventType, number>> = {};
  const topRoutesMap = new Map<string, ObserverTopRoute>();
  const topEventsMap = new Map<string, ObserverTopEvent>();
  const problemSignalsMap = new Map<string, ObserverProblemSignal>();
  const eventsBySession = getEventsBySession(sortedEvents);

  for (const event of sortedEvents) {
    sessions.add(event.sessionId);
    routes.add(event.routePattern);
    increment(eventTypes, event.type);

    const route = topRoutesMap.get(event.routePattern);
    topRoutesMap.set(event.routePattern, {
      routePattern: event.routePattern,
      count: (route?.count ?? 0) + 1,
    });

    addTopEvent(topEventsMap, event);

    if (
      event.type === "dead_click" ||
      event.type === "rage_click" ||
      event.type === "error"
    ) {
      const problemSignal = problemSignalsMap.get(event.eventKey);
      problemSignalsMap.set(event.eventKey, {
        type: event.type,
        eventKey: event.eventKey,
        label: event.label,
        count: (problemSignal?.count ?? 0) + 1,
      });
    }
  }

  return {
    appId: firstEvent?.appId ?? "unknown",
    period: {
      from: firstEvent?.timestamp,
      to: lastEvent?.timestamp,
    },
    totals: {
      events: events.length,
      sessions: sessions.size,
      routes: routes.size,
    },
    eventTypes,
    topRoutes: getTopEntries(topRoutesMap, 10),
    topEvents: getTopEntries(topEventsMap, 10),
    problemSignals: getTopEntries(problemSignalsMap, 10),
    flowSummaries: createFlowSummaries(eventsBySession),
    dropOffs: createDropOffs(eventsBySession),
    roleBreakdown: createRoleBreakdown(sortedEvents),
    periodComparison: createPeriodComparison(sortedEvents),
    localAggregates: createLocalAggregates(sortedEvents, eventsBySession),
  };
};
