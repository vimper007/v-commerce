import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTls = redisUrl.startsWith('rediss://');

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  tls: isTls ? { rejectUnauthorized: false } : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('[Redis] Client error:', err);
});

export function createBullConnection(): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    tls: isTls ? { rejectUnauthorized: false } : undefined,
  });
}

export async function testRedisConnection() {
  try {
    const pong = await redis.ping();
    console.log(`[Redis] Connected successfully to ${redisUrl} (${pong})`);
  } catch (error) {
    console.error('[Redis] Failed to connect to Redis:', error);
    process.exit(1);
  }
}
