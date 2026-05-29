import type {
  ObserverBatch,
  ObserverFlushOptions,
  ObserverTransport,
} from "../types";

const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
const DEFAULT_RETRY_MAX_DELAY_MS = 5_000;

const wait = (delayMs: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
};

const sendWithBeacon = (
  batch: ObserverBatch,
  transport: ObserverTransport,
): boolean => {
  if (!transport.endpoint || !navigator.sendBeacon) {
    return false;
  }

  const body = new Blob([JSON.stringify(batch)], {
    type: "application/json",
  });

  return navigator.sendBeacon(transport.endpoint, body);
};

const sendWithFetch = async (
  batch: ObserverBatch,
  transport: ObserverTransport,
): Promise<void> => {
  const response = await fetch(transport.endpoint ?? "", {
    method: transport.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...transport.headers,
    },
    credentials: transport.credentials,
    keepalive: true,
    body: JSON.stringify(batch),
  });

  if (!response.ok) {
    throw new Error(
      `Web Observer: batch transport failed with ${response.status}.`,
    );
  }
};

export const sendBatch = async (
  batch: ObserverBatch,
  transport?: ObserverTransport,
  options: ObserverFlushOptions = {},
): Promise<boolean> => {
  if (!transport) {
    return false;
  }

  if (transport.send) {
    await transport.send(batch);
    return true;
  }

  if (!transport.endpoint) {
    return false;
  }

  if (options.preferBeacon && sendWithBeacon(batch, transport)) {
    return true;
  }

  const attempts = transport.retry?.attempts ?? DEFAULT_RETRY_ATTEMPTS;
  const baseDelayMs =
    transport.retry?.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const maxDelayMs =
    transport.retry?.maxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      await sendWithFetch(batch, transport);
      return true;
    } catch (error) {
      if (attempt >= attempts) {
        throw error;
      }

      await wait(Math.min(baseDelayMs * 2 ** attempt, maxDelayMs));
    }
  }

  return false;
};
