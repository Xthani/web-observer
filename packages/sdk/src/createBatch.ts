import { SDK_VERSION } from "./constants";
import { createId } from "./createId";
import type { ObserverBatch, ObserverEvent } from "./types";

export const createBatch = (
  appId: string,
  sessionId: string,
  events: ObserverEvent[],
): ObserverBatch => ({
  schemaVersion: "1.0",
  appId,
  sdkVersion: SDK_VERSION,
  batchId: createId("batch"),
  sessionId,
  createdAt: new Date().toISOString(),
  events,
});
