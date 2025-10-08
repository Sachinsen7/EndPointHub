import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { analyticsQuerySchema } from '@/libs/validations/analytics';
import { prisma } from '@/libs/db/connections';
import { sub } from 'date-fns';

export const GET = validateQuery(analyticsQuerySchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const { period, apiId } = (request as any).validatedQuery;
            const start = sub(new Date(), {
                [period === '24h' ? 'hours' : 'days']: period.replace('d', ''),
            });

            const data = await prisma.usage.groupBy({
                by: ['country'],
                where: {
                    userId: request.user.id,
                    ...(apiId && { apiId }),
                    timestamp: { gte: start },
                },
                _count: { _all: true },
            });

            return NextResponse.json(
                data.map((item: any) => ({
                    country: item.country || 'Unknown',
                    requests: item._count._all,
                }))
            );
        }
    )
);
