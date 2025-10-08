import { NextRequest, NextResponse } from 'next/server';
import { getRedisCLient } from '../redis/client';
import { config } from '../config/env';
import { ApiError } from '../utils/error';
import { prisma } from '../db/connections';
import { hasApiKey } from '../utils/crypto';
import { ApiKey } from '@/types';

interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyGenerator?: (req: NextRequest) => string;
    skipSuccessfulRequests?: boolean;
}

// Extend NextRequest to include apiKey
interface AuthenticatedRequest extends NextRequest {
    apiKey?: ApiKey;
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
    handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) => {
    return async (request: AuthenticatedRequest, context?: any) => {
        const apiKey =
            request.headers.get('x-api-key') ||
            request.headers.get('authorization')?.replace('Bearer ', '');
        if (!apiKey) {
            throw new ApiError('API Key required', 401);
        }

        const keyHash = await hasApiKey(apiKey);
        const keyRecord = await prisma.apiKey.findFirst({
            where: {
                keyHash,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        if (!keyRecord) {
            throw new ApiError('Invalid or expired API key', 401);
        }

        return rateLimit({
            windowMs: config.rateLimit.window || 900000,
            max: keyRecord.rateLimit || config.rateLimit.requests || 100,
            keyGenerator: () => `api_key:${keyHash}`,
        })(handler)(request, context);
    };
};

export const authenticateApiKey = (
    handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) => {
    return async (request: AuthenticatedRequest, context?: any) => {
        const apiKey =
            request.headers.get('x-api-key') ||
            request.headers.get('authorization')?.replace('Bearer ', '');
        if (!apiKey) {
            throw new ApiError('API Key required', 401, [
                'No API key provided in headers',
            ]);
        }

        const keyHash = await hasApiKey(apiKey);
        const keyRecord = await prisma.apiKey.findFirst({
            where: {
                keyHash,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        if (!keyRecord) {
            throw new ApiError('Invalid or expired API key', 401, [
                'API key not found or inactive',
            ]);
        }

        request.apiKey = {
            id: keyRecord.id,
            name: keyRecord.name,
            description: keyRecord.description || undefined,
            key: apiKey,
            permissions: keyRecord.permissions,
            isActive: keyRecord.isActive,
            lastUsedAt: keyRecord.lastUsedAt?.toISOString(),
            expiresAt: keyRecord.expiresAt?.toISOString(),
            createdAt: keyRecord.createdAt.toISOString(),
            _count: { usage: keyRecord._count?.usage || 0 },
        };

        await prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() },
        });

        return handler(request, context);
    };
};
