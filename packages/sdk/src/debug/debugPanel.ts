import type { ObserverInstance } from "../types";

const PANEL_ID = "web-observer-debug-panel";

export const mountDebugPanel = (
  observer: ObserverInstance,
): (() => void) => {
  const existingPanel = document.getElementById(PANEL_ID);

  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText = [
    "position:fixed",
    "right:12px",
    "bottom:12px",
    "z-index:2147483647",
    "width:240px",
    "padding:12px",
    "border-radius:10px",
    "background:#111827",
    "color:#f9fafb",
    "font:12px/1.4 system-ui,sans-serif",
    "box-shadow:0 10px 30px rgba(0,0,0,.35)",
  ].join(";");

  const title = document.createElement("strong");
  title.textContent = "Web Observer";

  const stats = document.createElement("pre");
  stats.style.cssText = "margin:8px 0;white-space:pre-wrap;color:#d1d5db";
  stats.textContent = "Loading...";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";

  const flushButton = document.createElement("button");
  flushButton.type = "button";
  flushButton.textContent = "Flush";

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.textContent = "Clear";

  for (const button of [flushButton, clearButton]) {
    button.style.cssText =
      "border:0;border-radius:6px;padding:5px 8px;cursor:pointer";
  }

  actions.append(flushButton, clearButton);
  panel.append(title, stats, actions);
  document.body.append(panel);

  const updateStats = async (): Promise<void> => {
    const localStats = await observer.getLocalStats();
    stats.textContent = [
      `Events: ${localStats.totalEvents}`,
      `Pending: ${localStats.pendingEvents}`,
      `Sent: ${localStats.sentEvents}`,
      `Last: ${localStats.lastEventAt ?? "never"}`,
    ].join("\n");
  };

  flushButton.addEventListener("click", () => {
    void observer.flush().then(updateStats);
  });
  clearButton.addEventListener("click", () => {
    void observer.clearLocalData().then(updateStats);
  });

  const intervalId = window.setInterval(() => {
    void updateStats();
  }, 1_000);

  void updateStats();

  return () => {
    window.clearInterval(intervalId);
    panel.remove();
  };
};
