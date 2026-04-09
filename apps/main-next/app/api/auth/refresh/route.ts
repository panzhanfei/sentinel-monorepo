import { NextRequest, NextResponse } from "next/server";
import { authCookieConfig, rotateTokens } from "@/lib/authSession";

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        {
          error: "Missing tokens",
          code: "DUAL_TOKEN_REQUIRED",
        },
        { status: 401 },
      );
    }

    const rotated = await rotateTokens({ accessToken, refreshToken });
    if (!rotated.ok) {
      return NextResponse.json(
        { error: rotated.message, code: rotated.code },
        { status: rotated.status },
      );
    }

    const out = NextResponse.json({ ok: true });
    out.cookies.set("accessToken", rotated.accessToken, {
      ...cookieBase,
      maxAge: authCookieConfig.accessMaxAge,
    });
    out.cookies.set("refreshToken", rotated.refreshToken, {
      ...cookieBase,
      maxAge: authCookieConfig.refreshMaxAge,
    });
    return out;
  } catch (error) {
    console.error("BFF auth/refresh rotate Error:", error);
    return NextResponse.json(
      { error: "Refresh failed", code: "REFRESH_FAILED" },
      { status: 500 },
    );
  }
}
