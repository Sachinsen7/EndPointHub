import { NextRequest, NextResponse } from 'next/server';
import { APIModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const GET = async (
    request: NextRequest,
    { params }: { params: { id: string } }
) => {
    const api = await APIModel.findById(params.id);
    if (!api) {
        throw new ApiError('API not found', 404);
    }

    return NextResponse.json({ docs: api.documentation || {} });
};
