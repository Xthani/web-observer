import assert from "node:assert/strict";
import test from "node:test";

import {
  createEventKey,
  getEventConfidence,
} from "../../packages/sdk/dist/normalizers/eventKeyNormalizer.js";

test("createEventKey uses full semantic route context", () => {
  assert.equal(
    createEventKey("click", "/clients/:id/orders", {
      tag: "button",
      label: "Save order",
      selector: "form > button",
    }),
    "clients.orders.save_order.click",
  );
});

test("createEventKey prefers data-observer-name over visible label", () => {
  assert.equal(
    createEventKey("click", "/orders", {
      tag: "button",
      label: "Save",
      selector: 'button[data-observer-name="submit-order"]',
    }),
    "orders.submit_order.click",
  );
});

test("createEventKey falls back to root page for page views", () => {
  assert.equal(createEventKey("page_view", "/"), "root.page.page_view");
});

test("getEventConfidence reflects element signal quality", () => {
  assert.equal(getEventConfidence(), 0.7);
  assert.equal(
    getEventConfidence({
      tag: "button",
      label: "Save",
      selector: "button",
    }),
    0.86,
  );
  assert.equal(
    getEventConfidence({
      tag: "button",
      selector: 'button[data-testid="save"]',
    }),
    0.82,
  );
});
