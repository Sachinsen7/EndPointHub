import Redis from 'ioredis';
import { config } from '../config/env';
import { logger } from '@/libs/utils/logger';

let redis: Redis | null = null;

export const getRedisClient = async (): Promise<Redis> => {
    if (!config.redisUrl) {
        throw new Error('Redis URL is not configured');
    }

    if (!redis) {
        redis = new Redis(config.redisUrl, {
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        redis.on('error', (error) => {
            logger.error('Redis client error', error);
        });

        redis.on('connect', () => {
            logger.info('Redis client connected');
        });

        process.on('SIGTERM', async () => {
            if (redis) {
                await redis.quit();
                redis = null;
            }
        });

        await redis.connect();
    }

    return redis;
};
