import type { ObserverInstance } from "../types";

const PANEL_ID = "web-observer-debug-panel";

export const mountDebugPanel = (
  observer: ObserverInstance,
  blockClass: string,
): (() => void) => {
  const existingPanel = document.getElementById(PANEL_ID);

  if (existingPanel) {
    existingPanel.remove();
  }

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = blockClass;
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

  let isCollapsed = false;

  const header = document.createElement("div");
  header.style.cssText =
    "display:flex;align-items:center;justify-content:space-between;gap:8px";

  const title = document.createElement("strong");
  title.textContent = "Web Observer";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.textContent = "Hide";
  toggleButton.setAttribute("aria-expanded", "true");

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

  for (const button of [toggleButton, flushButton, clearButton]) {
    button.style.cssText =
      "border:1px solid #374151;border-radius:6px;padding:5px 8px;cursor:pointer;background:#1f2937;color:#f9fafb";
  }

  header.append(title, toggleButton);
  actions.append(flushButton, clearButton);
  panel.append(header, stats, actions);
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

  const updateCollapsedState = (): void => {
    stats.style.display = isCollapsed ? "none" : "block";
    actions.style.display = isCollapsed ? "none" : "flex";
    panel.style.width = isCollapsed ? "150px" : "240px";
    panel.style.padding = isCollapsed ? "8px 10px" : "12px";
    toggleButton.textContent = isCollapsed ? "Show" : "Hide";
    toggleButton.setAttribute("aria-expanded", String(!isCollapsed));
  };

  toggleButton.addEventListener("click", () => {
    isCollapsed = !isCollapsed;
    updateCollapsedState();
  });
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
  updateCollapsedState();

  return () => {
    window.clearInterval(intervalId);
    panel.remove();
  };
};
