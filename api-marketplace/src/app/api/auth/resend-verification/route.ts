import { NextResponse } from 'next/server';
import { authenticateUser, AuthenticatedRequest } from '@/libs/middleware/auth';
import { UserModel } from '@/libs/db/models';
import { generateEmailVerificationToken } from '@/libs/utils/crypto';
import { sendVerificationEmail } from '@/libs/utils/email';
import { ApiError } from '@/libs/utils/error';

export const POST = authenticateUser(async (request: AuthenticatedRequest) => {
    if (!request.user) {
        throw new ApiError('Unauthorized', 401);
    }

    const user = await UserModel.findById(request.user.id);
    if (!user) {
        throw new ApiError('User not found', 404);
    }

    if (user.emailVerified) {
        throw new ApiError('Email already verified', 400);
    }

    const verificationToken = generateEmailVerificationToken();

    await UserModel.update(user.id, { verificationToken });

    await sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json({ message: 'Verification email sent' });
});
