import { isProtectedRoute } from "./authRoutes";

export type MiddlewareAuthNavigation =
  | { kind: "continue" }
  | {
      kind: "redirect";
      path: string;
      /** 追加到目标 URL 的 query（如登录回跳 from） */
      search?: Record<string, string>;
    };

export const getMiddlewareAuthNavigation = (input: {
  pathname: string;
  hasSession: boolean;
}): MiddlewareAuthNavigation => {
  const onProtectedRoute = isProtectedRoute(input.pathname);
  const isAuthRoute = input.pathname === "/login";

  if (!input.hasSession && onProtectedRoute) {
    return {
      kind: "redirect",
      path: "/login",
      search: { from: input.pathname },
    };
  }

  if (input.hasSession && isAuthRoute) {
    return { kind: "redirect", path: "/dashboard" };
  }

  return { kind: "continue" };
};
