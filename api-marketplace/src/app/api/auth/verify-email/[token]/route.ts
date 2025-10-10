import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { verifyEmailSchema } from '@/libs/validations/auth';
import { UserModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const POST = validateBody(verifyEmailSchema)(async (
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) => {
    const { token } = await params;

    const user = await UserModel.verifyEmail(token);
    if (!user) {
        throw new ApiError('Invalid or expired verification token', 400);
    }

    await UserModel.update(user.id, {
        emailVerified: true,
        verificationToken: null,
    });

    return NextResponse.json({ message: 'Email verified successfully' });
});
