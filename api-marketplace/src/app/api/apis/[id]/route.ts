import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser, AuthenticatedRequest } from '@/libs/middleware/auth';
import { updateApiSchema } from '@/libs/validations/api';
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
    return NextResponse.json({ api });
};

export const PUT = validateBody(updateApiSchema)(
    authenticateUser(
        async (
            request: AuthenticatedRequest,
            { params }: { params: { id: string } }
        ) => {
            const data = (request as any).validatedData;
            const user = request.user;

            const api = await APIModel.findById(params.id);
            if (!api || api.ownerId !== user.id) {
                throw new ApiError('API not found or unauthorized', 403);
            }

            const updatedApi = await APIModel.update(params.id, data);
            return NextResponse.json({
                message: 'API updated successfully',
                api: updatedApi,
            });
        }
    )
);

export const DELETE = authenticateUser(
    async (
        request: AuthenticatedRequest,
        { params }: { params: { id: string } }
    ) => {
        const user = request.user;

        const api = await APIModel.findById(params.id);
        if (!api || api.ownerId !== user.id) {
            throw new ApiError('API not found or unauthorized', 403);
        }

        await APIModel.delete(params.id);
        return NextResponse.json({ message: 'API deleted successfully' });
    }
);
