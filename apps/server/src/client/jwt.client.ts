/**
 * JWT工具类
 *
 * 作用：处理JSON Web Tokens的生成、验证和管理
 * 实现双令牌系统：
 * - Access Token: 短有效期，用于API访问
 * - Refresh Token: 长有效期，用于获取新Access Token
 */

import jwt from 'jsonwebtoken';
import { env } from '@/config';

/**
 * Token载荷接口
 *
 * 注意：JWT内容可以被解码（base64），不要存储敏感信息
 * 标准字段：iat(签发时间), exp(过期时间), sub(主题), iss(签发者)
 * 自定义字段：userId, email, role等
 */
export interface TokenPayload {
  userId: string; // 用户唯一标识
  email: string; // 用户邮箱
  role: string; // 用户角色
  iat?: number; // issued at - JWT标准字段
  exp?: number; // expiration - JWT标准字段
}

export class JWTService {
  /**
   * 生成Access Token
   *
   * 特点：
   * 1. 短有效期（15分钟到2小时）
   * 2. 用于API资源访问
   * 3. 泄露风险窗口小
   *
   * 安全问题：令牌一旦签发，在过期前无法主动撤销
   * 解决方案：短期令牌 + 刷新机制
   */
  static generateAccessToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>
  ): string {
    return jwt.sign(
      payload, // 编码的数据
      env.JWT_SECRET, // 签名密钥
      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
        algorithm: 'HS256' as const,
      }
    );
  }

  /**
   * 生成Refresh Token
   *
   * 设计要点：
   * 1. 长有效期（7天到30天）
   * 2. 使用独立密钥，与Access Token密钥不同
   * 3. 存储在HttpOnly Cookie中，防止XSS攻击
   * 4. 添加isRefresh标识，防止Access Token被用作Refresh Token
   */
  static generateRefreshToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>
  ): string {
    return jwt.sign(
      { ...payload, isRefresh: true }, // 添加类型标识
      env.REFRESH_TOKEN_SECRET, // 独立密钥
      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
        algorithm: 'HS256',
      } as jwt.SignOptions
    );
  }

  /**
   * 验证Access Token
   *
   * jwt.verify做的三件事：
   * 1. 验证签名是否有效（防止篡改）
   * 2. 验证是否过期（exp字段）
   * 3. 验证生效时间（nbf字段，如果有）
   *
   * @throws JsonWebTokenError - 令牌无效
   * @throws TokenExpiredError - 令牌过期
   */
  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }

  /**
   * 验证Refresh Token
   *
   * 额外检查：验证isRefresh标识
   * 防止攻击者用窃取的Access Token获取新令牌
   */
  static verifyRefreshToken(token: string): TokenPayload {
    const payload = jwt.verify(
      token,
      env.REFRESH_TOKEN_SECRET
    ) as TokenPayload & { isRefresh?: boolean };

    // 验证令牌类型
    if (!payload.isRefresh) {
      throw new Error('无效的刷新令牌类型');
    }

    // 移除类型标识，返回标准载荷
    const { isRefresh, ...cleanPayload } = payload;
    return cleanPayload;
  }

  /**
   * 生成双令牌
   *
   * 最佳实践：登录时同时返回两种令牌
   * 前端将Access Token存在内存，Refresh Token存在HttpOnly Cookie
   */
  static generateTokens(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * 从Authorization头提取令牌
   *
   * 处理格式：Bearer <token>
   * 这是OAuth 2.0的标准格式
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    // 移除"Bearer "前缀（7个字符）
    return authHeader.substring(7);
  }
}
