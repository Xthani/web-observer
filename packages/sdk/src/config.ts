import {
  DEFAULT_FLUSH_INTERVAL_MS,
  DEFAULT_MAX_BATCH_SIZE,
  DEFAULT_MAX_SENT_EVENTS,
  DEFAULT_SENT_EVENT_TTL_MS,
} from "./constants";
import type { ObserverConfig, RequiredObserverConfig } from "./types";

export const normalizeConfig = (
  config: ObserverConfig,
): RequiredObserverConfig => {
  if (!config.appId.trim()) {
    throw new Error("Web Observer: appId is required.");
  }

  return {
    ...config,
    mode: config.mode ?? "silent",
    flushPolicy: {
      intervalMs:
        config.flushPolicy?.intervalMs ?? DEFAULT_FLUSH_INTERVAL_MS,
      maxBatchSize:
        config.flushPolicy?.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE,
    },
    storagePolicy: {
      cleanupSentEvents:
        config.storagePolicy?.cleanupSentEvents ?? true,
      sentEventTtlMs:
        config.storagePolicy?.sentEventTtlMs ?? DEFAULT_SENT_EVENT_TTL_MS,
      maxSentEvents:
        config.storagePolicy?.maxSentEvents ?? DEFAULT_MAX_SENT_EVENTS,
    },
    routing: {
      getRoutePattern: config.routing?.getRoutePattern,
    },
    uiAdapters: {
      interactiveSelectors: config.uiAdapters?.interactiveSelectors ?? [],
      blockSelectors: config.uiAdapters?.blockSelectors ?? [],
    },
    debug: {
      logEvents: config.debug?.logEvents ?? config.mode === "debug",
      exposeWindowApi:
        config.debug?.exposeWindowApi ?? config.mode === "debug",
      showPanel: config.debug?.showPanel ?? false,
    },
    privacy: {
      excludeSelectors: config.privacy?.excludeSelectors ?? [],
      maskTextSelectors: config.privacy?.maskTextSelectors ?? [],
      blockSelectors: config.privacy?.blockSelectors ?? [],
      blockClass: config.privacy?.blockClass ?? "observer-block",
    },
  };
};
