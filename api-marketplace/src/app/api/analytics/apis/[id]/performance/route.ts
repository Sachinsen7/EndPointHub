import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { performanceSchema } from '@/libs/validations/analytics';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';
import { sub } from 'date-fns';

export const GET = validateQuery(performanceSchema)(
    authenticateUser(
        async (
            request: NextRequest & { user: { id: string } },
            { params }: { params: { id: string } }
        ) => {
            const { period, metrics } = (request as any).validatedQuery;
            const start = sub(new Date(), {
                [period === '24h' ? 'hours' : 'days']: period.replace('d', ''),
            });

            const data = await prisma.usage.groupBy({
                by: ['apiId'],
                where: {
                    userId: request.user.id,
                    apiId: params.id,
                    timestamp: { gte: start },
                },
                _count: { _all: true },
                _avg: { responseTime: true },
                _sum: { statusCode: true },
            });

            const api = await prisma.api.findUnique({
                where: { id: params.id },
            });
            if (!api) {
                throw new ApiError('API not found', 404);
            }

            return NextResponse.json({
                apiId: params.id,
                apiName: api.name,
                requests: data[0]?._count._all || 0,
                avgResponseTime: data[0]?._avg.responseTime || 0,
                errors: data[0]?._sum.statusCode
                    ? data[0]._sum.statusCode >= 400
                        ? data[0]._count._all
                        : 0
                    : 0,
            });
        }
    )
);
