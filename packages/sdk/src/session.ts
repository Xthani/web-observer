import { SESSION_STORAGE_KEY_PREFIX } from "./constants";
import { createId } from "./createId";

export const getSessionId = (appId: string): string => {
  const storageKey = `${SESSION_STORAGE_KEY_PREFIX}:${appId}`;

  try {
    const existingSessionId = window.sessionStorage.getItem(storageKey);

    if (existingSessionId) {
      return existingSessionId;
    }

    const sessionId = createId("session");
    window.sessionStorage.setItem(storageKey, sessionId);

    return sessionId;
  } catch {
    return createId("session");
  }
};
