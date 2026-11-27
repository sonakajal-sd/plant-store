// Reads something we saved in the browser (localStorage) as JSON.
// If it's missing, broken (not valid JSON) or the wrong shape, we throw it away
// and use the fallback — so bad browser data can never crash the site.
export function loadSaved<T>(key: string, isValid: (value: unknown) => boolean, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (saved === null) return fallback;

  try {
    const value: unknown = JSON.parse(saved);
    if (isValid(value)) return value as T;
  } catch {
    // Not valid JSON → fall through and clean it up
  }

  localStorage.removeItem(key);
  return fallback;
}

// true for a plain object like { ... } (not null, not an array)
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
