import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { topApisSchema } from '@/libs/validations/analytics';
import { APIModel } from '@/libs/db/models';
import { sub } from 'date-fns';

export const GET = validateQuery(topApisSchema)(async (
    request: NextRequest
) => {
    const { period, limit, category } = (request as any).validatedQuery;
    const start = sub(new Date(), {
        [period === '24h' ? 'hours' : 'days']: period.replace('d', ''),
    });

    const apis = await APIModel.search({
        category,
        limit,
        isPublic: true,
        sortBy: 'totalRequests',
        sortOrder: 'desc',
    });

    return NextResponse.json({
        apis: apis.apis.map((api: any) => ({
            id: api.id,
            name: api.name,
            category: api.category,
            requests: api.totalRequests,
            growth: 0,
            rating: api.rating,
        })),
    });
});
