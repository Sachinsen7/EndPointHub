import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/libs/middleware/auth';
import { APIKeyModel } from '@/libs/db/models';
import { generateApiKey, hasApiKey } from '@/libs/utils/crypto';
import { ApiError } from '@/libs/utils/error';

export const POST = authenticateUser(
    async (
        request: NextRequest & { user: { id: string } },
        { params }: { params: Promise<{ id: string }> }
    ) => {
        const user = request.user;
        const { id } = await params;

        const key = await APIKeyModel.findById(id);
        if (!key || key.userId !== user.id) {
            throw new ApiError('API key not found or unauthorized', 403);
        }

        const newKey = generateApiKey();
        const keyHash = await hasApiKey(newKey);

        const updatedKey = await APIKeyModel.update(id, {
            key: newKey,
            keyHash,
        });
        return NextResponse.json({
            message: 'API key regenerated successfully',
            apiKey: updatedKey,
        });
    }
);
