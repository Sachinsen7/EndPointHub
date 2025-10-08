import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/libs/middleware/auth';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';
import { sub } from 'date-fns';
import { RealtimeAnalytics } from '@/types';

interface UsageGroupBy {
    apiId: string;
    timestamp: Date;
    _count: { _all: number };
    _avg: { responseTime: number | null };
    _sum: { statusCode: number | null };
}

interface UsageRecord {
    id: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    timestamp: Date;
}

interface ActiveApi {
    id: string;
    name: string;
    category: string;
    totalRequests: number;
    rating: number;
    _count: {
        subscriptions: number;
        reviews: number;
    };
}

export const GET = authenticateUser(
    async (request: NextRequest & { user: { id: string } }) => {
        try {
            const start = sub(new Date(), { hours: 1 });

            const [hourlyStats, recentRequests, activeApis, apiMap] =
                await Promise.all([
                    prisma.usage.groupBy({
                        by: ['apiId', 'timestamp'],
                        where: {
                            userId: request.user.id,
                            timestamp: { gte: start },
                        },
                        _count: { _all: true },
                        _avg: { responseTime: true },
                        _sum: { statusCode: true },
                    }) as Promise<UsageGroupBy[]>,
                    prisma.usage.findMany({
                        where: {
                            userId: request.user.id,
                            timestamp: { gte: start },
                        },
                        orderBy: { timestamp: 'desc' },
                        take: 50,
                    }) as Promise<UsageRecord[]>,
                    prisma.api.findMany({
                        where: {
                            isActive: true,
                            subscriptions: {
                                some: {
                                    userId: request.user.id,
                                    isActive: true,
                                },
                            },
                        },
                        include: {
                            _count: {
                                select: {
                                    subscriptions: {
                                        where: { isActive: true },
                                    },
                                    reviews: true,
                                },
                            },
                        },
                    }) as Promise<ActiveApi[]>,
                    prisma.api
                        .findMany({
                            where: {
                                id: {
                                    in: (
                                        await prisma.usage.findMany({
                                            where: {
                                                userId: request.user.id,
                                                timestamp: { gte: start },
                                            },
                                            select: { apiId: true },
                                            distinct: ['apiId'],
                                        })
                                    ).map((u: { apiId: string }) => u.apiId),
                                },
                            },
                            select: { id: true, name: true },
                        })
                        .then((apis: { id: string; name: string }[]) =>
                            Object.fromEntries(
                                apis.map((api) => [api.id, api.name])
                            )
                        ) as Promise<Record<string, string>>,
                ]);

            const errorCounts = await prisma.usage.groupBy({
                by: ['apiId'],
                where: {
                    userId: request.user.id,
                    apiId: { in: activeApis.map((api) => api.id) },
                    statusCode: { gte: 400 },
                    timestamp: { gte: start },
                },
                _count: { _all: true },
            });

            const errorMap = Object.fromEntries(
                errorCounts.map(
                    (ec: { apiId: string; _count: { _all: number } }) => [
                        ec.apiId,
                        ec._count._all,
                    ]
                )
            );

            const responseTimes = await prisma.usage.groupBy({
                by: ['apiId'],
                where: {
                    userId: request.user.id,
                    apiId: { in: activeApis.map((api) => api.id) },
                    timestamp: { gte: start },
                },
                _avg: { responseTime: true },
            });

            const responseTimeMap = Object.fromEntries(
                responseTimes.map(
                    (rt: {
                        apiId: string;
                        _avg: { responseTime: number | null };
                    }) => [rt.apiId, rt._avg.responseTime ?? 0]
                )
            );

            const response: RealtimeAnalytics = {
                hourlyStats: hourlyStats.map((item) => ({
                    minute: item.timestamp.toISOString(),
                    apiId: item.apiId,
                    apiName: apiMap[item.apiId] ?? 'Unknown',
                    requests: item._count._all,
                    errors:
                        item._sum.statusCode && item._sum.statusCode >= 400
                            ? item._count._all
                            : 0,
                    avgResponseTime: item._avg.responseTime ?? 0,
                })),
                recentRequests: recentRequests.map((req) => ({
                    id: req.id,
                    method: req.method,
                    path: req.path,
                    statusCode: req.statusCode,
                    responseTime: req.responseTime,
                    timestamp: req.timestamp.toISOString(),
                })),
                activeApis: activeApis.map((api) => ({
                    id: api.id,
                    name: api.name,
                    category: api.category,
                    requests: api.totalRequests,
                    errors: errorMap[api.id] ?? 0,
                    errorRate:
                        api.totalRequests > 0
                            ? (errorMap[api.id] ?? 0) / api.totalRequests
                            : 0,
                    avgResponseTime: responseTimeMap[api.id] ?? 0,
                })),
                timestamp: new Date().toISOString(),
            };

            return NextResponse.json(response);
        } catch (error: any) {
            throw new ApiError(
                'Failed to fetch real-time analytics',
                error.statusCode || 500,
                [error.message || 'Unknown error']
            );
        }
    }
);
