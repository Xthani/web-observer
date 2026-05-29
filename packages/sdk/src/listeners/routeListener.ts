import type { ObserverRuntime } from "../types";

type HistoryMethod = "pushState" | "replaceState";

const wrapHistoryMethod = (
  method: HistoryMethod,
  onRouteChange: () => void,
): (() => void) => {
  const originalMethod = window.history[method];

  window.history[method] = function patchedHistoryMethod(
    ...args: Parameters<History[HistoryMethod]>
  ) {
    const result = originalMethod.apply(this, args);
    onRouteChange();
    return result;
  };

  return () => {
    window.history[method] = originalMethod;
  };
};

export const attachRouteListener = (runtime: ObserverRuntime): (() => void) => {
  let currentRoute = window.location.href;

  const trackPageView = (): void => {
    const nextRoute = window.location.href;

    if (nextRoute === currentRoute) {
      return;
    }

    currentRoute = nextRoute;
    void runtime.track("page_view");
  };

  const restorePushState = wrapHistoryMethod("pushState", trackPageView);
  const restoreReplaceState = wrapHistoryMethod("replaceState", trackPageView);

  window.addEventListener("popstate", trackPageView);
  window.addEventListener("hashchange", trackPageView);

  return () => {
    restorePushState();
    restoreReplaceState();
    window.removeEventListener("popstate", trackPageView);
    window.removeEventListener("hashchange", trackPageView);
  };
};
