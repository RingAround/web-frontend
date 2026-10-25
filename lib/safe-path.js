// Where to send someone after sign-in: a path on this site, or the default.
// Anything else (another origin, "//host", backslash tricks) falls back, so the
// parameter can't be used as an open redirect.
export function safeNextPath(value, fallback = "/requests/new") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
