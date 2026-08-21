# Web Observer

Privacy-first product analytics for modern web applications. Web Observer is a framework-agnostic TypeScript SDK that captures useful UX signals in the browser, stores them locally in IndexedDB, and produces compact summaries for debugging or AI-assisted analysis.

The project is intentionally backend-agnostic: events can stay local during development, be exported on demand, or be delivered in batches to a custom endpoint.

## Why it exists

Traditional analytics tools are often too broad for internal products and closed business applications. Web Observer focuses on actionable interaction signals while keeping collection rules explicit:

- page views and normalized route patterns;
- clicks on interactive elements;
- dead-click and rage-click detection;
- form interaction events without storing input values;
- browser errors;
- privacy controls for masked or fully blocked DOM zones;
- local summaries for flows, drop-offs, roles, routes, and problem signals.

## Current status

`@web-observer/sdk` is an early standalone SDK (`0.1.0`). It includes the browser collector, IndexedDB storage, batch transport, debug tooling, analytics summaries, automated tests, and a React demo. A hosted backend and dashboard are deliberately outside the current milestone.

## Quick start

```bash
npm install
npm run build
```

Install the locally built package in another application:

```bash
npm install file:../web-observer/packages/sdk
```

Initialize it with a minimal configuration:

```ts
import { initObserver } from "@web-observer/sdk";

initObserver({
  appId: "product-app",
  mode: "debug",
});
```

## Production-oriented configuration

```ts
initObserver({
  appId: "product-app",
  user: {
    id: currentUser.id,
    role: currentUser.role,
  },
  routing: {
    getRoutePattern: (route) =>
      route.startsWith("/clients/") ? "/clients/:id" : undefined,
  },
  privacy: {
    maskTextSelectors: ["[data-private]"],
    blockSelectors: ["[data-observer-block]"],
    blockClass: "observer-block",
  },
  transport: {
    endpoint: "https://api.example.com/observer/events/batch",
    retry: {
      attempts: 2,
      baseDelayMs: 500,
      maxDelayMs: 5000,
    },
  },
});
```

Input values are never stored. Matching text can be replaced with `[masked]`, and sensitive DOM zones can be excluded entirely.

## Debug and AI-assisted analysis

Debug mode exposes a small browser API:

```ts
await window.__WEB_OBSERVER__.getEvents();
await window.__WEB_OBSERVER__.getSummary();
await window.__WEB_OBSERVER__.getBatches();
await window.__WEB_OBSERVER__.flush();
await window.__WEB_OBSERVER__.clear();
```

`getSummary()` is designed as the first input for an AI analyst. It aggregates totals, routes, event types, short flows, drop-offs, role breakdowns, period comparisons, and UX problem signals without requiring a large raw-event dump.

## Repository structure

```text
packages/sdk/          TypeScript SDK
examples/react-demo/   Integration example
tests/sdk/             Node-based automated tests
docs/                  Usage, event format, and AI summary docs
```

## Quality checks

```bash
npm run typecheck
npm test
```

## Documentation

- [SDK usage](./docs/sdk-usage.md)
- [Event format](./docs/event-format.md)
- [AI summary](./docs/ai-summary.md)
- [Publishing notes](./docs/publish-to-npm.md)

## License

[MIT](./LICENSE)
