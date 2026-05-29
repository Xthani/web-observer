import type { ObserverRuntime } from "../types";

export const attachErrorListener = (runtime: ObserverRuntime): (() => void) => {
  const handleError = (event: ErrorEvent): void => {
    void runtime.track("error", {
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    void runtime.track("error", {
      message:
        event.reason instanceof Error
          ? event.reason.message
          : String(event.reason),
      source: "unhandledrejection",
    });
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener(
      "unhandledrejection",
      handleUnhandledRejection,
    );
  };
};
