import { NextRequest, NextResponse } from "next/server";
import { getMiddlewareAuthNavigation } from "@/lib/middlewareAuthNavigation";

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

  const access = request.cookies.get("accessToken")?.value;
  const refresh = request.cookies.get("refreshToken")?.value;
  const hasSession = Boolean(access && refresh);

  const navigation = getMiddlewareAuthNavigation({
    pathname,
    hasSession,
  });

  if (navigation.kind === "redirect") {
    const url = new URL(navigation.path, request.url);
    if (navigation.search) {
      for (const [key, value] of Object.entries(navigation.search)) {
        url.searchParams.set(key, value);
      }
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
