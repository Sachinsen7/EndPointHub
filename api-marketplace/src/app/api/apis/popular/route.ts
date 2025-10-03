import { NextRequest, NextResponse } from 'next/server';
import { validateQuery } from '@/libs/middleware/validation';
import { z } from 'zod';
import { APIModel } from '@/libs/db/models';

const popularSchema = z.object({
    limit: z.string().transform(Number).optional().default(10),
});

export const GET = validateQuery(popularSchema)(async (
    request: NextRequest
) => {
    const { limit } = (request as any).validatedQuery;
    const apis = await APIModel.getPopular(limit);
    return NextResponse.json({ apis });
});
