import {
  createElementSelector,
  isFormFieldElement,
  shouldIgnoreElement,
} from "../normalizers/elementNormalizer";
import type { ObserverEventType, ObserverRuntime } from "../types";

const TRACKED_EVENTS: ObserverEventType[] = ["input", "focus", "change"];
const INPUT_DEBOUNCE_MS = 600;

export const attachInputListener = (runtime: ObserverRuntime): (() => void) => {
  const inputTimers = new Map<string, number>();

  const handleEvent = (event: Event): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (
      shouldIgnoreElement(target, [
        ...runtime.config.privacy.excludeSelectors,
        ...runtime.config.privacy.blockSelectors,
        ...runtime.config.uiAdapters.blockSelectors,
        `.${runtime.config.privacy.blockClass}`,
      ])
    ) {
      return;
    }

    if (!isFormFieldElement(target)) {
      return;
    }

    if (event.type !== "input") {
      void runtime.track(event.type as ObserverEventType, undefined, target);
      return;
    }

    const selector = createElementSelector(target);
    const existingTimerId = inputTimers.get(selector);

    if (existingTimerId) {
      window.clearTimeout(existingTimerId);
    }

    const timerId = window.setTimeout(() => {
      inputTimers.delete(selector);
      void runtime.track("input", undefined, target);
    }, INPUT_DEBOUNCE_MS);

    inputTimers.set(selector, timerId);
  };

  for (const eventName of TRACKED_EVENTS) {
    document.addEventListener(eventName, handleEvent, true);
  }

  return () => {
    for (const timerId of inputTimers.values()) {
      window.clearTimeout(timerId);
    }

    inputTimers.clear();

    for (const eventName of TRACKED_EVENTS) {
      document.removeEventListener(eventName, handleEvent, true);
    }
  };
};
