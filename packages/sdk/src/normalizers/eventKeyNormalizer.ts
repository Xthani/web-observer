import type { ObserverElement, ObserverEventType } from "../types";

const sanitizePart = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
};

const getRoutePart = (routePattern: string): string => {
  const routeParts = routePattern
    .split("/")
    .filter((segment) => segment && !segment.startsWith(":"))
    .map(sanitizePart)
    .filter(Boolean);

  return routeParts.length ? routeParts.join(".") : "root";
};

const getElementPart = (element?: ObserverElement): string => {
  if (!element) {
    return "page";
  }

  const dataObserverMatch = element.selector.match(
    /data-observer-name="([^"]+)"/,
  );

  if (dataObserverMatch?.[1]) {
    return dataObserverMatch[1];
  }

  const testIdMatch = element.selector.match(/data-testid="([^"]+)"/);

  if (testIdMatch?.[1]) {
    return testIdMatch[1];
  }

  return element.label ?? element.type ?? element.tag;
};

export const createEventKey = (
  type: ObserverEventType,
  routePattern: string,
  element?: ObserverElement,
): string => {
  const routePart = getRoutePart(routePattern);
  const elementPart = getElementPart(element);

  return [routePart, sanitizePart(elementPart), type]
    .filter(Boolean)
    .join(".");
};

export const getEventConfidence = (element?: ObserverElement): number => {
  if (!element) {
    return 0.7;
  }

  if (element.label) {
    return 0.86;
  }

  if (element.selector.includes("data-testid")) {
    return 0.82;
  }

  return 0.55;
};
