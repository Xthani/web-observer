# React Demo

This demo shows the minimal browser integration for `@web-observer/sdk`.

```bash
npm install
npm run build
npm run dev
```

Open DevTools and run:

```ts
await window.__WEB_OBSERVER__.getSummary();
await window.__WEB_OBSERVER__.getEvents();
```
