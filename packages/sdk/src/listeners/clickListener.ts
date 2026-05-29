import {
  createElementSelector,
  getClosestInteractiveElement,
  isFormFieldElement,
  shouldIgnoreElement,
} from "../normalizers/elementNormalizer";
import type { ObserverRuntime } from "../types";

const RAGE_CLICK_COUNT = 3;
const RAGE_CLICK_WINDOW_MS = 1_000;
const RAGE_CLICK_COOLDOWN_MS = 2_000;

interface RecentClick {
  selector: string;
  timestamp: number;
}

export const attachClickListener = (runtime: ObserverRuntime): (() => void) => {
  let recentClicks: RecentClick[] = [];
  const lastRageClickBySelector = new Map<string, number>();

  const handleClick = (event: MouseEvent): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (event.button !== 0 || window.getSelection()?.toString()) {
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

    const interactiveElement = getClosestInteractiveElement(
      target,
      runtime.config.uiAdapters.interactiveSelectors,
    );
    const trackedElement = interactiveElement ?? target;
    const selector = createElementSelector(trackedElement);
    const now = Date.now();

    recentClicks = recentClicks.filter(
      (click) => now - click.timestamp <= RAGE_CLICK_WINDOW_MS,
    );
    recentClicks.push({ selector, timestamp: now });

    const sameTargetClicks = recentClicks.filter(
      (click) => click.selector === selector,
    ).length;
    const lastRageClickAt = lastRageClickBySelector.get(selector) ?? 0;
    const isRageClickInCooldown =
      now - lastRageClickAt <= RAGE_CLICK_COOLDOWN_MS;

    if (sameTargetClicks >= RAGE_CLICK_COUNT && !isRageClickInCooldown) {
      lastRageClickBySelector.set(selector, now);

      void runtime.track(
        "rage_click",
        { count: sameTargetClicks },
        trackedElement,
      );
      return;
    }

    if (isRageClickInCooldown) {
      return;
    }

    if (!interactiveElement) {
      void runtime.track(
        "dead_click",
        {
          x: event.clientX,
          y: event.clientY,
        },
        target,
      );
      return;
    }

    if (isFormFieldElement(interactiveElement)) {
      return;
    }

    void runtime.track("click", undefined, interactiveElement);
  };

  document.addEventListener("click", handleClick, true);

  return () => {
    document.removeEventListener("click", handleClick, true);
  };
};
