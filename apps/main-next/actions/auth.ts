"use server";

import { verifyMessage } from "viem";
import { cookies } from "next/headers";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import { generateSecureNonce } from "@/app/src/utils";

export async function getLoginNonce(address: string) {
  if (!address) throw new Error("Wallet address is required");

  const normalizedAddress = address.toLowerCase();
  const now = Date.now();

  // 1. 调用 Lua 限流脚本 (1分钟内最多请求 5 次 Nonce)
  const isAllowed = await redis.slidingWindowLimit(
    `rate_limit:nonce:${normalizedAddress}`,
    now,
    60000, // 60秒窗口
    5, // 允许 5 次
  );

  if (!isAllowed) {
    throw new Error("请求太频繁，请一分钟后再试");
  }

  // 2. 生成随机 Nonce
  const nonce = `Sentinel sign-in request: ${generateSecureNonce()}`;

  // 3. 存储 Nonce 到 Redis，有效期 5 分钟
  // Key 格式: nonce:0xabc...
  await redis.set(`nonce:${normalizedAddress}`, nonce, "EX", 300);

  return nonce;
}

export async function verifySignature(address: string, signature: string) {
  const normalizedAddress = address.toLowerCase();

  // 1. 从 Redis 取出之前存的 Nonce
  const savedNonce = await redis.get(`nonce:${normalizedAddress}`);

  if (!savedNonce) {
    throw new Error("Nonce 已过期或不存在，请重新获取");
  }

  // 2. 使用 viem 校验签名是否由该地址签署
  const isValid = await verifyMessage({
    address: normalizedAddress as `0x${string}`,
    message: savedNonce,
    signature: signature as `0x${string}`,
  });

  if (!isValid) {
    throw new Error("签名验证失败，疑似伪造请求");
  }

  // 3. 验证成功！立即删除 Nonce (防止重放攻击)
  await redis.del(`nonce:${normalizedAddress}`);

  // 4. 设置 HttpOnly Cookie (这里我们简化逻辑，实际可以用 JWT)
  // 在 32K 级别面试中，必须提到 HttpOnly 和 Secure 属性
  const cookieStore = await cookies();
  cookieStore.set("sentinel_session", normalizedAddress, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1天
    path: "/",
  });

  return { success: true };
}

// actions/auth.ts
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("sentinel_session"); // 关键：删除 Cookie
  revalidatePath("/"); // 可选，刷新缓存
}

export async function checkSessionAction() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("sentinel_session")?.value;

    // 1. 如果 Cookie 不存在
    if (!session) {
      return { hasSession: false };
    }

    // 2. 这里可以进一步校验 Session 的合法性（可选）
    // 例如：解析 JWT 或查询 Redis 确认该 Session 是否被拉黑
    // const isValid = await verifySessionInRedis(session);
    // if (!isValid) return { hasSession: false };

    return { hasSession: true };
  } catch (error) {
    console.error("[AuthAction] checkSession failed:", error);
    return { hasSession: false };
  }
}
