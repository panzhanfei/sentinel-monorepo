/**
 * Matches Node `/api/v1` JSON envelope: `{ success, data }` / `{ success, error }`.
 */

export function getNodeApiData<T>(
  body: unknown,
  guard?: (data: T) => boolean,
): T | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (b.success !== true) return null;
  const data = b.data as T;
  if (guard && !guard(data)) return null;
  return data;
}

export function getNodeApiErrorMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const b = body as Record<string, unknown>;
  if (b.success === false && typeof b.error === "object" && b.error !== null) {
    const e = b.error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  return undefined;
}
