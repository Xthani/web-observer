import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initObserver } from "@web-observer/sdk";
import "./styles.css";

initObserver({
  appId: "react-demo",
  mode: "debug",
  debug: {
    showPanel: true,
  },
  privacy: {
    maskTextSelectors: ["[data-private]"],
    blockClass: "observer-block",
  },
});

const App = () => {
  return (
    <main>
      <section className="card">
        <p className="eyebrow">Web Observer SDK</p>
        <h1>React demo</h1>
        <p>
          Click buttons, type into fields, and inspect events from the browser
          console.
        </p>

        <div className="actions">
          <button type="button" data-observer-name="demo-primary-action">
            Primary action
          </button>
          <button type="button">Secondary action</button>
        </div>

        <label>
          Public field
          <input name="demo-public-field" placeholder="Type something" />
        </label>

        <label data-private>
          Private field
          <input name="demo-private-field" placeholder="Masked label zone" />
        </label>

        <div className="dead-zone">
          This area is intentionally non-interactive. Clicking it creates
          dead_click signals.
        </div>

        <div className="observer-block">
          This block is ignored by the SDK.
        </div>
      </section>
    </main>
  );
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
