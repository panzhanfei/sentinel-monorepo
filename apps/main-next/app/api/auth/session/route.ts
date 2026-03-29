import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { JwtService } from "@sentinel/auth";

/**
 * 供客户端调度主动续期：读取 access JWT 的 exp（不解签亦可用于计时；仅服务端可读 httpOnly）。
 */
export async function GET() {
  const store = await cookies();
  const access =
    store.get("accessToken")?.value ?? store.get("token")?.value ?? undefined;
  const refresh = store.get("refreshToken")?.value;

  if (!access || !refresh) {
    return NextResponse.json({ authenticated: false });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { authenticated: false, error: "JWT misconfigured" },
      { status: 500 },
    );
  }

  const jwt = new JwtService({ secret });
  const payload = jwt.decode(access);
  const expSec =
    payload && typeof payload.exp === "number" ? payload.exp : null;

  return NextResponse.json({
    authenticated: true,
    accessExpiresAtSec: expSec,
  });
}
