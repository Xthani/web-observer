import type { ObserverElement } from "../types";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[data-observer-name]",
  "[onclick]",
  "[contenteditable='true']",
].join(",");

const LABEL_ATTRIBUTES = [
  "data-observer-name",
  "aria-label",
  "title",
  "placeholder",
  "name",
  "id",
];

const getAttributeLabel = (element: Element): string | undefined => {
  for (const attribute of LABEL_ATTRIBUTES) {
    const value = element.getAttribute(attribute)?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
};

const getInteractiveSelector = (extraSelectors: string[] = []): string => {
  return [INTERACTIVE_SELECTOR, ...extraSelectors].filter(Boolean).join(",");
};

export const isInteractiveElement = (
  element: Element,
  extraSelectors: string[] = [],
): boolean => {
  return element.matches(getInteractiveSelector(extraSelectors));
};

export const getClosestInteractiveElement = (
  element: Element,
  extraSelectors: string[] = [],
): Element | null => {
  return element.closest(getInteractiveSelector(extraSelectors));
};

export const isFormFieldElement = (element: Element): boolean => {
  return element.matches(
    "input, select, textarea, [contenteditable='true']",
  );
};

const shouldMaskText = (
  element: Element,
  maskTextSelectors: string[] = [],
): boolean => {
  return maskTextSelectors.some((selector) => element.closest(selector));
};

const getTextLabel = (
  element: Element,
  maskTextSelectors: string[] = [],
): string | undefined => {
  if (shouldMaskText(element, maskTextSelectors)) {
    return "[masked]";
  }

  const text = element.textContent?.replace(/\s+/g, " ").trim();

  if (!text) {
    return undefined;
  }

  if (!isInteractiveElement(element) && text.length > 40) {
    return undefined;
  }

  return text.slice(0, 80);
};

const getSelectorPart = (element: Element): string => {
  const tag = element.tagName.toLowerCase();
  const observerName = element.getAttribute("data-observer-name");

  if (observerName) {
    return `${tag}[data-observer-name="${observerName}"]`;
  }

  const id = element.id?.trim();

  if (id) {
    return `${tag}#${id}`;
  }

  const testId = element.getAttribute("data-testid");

  if (testId) {
    return `${tag}[data-testid="${testId}"]`;
  }

  const firstClass = [...element.classList].find(Boolean);

  return firstClass ? `${tag}.${firstClass}` : tag;
};

export const createElementSelector = (element: Element): string => {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && parts.length < 4) {
    parts.unshift(getSelectorPart(current));
    current = current.parentElement;
  }

  return parts.join(" > ");
};

export const normalizeElement = (
  element: Element,
  maskTextSelectors: string[] = [],
): ObserverElement => {
  const htmlElement = element as HTMLElement;
  const label =
    getAttributeLabel(element) ?? getTextLabel(element, maskTextSelectors);

  return {
    tag: element.tagName.toLowerCase(),
    type: htmlElement.getAttribute("type") ?? undefined,
    label,
    selector: createElementSelector(element),
  };
};

export const shouldIgnoreElement = (
  element: Element,
  excludeSelectors: string[],
): boolean => {
  return excludeSelectors.some((selector) => element.closest(selector));
};
