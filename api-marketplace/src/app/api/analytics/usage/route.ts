import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { analyticsQuerySchema } from '@/libs/validations/analytics';
import { UsageModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';
import { prisma } from '@/libs/db/connections';
import { sub } from 'date-fns';

export const GET = validateQuery(analyticsQuerySchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const { period, apiId, startDate, endDate, groupBy, metrics } = (
                request as any
            ).validatedQuery;
            const user = request.user;

            const start = startDate
                ? new Date(startDate)
                : sub(new Date(), {
                      [period === '24h' ? 'hours' : 'days']: period.replace(
                          'd',
                          ''
                      ),
                  });
            const end = endDate ? new Date(endDate) : new Date();

            const where = {
                userId: user.id,
                ...(apiId && { apiId }),
                timestamp: { gte: start, lte: end },
            };

            const [summary, chartData, apiNames] = await Promise.all([
                prisma.usage.aggregate({
                    where,
                    _sum: { responseTime: true, statusCode: true },
                    _count: { _all: true },
                }),
                prisma.usage.groupBy({
                    by: [groupBy || 'day', 'apiId'],
                    where,
                    _count: { _all: true },
                    _avg: { responseTime: true },
                    _sum: { statusCode: true },
                }),
                prisma.api.findMany({
                    where: {
                        id: {
                            in: apiId ? [apiId] : undefined,
                        },
                    },
                    select: { id: true, name: true },
                }).then((apis) => 
                    Object.fromEntries(apis.map(api => [api.id, api.name]))
                ),
            ]);

            const totalRequests = summary._count._all;
            const errorCount = summary._sum.statusCode
                ? summary._sum.statusCode >= 400
                    ? summary._count._all
                    : 0
                : 0;
            const avgResponseTime = summary._sum.responseTime
                ? summary._sum.responseTime / totalRequests
                : 0;

            return NextResponse.json({
                summary: {
                    totalRequests,
                    errorCount,
                    errorRate: totalRequests ? errorCount / totalRequests : 0,
                    avgResponseTime,
                },
                chartData: chartData.map((item: any) => ({
                    timestamp: item[groupBy || 'day'],
                    apiId: item.apiId,
                    apiName: apiNames[item.apiId] || 'Unknown',
                    requests: item._count._all,
                    errors: item._sum.statusCode
                        ? item._sum.statusCode >= 400
                            ? item._count._all
                            : 0
                        : 0,
                    avgResponseTime: item._avg.responseTime || 0,
                })),
                period,
                dateRange: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                },
            });
        }
    )
);
