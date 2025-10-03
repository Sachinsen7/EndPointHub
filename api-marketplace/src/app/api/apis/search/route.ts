import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { apiSearchSchema } from '@/libs/validations/api';
import { APIModel } from '@/libs/db/models';

export const GET = validateQuery(apiSearchSchema)(async (
    request: NextRequest
) => {
    const {
        query,
        category,
        limit,
        offset,
        sortBy,
        sortOrder,
        tags,
        isPublic,
    } = (request as any).validatedQuery;

    const { apis, total } = await APIModel.search({
        query,
        category,
        limit,
        offset,
        sortBy,
        sortOrder,
        isPublic,
        tags: tags ? tags.split(',') : undefined,
    });

    return NextResponse.json({
        apis,
        pagination: {
            page: Math.floor(offset / limit) + 1,
            limit,
            totalCount: total,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrev: offset > 0,
        },
    });
});
