"use server";

import { cookies } from "next/headers";
import {
  NonceService,
  DualJwtService,
  type DualJwtOptions,
} from "@sentinel/auth";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";

const nonceService = new NonceService(redis, { prefix: "nonce", ttl: 300 });

const dualJwtOptions: DualJwtOptions = {
  accessSecret: process.env.JWT_SECRET!,
  refreshSecret:
    process.env.REFRESH_TOKEN_SECRET ??
    "your-refresh-token-secret-different-from-jwt",
  accessExpiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as DualJwtOptions["accessExpiresIn"],
  refreshExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN ??
    "7d") as DualJwtOptions["refreshExpiresIn"],
};
const dualJwt = new DualJwtService(dualJwtOptions);

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getLoginNonce(address: string) {
  const now = Date.now();
  const isAllowed = await redis.slidingWindowLimit(
    `rate_limit:nonce:${address.toLowerCase()}`,
    now,
    60000,
    5,
  );
  if (!isAllowed) {
    throw new Error("请求太频繁，请一分钟后再试");
  }

  const nonce = await nonceService.generate(address, "login");
  return nonce;
}

export async function verifySignature(address: string, signature: string) {
  const key = `nonce:login:${address.toLowerCase()}`;
  const savedNonce = await redis.get(key);
  if (!savedNonce) {
    throw new Error("Nonce 已过期或不存在，请重新获取");
  }

  const isValid = await nonceService.verify(
    address,
    "login",
    signature,
    savedNonce,
  );
  if (!isValid) {
    throw new Error("签名验证失败，疑似伪造请求");
  }

  const { accessToken, refreshToken } = dualJwt.generatePair({
    sub: address.toLowerCase(),
    role: "user",
  });

  const cookieStore = await cookies();

  cookieStore.delete("token");

  cookieStore.set("accessToken", accessToken, {
    ...cookieBase,
    maxAge: 15 * 60,
  });
  cookieStore.set("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  revalidatePath("/", "layout");
}
