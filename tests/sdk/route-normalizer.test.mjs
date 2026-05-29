import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRoutePattern } from "../../packages/sdk/dist/normalizers/routeNormalizer.js";

test("normalizeRoutePattern replaces numeric ids", () => {
  assert.equal(
    normalizeRoutePattern("/clients/123/orders/456?tab=active"),
    "/clients/:id/orders/:id",
  );
});

test("normalizeRoutePattern replaces uuid and hash-like ids", () => {
  assert.equal(
    normalizeRoutePattern(
      "/clients/550e8400-e29b-41d4-a716-446655440000",
    ),
    "/clients/:id",
  );

  assert.equal(
    normalizeRoutePattern("/files/abcdef1234567890abcdef"),
    "/files/:id",
  );
});

test("normalizeRoutePattern keeps semantic route segments", () => {
  assert.equal(
    normalizeRoutePattern("/reports/monthly#top"),
    "/reports/monthly",
  );
});
