import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { analyticsQuerySchema } from '@/libs/validations/analytics';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';
import { sub } from 'date-fns';

export const GET = validateQuery(analyticsQuerySchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const { period, userId } = (request as any).validatedQuery;
            const start = sub(new Date(), {
                [period === '24h' ? 'hours' : 'days']: period.replace('d', ''),
            });

            const where = {
                userId: userId || request.user.id,
                timestamp: { gte: start },
            };

            const data = await prisma.usage.groupBy({
                by: ['userId'],
                where,
                _count: { _all: true },
                _avg: { responseTime: true },
            });

            return NextResponse.json(
                data.map((item: any) => ({
                    userId: item.userId,
                    requests: item._count._all,
                    avgResponseTime: item._avg.responseTime || 0,
                }))
            );
        }
    )
);
