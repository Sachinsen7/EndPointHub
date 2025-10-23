import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/db/connections';
import { getRedisClient } from '@/libs/redis/client';
import { ApiError } from '@/libs/utils/error';

export const GET = async (request: NextRequest) => {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (error) {
        console.error('Database connection failed:', error);
    }

    try {
        const redis = await getRedisClient();
        await redis.ping();
        redisStatus = 'connected';
    } catch (error) {
        console.error('Redis connection failed:', error);
        // Redis is optional, so we don't fail the healthcheck
    }

    return NextResponse.json(
        {
            status: dbStatus === 'connected' ? 'ok' : 'degraded',
            database: dbStatus,
            redis: redisStatus
        },
        { status: dbStatus === 'connected' ? 200 : 503 }
    );
};
