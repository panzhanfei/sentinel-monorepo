import { RedisClient } from '@sentinel/database';
import { getRedisConfig } from '@/config';

export const redis = RedisClient.getInstance({ ...getRedisConfig() });

redis.initScripts();
