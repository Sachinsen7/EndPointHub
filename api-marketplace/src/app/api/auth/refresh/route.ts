import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { z } from 'zod';
import { RefreshTokenModel } from '@/libs/db/models/RefreshToken';
import { generateAccessToken, hashToken } from '@/libs/utils/crypto';
import { ApiError } from '@/libs/utils/error';

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
});

export const POST = validateBody(refreshSchema)(async (
    request: NextRequest
) => {
    const { refreshToken } = (request as any).validatedData;

    const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
    if (
        !tokenRecord ||
        !tokenRecord.user.isActive ||
        !tokenRecord.user.emailVerified
    ) {
        throw new ApiError('Invalid or expired refresh token', 401);
    }

    const accessToken = generateAccessToken({
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
    });

    return NextResponse.json({
        user: {
            id: tokenRecord.user.id,
            email: tokenRecord.user.email,
            firstName: tokenRecord.user.firstName,
            lastName: tokenRecord.user.lastName,
            role: tokenRecord.user.role,
        },
        accessToken,
    });
});
