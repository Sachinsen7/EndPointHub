import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { verifyEmailSchema } from '@/libs/validations/auth';
import { UserModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const GET = async (
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) => {
    const { token } = await params;

    const user = await UserModel.verifyEmail(token);
    if (!user) {
        throw new ApiError('Invalid or expired verification token', 400);
    }

    return NextResponse.json({
        message: 'Email verified successfully',
        user: {
            id: user.id,
            email: user.email,
            emailVerified: true
        }
    });
};

export const POST = async (
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) => {
    const { token } = await params;

    if (!token) {
        throw new ApiError('Verification token is required', 400);
    }

    const user = await UserModel.verifyEmail(token);
    if (!user) {
        throw new ApiError('Invalid or expired verification token', 400);
    }

    return NextResponse.json({
        message: 'Email verified successfully',
        user: {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified
        }
    });
};
