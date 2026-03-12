import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 1. 定义路由分类
  const isProtectedRoute = ["/dashboard", "/monitor", "/audit"].some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = pathname === "/login";

  // 2. 核心逻辑 A：未登录访问受保护页面 -> 踢到登录页
  if (!session && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. 核心逻辑 B：已登录还想去登录页 -> 送回 Dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 排除所有静态资源和 API，只拦截页面路由
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
