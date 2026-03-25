import { NextRequest, NextResponse } from "next/server";
import { isProtectedRoute } from "@/lib/authRoutes";

/** 微前端子应用直连主站 BFF（带 Cookie）时的 CORS 来源 */
const BFF_CORS_ORIGINS = new Set([
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",
]);

function applyApiCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  if (origin && BFF_CORS_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

function apiCorsPreflight(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || !BFF_CORS_ORIGINS.has(origin)) {
    return new NextResponse(null, { status: 204 });
  }
  const reqHeaders =
    request.headers.get("access-control-request-headers") ||
    "Content-Type, Authorization";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": reqHeaders,
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      return apiCorsPreflight(request);
    }
    return applyApiCors(request, NextResponse.next());
  }

  const session = request.cookies.get("token")?.value;

  // 1. 定义路由分类
  const onProtectedRoute = isProtectedRoute(pathname);
  const isAuthRoute = pathname === "/login";

  // 2. 核心逻辑 A：未登录访问受保护页面 -> 踢到登录页
  if (!session && onProtectedRoute) {
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
