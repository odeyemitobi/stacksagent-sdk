import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Redis connection failed, disabling idempotency cache for development');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis Error', err);
    });
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  /**
   * Attempts to acquire an idempotency key.
   * Returns true if successfully acquired (not processed before).
   * Returns false if already exists.
   */
  async acquireIdempotencyKey(key: string, ttlSeconds: number = 86400): Promise<boolean> {
    try {
      if (this.redis.status !== 'ready') {
        this.logger.warn(`Redis not ready. Bypassing idempotency for key: ${key}`);
        return true; // Graceful fallback if Redis isn't running locally
      }
      
      const result = await this.redis.setnx(key, '1');
      if (result === 1) {
        await this.redis.expire(key, ttlSeconds);
        return true;
      }
      return false;
    } catch (e) {
      this.logger.error(`Failed to acquire idempotency key: ${key}`, e);
      return true; // Graceful fallback on error
    }
  }
}
