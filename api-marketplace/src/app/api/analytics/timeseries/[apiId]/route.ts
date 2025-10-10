import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { analyticsQuerySchema } from '@/libs/validations/analytics';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';
import { sub } from 'date-fns';

export const GET = validateQuery(analyticsQuerySchema)(
    authenticateUser(
        async (
            request: NextRequest & { user: { id: string } },
            { params }: { params: Promise<{ apiId: string }> }
        ) => {
            const { period, groupBy } = (request as any).validatedQuery;
            const { apiId } = await params;
            const start = sub(new Date(), {
                [period === '24h' ? 'hours' : 'days']: period.replace('d', ''),
            });

            const data = await prisma.usage.groupBy({
                by: [groupBy || 'day', 'apiId'],
                where: {
                    userId: request.user.id,
                    apiId,
                    timestamp: { gte: start },
                },
                _count: { _all: true },
                _avg: { responseTime: true },
                _sum: { statusCode: true },
            });

            return NextResponse.json(
                data.map((item: any) => ({
                    timestamp: item[groupBy || 'day'],
                    apiId: item.apiId,
                    apiName:
                        prisma.api.findUnique({
                            where: { id: item.apiId },
                        })?.name || 'Unknown',
                    requests: item._count._all,
                    errors: item._sum.statusCode
                        ? item._sum.statusCode >= 400
                            ? item._count._all
                            : 0
                        : 0,
                    avgResponseTime: item._avg.responseTime || 0,
                }))
            );
        }
    )
);
