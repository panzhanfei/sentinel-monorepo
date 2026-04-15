import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { JwtService } from "@sentinel/auth";
import { validateDualSession } from "@/lib/authSession";

export const GET = async () => {
  const store = await cookies();
  const access =
    store.get("accessToken")?.value ?? store.get("token")?.value ?? undefined;
  const refresh = store.get("refreshToken")?.value;

  if (!access || !refresh) {
    return NextResponse.json({ authenticated: false });
  }

  const validation = await validateDualSession({
    accessToken: access,
    refreshToken: refresh,
  });
  if (!validation.ok) {
    return NextResponse.json({ authenticated: false, code: validation.code });
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
