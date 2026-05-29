# Event Format

`@web-observer/sdk` stores raw events in IndexedDB and sends them in batches.
Input values, passwords, tokens, cookies, localStorage, and request headers are not collected.

## Batch

```json
{
  "schemaVersion": "1.0",
  "appId": "work-crm",
  "sdkVersion": "0.1.0",
  "batchId": "batch_123",
  "sessionId": "session_123",
  "createdAt": "2026-05-29T10:00:00.000Z",
  "events": []
}
```

## Event

```json
{
  "eventId": "evt_123",
  "appId": "work-crm",
  "sessionId": "session_123",
  "type": "click",
  "route": "/clients/123",
  "routePattern": "/clients/:id",
  "eventKey": "clients.save.click",
  "label": "Save",
  "confidence": 0.86,
  "element": {
    "tag": "button",
    "type": "submit",
    "label": "Save",
    "selector": "form > button[data-testid=\"save\"]"
  },
  "timestamp": "2026-05-29T10:00:00.000Z"
}
```

## Event Types

- `page_view` tracks route entry and reloads.
- `click` tracks meaningful clicks on interactive elements.
- `dead_click` tracks clicks outside interactive elements.
- `rage_click` tracks fast repeated clicks on the same target.
- `focus`, `input`, and `change` track real form fields only.
- `error` tracks browser errors and unhandled promise rejections.

## Privacy

Use `privacy.excludeSelectors` to ignore specific targets, `privacy.blockSelectors`
or `privacy.blockClass` to ignore whole zones, and `privacy.maskTextSelectors`
to store text as `[masked]`.
