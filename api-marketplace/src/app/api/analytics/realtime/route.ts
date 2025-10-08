import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/libs/middleware/auth';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';
import { sub } from 'date-fns';

export const GET = authenticateUser(
    async (request: NextRequest & { user: { id: string } }) => {
        const start = sub(new Date(), { hours: 1 });

        const [hourlyStats, recentRequests, activeApis] = await Promise.all([
            prisma.usage.groupBy({
                by: ['apiId', 'timestamp'],
                where: { userId: request.user.id, timestamp: { gte: start } },
                _count: { _all: true },
                _avg: { responseTime: true },
                _sum: { statusCode: true },
            }),
            prisma.usage.findMany({
                where: { userId: request.user.id, timestamp: { gte: start } },
                orderBy: { timestamp: 'desc' },
                take: 50,
            }),
            prisma.api.findMany({
                where: {
                    isActive: true,
                    subscriptions: {
                        some: { userId: request.user.id, isActive: true },
                    },
                },
                include: {
                    _count: {
                        select: {
                            subscriptions: { where: { isActive: true } },
                            reviews: true,
                        },
                    },
                },
            }),
        ]);
        return NextResponse.json({
            hourlyStats: hourlyStats.map((item) => ({
                minute: item.timestamp,
                apiId: item.apiId,
                apiName:
                    (await prisma.api.findUnique({ where: { id: item.apiId } }))
                        ?.name || 'Unknown',
                requests: item._count._all,
                errors: item._sum.statusCode
                    ? item._sum.statusCode >= 400
                        ? item._count._all
                        : 0
                    : 0,
                avgResponseTime: item._avg.responseTime || 0,
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
                errors: api.rating < 3 ? api._count.reviews : 0, // Simplified
                errorRate:
                    api.rating < 3 ? api._count.reviews / api.totalRequests : 0,
                avgResponseTime: api.rating, // Simplified
            })),
            timestamp: new Date().toISOString(),
        });
    }
);
