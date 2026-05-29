import {
  DB_NAME,
  DB_VERSION,
  EVENTS_STORE,
} from "../constants";
import type {
  ObserverLocalStats,
  ObserverStoragePolicy,
  StoredObserverEvent,
} from "../types";

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(EVENTS_STORE)) {
        const store = database.createObjectStore(EVENTS_STORE, {
          keyPath: "eventId",
        });

        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const runStoreRequest = <T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(EVENTS_STORE, mode);
        const store = transaction.objectStore(EVENTS_STORE);
        const request = callback(store);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
          database.close();
          reject(transaction.error);
        };
      }),
  );
};

export class IndexedDbStorage {
  async addEvent(event: StoredObserverEvent): Promise<void> {
    await runStoreRequest("readwrite", (store) => store.add(event));
  }

  getEvents(): Promise<StoredObserverEvent[]> {
    return runStoreRequest("readonly", (store) => store.getAll());
  }

  async getPendingEvents(limit: number): Promise<StoredObserverEvent[]> {
    const events = await this.getEvents();

    return events
      .filter((event) => event.status === "pending")
      .sort((left, right) =>
        left.timestamp.localeCompare(right.timestamp),
      )
      .slice(0, limit);
  }

  async markEventsAsSent(eventIds: string[]): Promise<void> {
    const events = await this.getEvents();
    const ids = new Set(eventIds);

    await Promise.all(
      events
        .filter((event) => ids.has(event.eventId))
        .map((event) =>
          runStoreRequest("readwrite", (store) =>
            store.put({ ...event, status: "sent" }),
          ),
        ),
    );
  }

  async clear(): Promise<void> {
    await runStoreRequest("readwrite", (store) => store.clear());
  }

  async cleanupSentEvents(policy: Required<ObserverStoragePolicy>): Promise<void> {
    const events = await this.getEvents();
    const sentEvents = events
      .filter((event) => event.status === "sent")
      .sort((left, right) =>
        left.timestamp.localeCompare(right.timestamp),
      );
    const now = Date.now();
    const expiredEventIds = sentEvents
      .filter((event) => {
        const eventTime = Date.parse(event.timestamp);

        return Number.isFinite(eventTime)
          ? now - eventTime > policy.sentEventTtlMs
          : false;
      })
      .map((event) => event.eventId);
    const overflowEventIds =
      sentEvents.length > policy.maxSentEvents
        ? sentEvents
            .slice(0, sentEvents.length - policy.maxSentEvents)
            .map((event) => event.eventId)
        : [];
    const eventIdsToDelete = [...new Set([
      ...expiredEventIds,
      ...overflowEventIds,
    ])];

    await Promise.all(
      eventIdsToDelete.map((eventId) =>
        runStoreRequest("readwrite", (store) => store.delete(eventId)),
      ),
    );
  }

  async getStats(): Promise<ObserverLocalStats> {
    const events = await this.getEvents();
    const lastEvent = events
      .slice()
      .sort((left, right) =>
        right.timestamp.localeCompare(left.timestamp),
      )[0];

    return {
      totalEvents: events.length,
      pendingEvents: events.filter((event) => event.status === "pending")
        .length,
      sentEvents: events.filter((event) => event.status === "sent").length,
      lastEventAt: lastEvent?.timestamp,
    };
  }
}
