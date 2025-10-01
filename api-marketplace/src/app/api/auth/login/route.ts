import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { loginSchema } from '@/libs/validations/auth';
import { UserModel } from '@/libs/db/models';
import { RefreshTokenModel } from '@/libs/db/models/RefreshToken';
import { generateAccessToken, generateRefreshToken } from '@/libs/utils/crypto';
import { config } from '@/libs/config/env';
import { ApiError } from '@/libs/utils/error';

export const POST = validateBody(loginSchema)(async (request: NextRequest) => {
    const { email, password } = (request as any).validatedData;

    const user = await UserModel.validatePassword(email, password);
    if (!user) {
        throw new ApiError('Invalid credentials', 401);
    }

    if (!user.emailVerified) {
        throw new ApiError('Please verify your email first', 403);
    }

    const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    await RefreshTokenModel.create(
        user.id,
        refreshToken,
        new Date(
            Date.now() +
                Number(config.jwt.refreshExpiresIn!.replace('d', '')) *
                    24 *
                    60 *
                    60 *
                    1000
        )
    );

    await UserModel.updateLastLogin(user.id);

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        },
        accessToken,
        refreshToken,
    });
});
