/** 与 middleware、AuthGuard 共用，避免受保护路由列表漂移 */
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/monitor",
  "/audit",
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((route) => pathname.startsWith(route));
}
