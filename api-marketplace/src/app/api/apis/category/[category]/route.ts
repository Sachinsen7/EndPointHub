import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { z } from 'zod';
import { APIModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';
import { ApiCategory } from '@/libs/db/models';

const categorySchema = z.object({
    limit: z.string().transform(Number).optional().default(10),
});

export const GET = validateQuery(categorySchema)(async (
    request: NextRequest,
    { params }: { params: { category: string } }
) => {
    const { limit } = (request as any).validatedQuery;
    const category = params.category as ApiCategory;
    const apis = await APIModel.getByCategory(category, limit);
    if (!apis.length) {
        throw new ApiError('No APIs found for this category', 404);
    }
    return NextResponse.json({ apis });
});
