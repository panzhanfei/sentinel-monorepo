/**
 * Side-effect: ensure env.config parses in Vitest when tests import code that
 * loads Redis/Bull (e.g. scan.controller). Import this file as the first
 * import in such test modules.
 */
if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
  if (!process.env.DEEPSEEK_API_KEY) {
    process.env.DEEPSEEK_API_KEY = "vitest-placeholder-deepseek";
  }
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = "redis://127.0.0.1:6379/0";
  }
}

export {};
