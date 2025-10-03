import { NextRequest, NextResponse } from 'next/server';
import { validateBody, validateQuery } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { createApiSchema, apiSearchSchema } from '@/libs/validations/api';
import { APIModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

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

export const POST = validateBody(createApiSchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const data = (request as any).validatedData;
            const user = request.user;

            const api = await APIModel.create({
                ...data,
                ownerId: user.id,
            });

            return NextResponse.json(
                { message: 'API created successfully', api },
                { status: 201 }
            );
        }
    )
);
