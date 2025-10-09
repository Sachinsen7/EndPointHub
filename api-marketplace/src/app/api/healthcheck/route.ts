import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/db/connections';
import { getRedisClient } from '@/libs/redis/client';
import { ApiError } from '@/libs/utils/error';

export const GET = async (request: NextRequest) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        const redis = await getRedisClient();
        await redis.ping();

        return NextResponse.json(
            { status: 'ok', database: 'connected', redis: 'connected' },
            { status: 200 }
        );
    } catch (error: any) {
        throw new ApiError('Healthcheck failed', 503, [
            error.message || 'Service unavailable',
            `Database: ${error.message.includes('prisma') ? 'disconnected' : 'connected'}`,
            `Redis: ${error.message.includes('redis') ? 'disconnected' : 'connected'}`,
        ]);
    }
};
