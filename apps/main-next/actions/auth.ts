"use server";

import { cookies } from "next/headers";
import { NonceService, JwtService } from "@sentinel/auth";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";

// 初始化服务
const nonceService = new NonceService(redis, { prefix: "nonce", ttl: 300 });
const jwtService = new JwtService({
  secret: process.env.JWT_SECRET!,
  expiresIn: "7d",
});

export async function getLoginNonce(address: string) {
  // 限流（使用 redis 的 slidingWindowLimit 方法）
  const now = Date.now();
  const isAllowed = await redis.slidingWindowLimit(
    `rate_limit:nonce:${address.toLowerCase()}`,
    now,
    60000, // 1分钟窗口
    5, // 最多5次
  );
  if (!isAllowed) {
    throw new Error("请求太频繁，请一分钟后再试");
  }

  const nonce = await nonceService.generate(address, "login");
  return nonce;
}

export async function verifySignature(address: string, signature: string) {
  // 注意：这里需要知道之前生成的 nonce 消息，可以从 Redis 取出
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

  // 签发 JWT
  const token = jwtService.sign({
    sub: address.toLowerCase(),
    role: "user",
  });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  revalidatePath("/", "layout");
}
