import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { analyticsQuerySchema } from '@/libs/validations/analytics';
import { prisma } from '@/libs/db/connections';
import { sub } from 'date-fns';

export const GET = validateQuery(analyticsQuerySchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const { period, apiId, statusCode } = (request as any)
                .validatedQuery;
            const start = sub(new Date(), {
                [period === '24h' ? 'hours' : 'days']: period.replace('d', ''),
            });

            const data = await prisma.usage.findMany({
                where: {
                    userId: request.user.id,
                    ...(apiId && { apiId }),
                    ...(statusCode && { statusCode: Number(statusCode) }),
                    timestamp: { gte: start },
                    statusCode: { gte: 400 },
                },
                orderBy: { timestamp: 'desc' },
                take: 100,
            });

            return NextResponse.json(
                data.map((item: any) => ({
                    id: item.id,
                    apiId: item.apiId,
                    method: item.method,
                    path: item.path,
                    statusCode: item.statusCode,
                    responseTime: item.responseTime,
                    timestamp: item.timestamp.toISOString(),
                }))
            );
        }
    )
);
