import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { apiKeyUpdateSchema } from '@/libs/validations/apiKey';
import { APIKeyModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const PUT = validateBody(apiKeyUpdateSchema)(
    authenticateUser(
        async (
            request: NextRequest & { user: { id: string } },
            { params }: { params: { id: string } }
        ) => {
            const data = (request as any).validatedData;
            const user = request.user;

            const key = await APIKeyModel.findById(params.id);
            if (!key || key.userId !== user.id) {
                throw new ApiError('API key not found or unauthorized', 403);
            }

            const updatedKey = await APIKeyModel.update(params.id, data);
            return NextResponse.json({
                message: 'API key updated successfully',
                apiKey: updatedKey,
            });
        }
    )
);

export const DELETE = authenticateUser(
    async (
        request: NextRequest & { user: { id: string } },
        { params }: { params: { id: string } }
    ) => {
        const user = request.user;

        const key = await APIKeyModel.findById(params.id);
        if (!key || key.userId !== user.id) {
            throw new ApiError('API key not found or unauthorized', 403);
        }

        await APIKeyModel.delete(params.id);
        return NextResponse.json({ message: 'API key deleted successfully' });
    }
);
