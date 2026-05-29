import assert from "node:assert/strict";
import test from "node:test";

import { createAnalyticsSummary } from "../../packages/sdk/dist/analytics/createAnalyticsSummary.js";

const createEvent = (overrides) => ({
  eventId: `evt_${overrides.timestamp}_${overrides.eventKey}`,
  appId: "test-app",
  sessionId: "session_1",
  type: "click",
  route: "/login",
  routePattern: "/login",
  eventKey: "login.button.click",
  confidence: 0.86,
  timestamp: "2026-05-29T10:00:00.000Z",
  ...overrides,
});

test("createAnalyticsSummary counts totals, event types, routes, and top events", () => {
  const summary = createAnalyticsSummary([
    createEvent({
      type: "page_view",
      eventKey: "login.page.page_view",
      timestamp: "2026-05-29T10:00:00.000Z",
    }),
    createEvent({
      type: "click",
      eventKey: "login.submit.click",
      label: "Submit",
      timestamp: "2026-05-29T10:00:01.000Z",
    }),
    createEvent({
      type: "dead_click",
      eventKey: "login.div.dead_click",
      timestamp: "2026-05-29T10:00:02.000Z",
    }),
  ]);

  assert.equal(summary.appId, "test-app");
  assert.equal(summary.totals.events, 3);
  assert.equal(summary.totals.sessions, 1);
  assert.equal(summary.totals.routes, 1);
  assert.equal(summary.eventTypes.page_view, 1);
  assert.equal(summary.eventTypes.click, 1);
  assert.equal(summary.eventTypes.dead_click, 1);
  assert.equal(summary.topRoutes[0].routePattern, "/login");
  assert.equal(summary.topEvents[0].count, 1);
});

test("createAnalyticsSummary builds problem signals, flows, drop-offs and aggregates", () => {
  const summary = createAnalyticsSummary([
    createEvent({
      type: "click",
      eventKey: "login.register.click",
      label: "Register",
      timestamp: "2026-05-29T10:00:00.000Z",
    }),
    createEvent({
      type: "change",
      eventKey: "login.email.change",
      label: "Email",
      timestamp: "2026-05-29T10:00:01.000Z",
    }),
    createEvent({
      type: "rage_click",
      eventKey: "login.submit.rage_click",
      label: "Submit",
      timestamp: "2026-05-29T10:00:02.000Z",
      user: { role: "manager" },
    }),
  ]);

  assert.equal(summary.problemSignals[0].eventKey, "login.submit.rage_click");
  assert.deepEqual(summary.flowSummaries[0].steps, [
    "login.register.click",
    "login.email.change",
    "login.submit.rage_click",
  ]);
  assert.equal(summary.dropOffs[0].eventKey, "login.submit.rage_click");
  assert.equal(summary.localAggregates.byDay[0].date, "2026-05-29");
  assert.equal(summary.localAggregates.bySession[0].events, 3);
  assert.equal(summary.periodComparison.previousEvents, 2);
  assert.equal(summary.periodComparison.currentEvents, 1);
});
