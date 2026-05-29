import { createAnalyticsSummary } from "./analytics/createAnalyticsSummary";
import { normalizeConfig } from "./config";
import { createBatch } from "./createBatch";
import { createId } from "./createId";
import { exposeDebugApi } from "./debug/debugApi";
import { mountDebugPanel } from "./debug/debugPanel";
import { attachClickListener } from "./listeners/clickListener";
import { attachErrorListener } from "./listeners/errorListener";
import { attachInputListener } from "./listeners/inputListener";
import { attachRouteListener } from "./listeners/routeListener";
import {
  getEventConfidence,
  createEventKey,
} from "./normalizers/eventKeyNormalizer";
import {
  getCurrentRoute,
  normalizeRoutePattern,
} from "./normalizers/routeNormalizer";
import { normalizeElement } from "./normalizers/elementNormalizer";
import { getSessionId } from "./session";
import { IndexedDbStorage } from "./storage/indexedDbStorage";
import { sendBatch } from "./transport/batchTransport";
import type {
  ObserverBatch,
  ObserverConfig,
  ObserverEvent,
  ObserverEventType,
  ObserverFlushOptions,
  ObserverInstance,
  ObserverRuntime,
} from "./types";

let activeObserver: ObserverInstance | null = null;

export const initObserver = (config: ObserverConfig): ObserverInstance => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Web Observer: initObserver can run only in a browser.");
  }

  activeObserver?.destroy();

  const normalizedConfig = normalizeConfig(config);
  const storage = new IndexedDbStorage();
  const sessionId = getSessionId(normalizedConfig.appId);
  const cleanupCallbacks: Array<() => void> = [];

  const track = async (
    type: ObserverEventType,
    payload?: Record<string, unknown>,
    target?: Element,
  ): Promise<ObserverEvent> => {
    const element = target
      ? normalizeElement(target, normalizedConfig.privacy.maskTextSelectors)
      : undefined;
    const route = getCurrentRoute();
    const routePattern =
      normalizedConfig.routing.getRoutePattern?.(route) ??
      normalizeRoutePattern(route);
    const event: ObserverEvent = {
      eventId: createId("evt"),
      appId: normalizedConfig.appId,
      sessionId,
      user: normalizedConfig.user,
      type,
      route,
      routePattern,
      eventKey: createEventKey(type, routePattern, element),
      label: element?.label,
      confidence: getEventConfidence(element),
      element,
      payload,
      timestamp: new Date().toISOString(),
    };

    await storage.addEvent({ ...event, status: "pending" });

    if (normalizedConfig.debug.logEvents) {
      console.info("[web-observer]", event);
    }

    return event;
  };

  const runtime: ObserverRuntime = {
    config: normalizedConfig,
    sessionId,
    track,
  };

  const observer: ObserverInstance = {
    trackEvent: (type, payload) => track(type, payload),

    flush: async (options: ObserverFlushOptions = {}) => {
      const pendingEvents = await storage.getPendingEvents(
        normalizedConfig.flushPolicy.maxBatchSize,
      );

      if (!pendingEvents.length) {
        return null;
      }

      const events = pendingEvents.map<ObserverEvent>(
        ({ status: _status, ...event }) => event,
      );
      const batch = createBatch(
        normalizedConfig.appId,
        sessionId,
        events,
      );
      const sent = await sendBatch(
        batch,
        normalizedConfig.transport,
        options,
      );

      if (sent) {
        await storage.markEventsAsSent(
          pendingEvents.map((event) => event.eventId),
        );

        if (normalizedConfig.storagePolicy.cleanupSentEvents) {
          await storage.cleanupSentEvents(normalizedConfig.storagePolicy);
        }
      }

      return batch;
    },

    getLocalStats: () => storage.getStats(),

    getAnalyticsSummary: async () => {
      const events = await storage.getEvents();

      return createAnalyticsSummary(
        events.map<ObserverEvent>(({ status: _status, ...event }) => event),
      );
    },

    getPendingBatches: async () => {
      const pendingEvents = await storage.getPendingEvents(
        normalizedConfig.flushPolicy.maxBatchSize,
      );

      if (!pendingEvents.length) {
        return [];
      }

      return [
        createBatch(
          normalizedConfig.appId,
          sessionId,
          pendingEvents.map<ObserverEvent>(
            ({ status: _status, ...event }) => event,
          ),
        ),
      ];
    },

    clearLocalData: () => storage.clear(),

    destroy: () => {
      for (const cleanup of cleanupCallbacks) {
        cleanup();
      }

      activeObserver = null;
    },
  };

  cleanupCallbacks.push(attachClickListener(runtime));
  cleanupCallbacks.push(attachInputListener(runtime));
  cleanupCallbacks.push(attachRouteListener(runtime));
  cleanupCallbacks.push(attachErrorListener(runtime));

  const flushTimerId = window.setInterval(
    () => {
      void observer.flush().catch((error: unknown) => {
        if (normalizedConfig.debug.logEvents) {
          console.warn("[web-observer] flush failed", error);
        }
      });
    },
    normalizedConfig.flushPolicy.intervalMs,
  );

  cleanupCallbacks.push(() => window.clearInterval(flushTimerId));

  const flushBeforeLeave = (): void => {
    void observer.flush({ preferBeacon: true }).catch(() => undefined);
  };
  const flushOnVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      flushBeforeLeave();
    }
  };

  window.addEventListener("pagehide", flushBeforeLeave);
  document.addEventListener("visibilitychange", flushOnVisibilityChange);

  cleanupCallbacks.push(() => {
    window.removeEventListener("pagehide", flushBeforeLeave);
    document.removeEventListener("visibilitychange", flushOnVisibilityChange);
  });

  if (normalizedConfig.debug.exposeWindowApi) {
    cleanupCallbacks.push(exposeDebugApi(observer, storage));
  }

  if (normalizedConfig.debug.showPanel) {
    cleanupCallbacks.push(mountDebugPanel(observer));
  }

  void track("page_view");

  activeObserver = observer;

  return observer;
};

export const destroyObserver = (): void => {
  activeObserver?.destroy();
};
