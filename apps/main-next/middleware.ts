import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("sentinel_session")?.value;
  const { pathname } = request.nextUrl;

  // 1. 定义路由分类
  const isProtectedRoute = ["/dashboard", "/monitor", "/audit"].some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = pathname === "/login";
  const isRoot = pathname === "/";

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

  // 4. 核心逻辑 C：根路径处理
  if (isRoot) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.next(); // 允许访问根页面，由 app/page.tsx 自行分发
    }
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
