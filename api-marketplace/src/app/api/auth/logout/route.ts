import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, AuthenticatedRequest } from '@/libs/middleware/auth';
import { RefreshTokenModel } from '@/libs/db/models/RefreshToken';
import { ApiError } from '@/libs/utils/error';

export const POST = authenticateUser(async (request: AuthenticatedRequest) => {
    if (!request.user) {
        throw new ApiError('Unauthorized', 401);
    }

    const { refreshToken } = await request.json();

    if (refreshToken) {
        await RefreshTokenModel.revoke(refreshToken);
    } else {
        await RefreshTokenModel.revokeAllForUser(request.user.id);
    }

    return NextResponse.json({ message: 'Logged out successfully' });
});
