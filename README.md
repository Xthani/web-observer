# Web Observer

Frontend SDK for automatic product analytics in closed web applications.

The first milestone is the independent npm package `@web-observer/sdk`.
Backend, admin panel, session replay, and AI analysis are optional layers that can be added later.

The browser session id is stored in `sessionStorage` per `appId`, so reloads in
the same tab stay in one analytics session.

## Install

For local development:

```bash
npm install file:../web-observer/packages/sdk
```

After publishing:

```bash
npm install @web-observer/sdk
```

Build this repository before local file installs:

```bash
npm run build
```

## Basic Usage

```ts
import { initObserver } from "@web-observer/sdk";

const observer = initObserver({
  appId: "work-crm",
  mode: "debug",
  debug: {
    showPanel: true,
  },
  routing: {
    getRoutePattern: (route) => {
      if (route.startsWith("/clients/")) return "/clients/:id";
      return undefined;
    },
  },
  privacy: {
    excludeSelectors: ["[data-no-observer]"],
    maskTextSelectors: ["[data-private]"],
    blockSelectors: ["[data-observer-block]"],
    blockClass: "observer-block",
  },
  uiAdapters: {
    interactiveSelectors: [
      ".ant-select",
      ".ant-dropdown-menu-item",
      "[data-radix-collection-item]",
    ],
    blockSelectors: [".ant-picker-dropdown"],
  },
});
```

For a shorter setup:

```ts
initObserver({
  appId: "work-crm",
  mode: "debug",
});
```

The SDK currently collects:

- `page_view`
- `click`
- `dead_click`
- `rage_click`
- `input`
- `focus`
- `change`
- `error`

Input values are not stored.

`click` is used for interactive elements only: buttons, links, inputs,
selects, textareas, common ARIA controls, and elements marked with
`data-observer-name`.

Clicks outside interactive elements are stored as `dead_click`. Three or more
clicks on the same element within one second are stored as one `rage_click`
signal for that short click series.

`input` is debounced. The SDK stores the fact that the user changed a field
after a short pause, not every typed character.

`focus`, `change`, and `input` are collected only for real form fields:
`input`, `select`, `textarea`, and `contenteditable` elements. Button focus is
ignored to avoid noisy analytics.

Regular `click` events are not stored for form fields because `focus`,
`input`, and `change` describe that interaction better. Repeated fast clicks on
the same field can still produce a `rage_click` signal.

`privacy.maskTextSelectors` stores matching text as `[masked]`.
`privacy.blockSelectors`, `privacy.blockClass`, and `uiAdapters.blockSelectors`
skip whole DOM zones completely.

## Custom Backend

```ts
initObserver({
  appId: "work-crm",
  transport: {
    endpoint: "https://my-api.com/observer/events/batch",
    headers: {
      Authorization: "Bearer token",
    },
  },
});
```

You can also pass a custom sender:

```ts
initObserver({
  appId: "work-crm",
  transport: {
    send: async (batch) => {
      await myCustomApi.saveObserverBatch(batch);
    },
  },
});
```

## Debug Mode

With `mode: "debug"`, the SDK exposes a browser console API:

```ts
await window.__WEB_OBSERVER__.getEvents();
await window.__WEB_OBSERVER__.getSummary();
await window.__WEB_OBSERVER__.getBatches();
await window.__WEB_OBSERVER__.flush();
await window.__WEB_OBSERVER__.clear();
```

Use `getSummary()` as the first AI input. It returns compact analytics:
totals, top routes, top events, and problem signals such as `dead_click`,
`rage_click`, and `error`. It also includes simple flow summaries, drop-off
points, role breakdowns, and a comparison between the first and second half of
the local period. Local aggregates are included by day and by session.

After a successful `flush()`, sent events are cleaned up automatically by TTL
and max-count limits. You can tune this behavior:

```ts
initObserver({
  appId: "work-crm",
  transport: {
    endpoint: "https://my-api.com/observer/events/batch",
    retry: {
      attempts: 2,
      baseDelayMs: 500,
      maxDelayMs: 5000,
    },
  },
  storagePolicy: {
    cleanupSentEvents: true,
    sentEventTtlMs: 7 * 24 * 60 * 60 * 1000,
    maxSentEvents: 1000,
  },
});
```

Events are stored in IndexedDB:

```txt
DevTools -> Application -> IndexedDB -> web-observer
```

## Docs

- [SDK usage](./docs/sdk-usage.md)
- [Event format](./docs/event-format.md)
- [AI summary](./docs/ai-summary.md)

## Example

```bash
cd examples/react-demo
npm install
npm run dev
```
