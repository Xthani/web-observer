const NUMBER_SEGMENT = /^\d+$/;
const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH_SEGMENT = /^[0-9a-f]{12,}$/i;

export const getCurrentRoute = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const normalizeRoutePattern = (route: string): string => {
  const [pathname = "/"] = route.split(/[?#]/);

  return pathname
    .split("/")
    .map((segment) => {
      if (!segment) {
        return segment;
      }

      if (
        NUMBER_SEGMENT.test(segment) ||
        UUID_SEGMENT.test(segment) ||
        HASH_SEGMENT.test(segment)
      ) {
        return ":id";
      }

      return segment;
    })
    .join("/");
};
