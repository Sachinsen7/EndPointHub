import { NextRequest, NextResponse } from 'next/server';
import { getRedisCLient } from '../redis/client';
import { config } from '../config/env';
import { ApiError } from '../utils/error';
import { prisma } from '../db/connections';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyGenerator?: (req: NextRequest) => string;
    skipSuccessfulRequests?: boolean;
}

const defaultKeyGenerator = (req: NextRequest): string => {
    return (
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
};

export const rateLimit = (options: RateLimitOptions) => {
    const {
        windowMs = config.rateLimit.window || 900000,
        max = config.rateLimit.requests || 100,
        keyGenerator = defaultKeyGenerator,
        skipSuccessfulRequests = false,
    } = options;

    return (
        handler: (req: NextRequest, context?: any) => Promise<NextResponse>
    ) => {
        return async (request: NextRequest, context?: any) => {
            const redis = getRedisCLient();
            if (!redis) {
                throw new ApiError('Rate limiting unavailable', 503);
            }

            const key = `rate_limit:${keyGenerator(request)}`;
            const current = await redis.incr(key);

            if (current === 1) {
                await redis.expire(key, Math.ceil(windowMs / 1000));
            }

            if (current > max) {
                throw new ApiError('Too Many Requests', 429);
            }

            const response = await handler(request, context);

            if (
                skipSuccessfulRequests &&
                response.status >= 200 &&
                response.status < 400
            ) {
                await redis.decr(key);
            }

            response.headers.set('X-RateLimit-Limit', max.toString());
            response.headers.set(
                'X-RateLimit-Remaining',
                Math.max(0, max - current).toString()
            );
            response.headers.set(
                'X-RateLimit-Reset',
                new Date(Date.now() + windowMs).toISOString()
            );

            return response;
        };
    };
};

export const apiKeyRateLimit = (
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) => {
    return async (request: NextRequest, context?: any) => {
        const apiKey =
            request.headers.get('x-api-key') ||
            request.headers.get('authorization')?.replace('Bearer ', '');
        if (!apiKey) {
            throw new ApiError('API Key required', 401);
        }

        const keyRecord = await prisma.apiKey.findFirst({
            where: {
                key: apiKey,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            select: { rateLimit: true },
        });
        if (!keyRecord) {
            throw new ApiError('Invalid or expired API key', 401);
        }

        return rateLimit({
            windowMs: config.rateLimit.window || 900000,
            max: keyRecord.rateLimit || config.rateLimit.requests || 100,
            keyGenerator: () => `api_key:${apiKey}`,
        })(handler)(request, context);
    };
};
