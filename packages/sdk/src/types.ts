export type ObserverMode = "silent" | "debug";

export type ObserverEventType =
  | "page_view"
  | "click"
  | "dead_click"
  | "rage_click"
  | "input"
  | "focus"
  | "change"
  | "error";

export interface ObserverUser {
  id?: string;
  role?: string;
  anonymousId?: string;
}

export interface ObserverTransport {
  endpoint?: string;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  retry?: {
    attempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  };
  send?: (batch: ObserverBatch) => Promise<void>;
}

export interface ObserverFlushPolicy {
  intervalMs?: number;
  maxBatchSize?: number;
}

export interface ObserverStoragePolicy {
  cleanupSentEvents?: boolean;
  sentEventTtlMs?: number;
  maxSentEvents?: number;
}

export interface ObserverRoutingOptions {
  getRoutePattern?: (route: string) => string | undefined;
}

export interface ObserverUiAdapters {
  interactiveSelectors?: string[];
  blockSelectors?: string[];
}

export interface ObserverDebugOptions {
  logEvents?: boolean;
  exposeWindowApi?: boolean;
  showPanel?: boolean;
}

export interface ObserverPrivacyOptions {
  excludeSelectors?: string[];
  maskTextSelectors?: string[];
  blockSelectors?: string[];
  blockClass?: string;
}

export interface ObserverConfig {
  appId: string;
  mode?: ObserverMode;
  user?: ObserverUser;
  transport?: ObserverTransport;
  flushPolicy?: ObserverFlushPolicy;
  storagePolicy?: ObserverStoragePolicy;
  routing?: ObserverRoutingOptions;
  uiAdapters?: ObserverUiAdapters;
  debug?: ObserverDebugOptions;
  privacy?: ObserverPrivacyOptions;
}

export interface ObserverElement {
  tag: string;
  type?: string;
  label?: string;
  selector: string;
}

export interface ObserverEvent {
  eventId: string;
  appId: string;
  sessionId: string;
  user?: ObserverUser;
  type: ObserverEventType;
  route: string;
  routePattern: string;
  eventKey: string;
  label?: string;
  confidence: number;
  element?: ObserverElement;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface StoredObserverEvent extends ObserverEvent {
  status: "pending" | "sent";
}

export interface ObserverBatch {
  schemaVersion: "1.0";
  appId: string;
  sdkVersion: string;
  batchId: string;
  sessionId: string;
  createdAt: string;
  events: ObserverEvent[];
}

export interface ObserverTopRoute {
  routePattern: string;
  count: number;
}

export interface ObserverTopEvent {
  eventKey: string;
  type: ObserverEventType;
  count: number;
  label?: string;
}

export interface ObserverFlowSummary {
  flowKey: string;
  count: number;
  steps: string[];
}

export interface ObserverDropOffPoint {
  eventKey: string;
  count: number;
  label?: string;
}

export interface ObserverRoleBreakdown {
  role: string;
  events: number;
  sessions: number;
  topEvents: ObserverTopEvent[];
}

export interface ObserverPeriodComparison {
  previousEvents: number;
  currentEvents: number;
  eventTypeDelta: Partial<Record<ObserverEventType, number>>;
}

export interface ObserverDailyAggregate {
  date: string;
  events: number;
  sessions: number;
  eventTypes: Partial<Record<ObserverEventType, number>>;
}

export interface ObserverSessionAggregate {
  sessionId: string;
  events: number;
  routes: string[];
  startedAt?: string;
  endedAt?: string;
}

export interface ObserverLocalAggregates {
  byDay: ObserverDailyAggregate[];
  bySession: ObserverSessionAggregate[];
}

export interface ObserverProblemSignal {
  type: "dead_click" | "rage_click" | "error";
  eventKey: string;
  count: number;
  label?: string;
}

export interface ObserverAnalyticsSummary {
  appId: string;
  period: {
    from?: string;
    to?: string;
  };
  totals: {
    events: number;
    sessions: number;
    routes: number;
  };
  eventTypes: Partial<Record<ObserverEventType, number>>;
  topRoutes: ObserverTopRoute[];
  topEvents: ObserverTopEvent[];
  problemSignals: ObserverProblemSignal[];
  flowSummaries: ObserverFlowSummary[];
  dropOffs: ObserverDropOffPoint[];
  roleBreakdown: ObserverRoleBreakdown[];
  periodComparison: ObserverPeriodComparison;
  localAggregates: ObserverLocalAggregates;
}

export interface ObserverLocalStats {
  totalEvents: number;
  pendingEvents: number;
  sentEvents: number;
  lastEventAt?: string;
}

export interface ObserverInstance {
  trackEvent: (
    type: ObserverEventType,
    payload?: Record<string, unknown>,
  ) => Promise<ObserverEvent>;
  flush: (options?: ObserverFlushOptions) => Promise<ObserverBatch | null>;
  getLocalStats: () => Promise<ObserverLocalStats>;
  getAnalyticsSummary: () => Promise<ObserverAnalyticsSummary>;
  getPendingBatches: () => Promise<ObserverBatch[]>;
  clearLocalData: () => Promise<void>;
  destroy: () => void;
}

export interface ObserverFlushOptions {
  preferBeacon?: boolean;
}

export interface ObserverRuntime {
  config: RequiredObserverConfig;
  sessionId: string;
  track: (
    type: ObserverEventType,
    payload?: Record<string, unknown>,
    element?: Element,
  ) => Promise<ObserverEvent>;
}

export interface RequiredObserverConfig extends ObserverConfig {
  mode: ObserverMode;
  flushPolicy: Required<ObserverFlushPolicy>;
  storagePolicy: Required<ObserverStoragePolicy>;
  routing: ObserverRoutingOptions;
  uiAdapters: Required<ObserverUiAdapters>;
  debug: Required<ObserverDebugOptions>;
  privacy: Required<ObserverPrivacyOptions>;
}

declare global {
  interface Window {
    __WEB_OBSERVER__?: {
      getEvents: () => Promise<StoredObserverEvent[]>;
      getSummary: () => Promise<ObserverAnalyticsSummary>;
      getBatches: () => Promise<ObserverBatch[]>;
      flush: (options?: ObserverFlushOptions) => Promise<ObserverBatch | null>;
      clear: () => Promise<void>;
    };
  }
}
