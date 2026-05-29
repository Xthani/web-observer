import assert from "node:assert/strict";
import test from "node:test";

import {
  getClosestInteractiveElement,
  normalizeElement,
  shouldIgnoreElement,
} from "../../packages/sdk/dist/normalizers/elementNormalizer.js";

class FakeElement {
  constructor({
    tagName,
    attributes = {},
    textContent = "",
    classList = [],
    parentElement = null,
  }) {
    this.tagName = tagName.toUpperCase();
    this.attributes = attributes;
    this.textContent = textContent;
    this.classList = classList;
    this.parentElement = parentElement;
    this.id = attributes.id ?? "";
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  matches(selector) {
    if (selector.includes(",")) {
      return selector.split(",").some((part) => this.matches(part.trim()));
    }

    if (selector === this.tagName.toLowerCase()) {
      return true;
    }

    if (selector === "[data-private]") {
      return Boolean(this.attributes["data-private"]);
    }

    if (selector === "[data-no-observer]") {
      return Boolean(this.attributes["data-no-observer"]);
    }

    if (selector === "[data-observer-name]") {
      return Boolean(this.attributes["data-observer-name"]);
    }

    return false;
  }

  closest(selector) {
    let current = this;

    while (current) {
      if (current.matches(selector)) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }
}

test("normalizeElement masks text inside configured private zones", () => {
  const body = new FakeElement({ tagName: "body" });
  const privateZone = new FakeElement({
    tagName: "div",
    attributes: { "data-private": "true" },
    parentElement: body,
  });
  const element = new FakeElement({
    tagName: "p",
    textContent: "Sensitive client name",
    parentElement: privateZone,
  });
  globalThis.document = { body };

  assert.equal(normalizeElement(element, ["[data-private]"]).label, "[masked]");
});

test("getClosestInteractiveElement supports adapter selectors", () => {
  const wrapper = new FakeElement({
    tagName: "div",
    attributes: { "data-observer-name": "custom-control" },
  });
  const child = new FakeElement({
    tagName: "span",
    parentElement: wrapper,
  });

  assert.equal(getClosestInteractiveElement(child), wrapper);
});

test("shouldIgnoreElement checks ancestors", () => {
  const ignoredParent = new FakeElement({
    tagName: "section",
    attributes: { "data-no-observer": "true" },
  });
  const child = new FakeElement({
    tagName: "button",
    parentElement: ignoredParent,
  });

  assert.equal(shouldIgnoreElement(child, ["[data-no-observer]"]), true);
});
