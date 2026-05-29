import type { IndexedDbStorage } from "../storage/indexedDbStorage";
import type { ObserverInstance } from "../types";

export const exposeDebugApi = (
  observer: ObserverInstance,
  storage: IndexedDbStorage,
): (() => void) => {
  window.__WEB_OBSERVER__ = {
    getEvents: () => storage.getEvents(),
    getSummary: () => observer.getAnalyticsSummary(),
    getBatches: () => observer.getPendingBatches(),
    flush: () => observer.flush(),
    clear: () => observer.clearLocalData(),
  };

  return () => {
    delete window.__WEB_OBSERVER__;
  };
};
