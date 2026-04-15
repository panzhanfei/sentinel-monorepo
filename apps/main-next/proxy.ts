import { NextRequest, NextResponse } from "next/server";
import { getMiddlewareAuthNavigation } from "@/lib/middlewareAuthNavigation";
import { BFF_CORS_ORIGIN_SET } from "@/lib/subAppOrigins";

const applyApiCors = (request: NextRequest, response: NextResponse) => {
  const origin = request.headers.get("origin");
  if (origin && BFF_CORS_ORIGIN_SET.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

const apiCorsPreflight = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  if (!origin || !BFF_CORS_ORIGIN_SET.has(origin)) {
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

export const proxy = (request: NextRequest) => {
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
