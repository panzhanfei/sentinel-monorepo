import { randomBytes } from "crypto";

export const generateSecureNonce = () => {
  // 生成 32 字节的高强度随机数，并转为十六进制
  return randomBytes(32).toString("hex");
};
