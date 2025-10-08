import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { analyticsQuerySchema } from '@/libs/validations/analytics';
import { prisma } from '@/libs/db/connections';
import { sub } from 'date-fns';

export const GET = validateQuery(analyticsQuerySchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const { period } = (request as any).validatedQuery;
            const start = sub(new Date(), {
                [period === '24h' ? 'hours' : 'days']: period.replace('d', ''),
            });

            const [
                totalApis,
                totalRequests,
                totalUsers,
                usageSummary,
                categories,
            ] = await Promise.all([
                prisma.api.count({ where: { isActive: true } }),
                prisma.usage.count({
                    where: {
                        userId: request.user.id,
                        timestamp: { gte: start },
                    },
                }),
                prisma.user.count(),
                prisma.usage.aggregate({
                    where: {
                        userId: request.user.id,
                        timestamp: { gte: start },
                    },
                    _sum: { responseTime: true, statusCode: true },
                    _count: { _all: true },
                }),
                prisma.api.groupBy({
                    by: ['category'],
                    _count: { id: true },
                    where: { isActive: true, isPublic: true },
                }),
            ]);

            return NextResponse.json({
                totalApis,
                totalRequests,
                totalUsers,
                avgResponseTime: usageSummary._sum.responseTime
                    ? usageSummary._sum.responseTime / usageSummary._count._all
                    : 0,
                errorRate: usageSummary._sum.statusCode
                    ? (usageSummary._sum.statusCode >= 400
                          ? usageSummary._count._all
                          : 0) / usageSummary._count._all
                    : 0,
                topCategories: categories.map((item: any) => ({
                    category: item.category,
                    count: item._count.id,
                })),
            });
        }
    )
);
