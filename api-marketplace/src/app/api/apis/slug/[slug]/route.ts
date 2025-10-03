import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';

export const GET = async (
    request: NextRequest,
    { params }: { params: { slug: string } }
) => {
    const api = await prisma.api.findUnique({
        where: { slug: params.slug, isActive: true },
        include: {
            owner: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    company: true,
                },
            },
            _count: {
                select: {
                    subscriptions: { where: { isActive: true } },
                    reviews: true,
                },
            },
        },
    });

    if (!api) {
        throw new ApiError('API not found', 404);
    }

    return NextResponse.json({ api });
};
