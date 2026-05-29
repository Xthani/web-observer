# SDK Usage

## Install Locally

Build the SDK:

```bash
npm run build
```

Install it in a target app:

```bash
npm install file:../web-observer/packages/sdk
```

## Basic Setup

```ts
import { initObserver } from "@web-observer/sdk";

const observer = initObserver({
  appId: "work-crm",
  mode: "debug",
});
```

## Production-Oriented Setup

```ts
initObserver({
  appId: "work-crm",
  user: {
    id: currentUser.id,
    role: currentUser.role,
  },
  transport: {
    endpoint: "https://my-api.com/observer/events/batch",
    retry: {
      attempts: 2,
      baseDelayMs: 500,
      maxDelayMs: 5000,
    },
  },
  privacy: {
    maskTextSelectors: ["[data-private]"],
    blockSelectors: ["[data-observer-block]"],
    blockClass: "observer-block",
  },
});
```

## Debug Commands

```ts
await window.__WEB_OBSERVER__.getEvents();
await window.__WEB_OBSERVER__.getSummary();
await window.__WEB_OBSERVER__.getBatches();
await window.__WEB_OBSERVER__.flush();
await window.__WEB_OBSERVER__.clear();
```
