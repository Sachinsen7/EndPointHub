import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { forgotPasswordSchema } from '@/libs/validations/auth';
import { UserModel } from '@/libs/db/models';
import { generateEmailVerificationToken } from '@/libs/utils/crypto';
import { sendPasswordResetEmail } from '@/libs/utils/email';
import { ApiError } from '@/libs/utils/error';

export const POST = validateBody(forgotPasswordSchema)(async (
    request: NextRequest
) => {
    const { email } = (request as any).validatedData;

    const user = await UserModel.findByEmail(email);
    if (!user) {
        return NextResponse.json({
            message: 'If the email exists, a reset link has been sent',
        });
    }

    const resetToken = generateEmailVerificationToken();
    await UserModel.update(user.id, {
        resetToken: resetToken,
        resetTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
        message: 'If the email exists, a reset link has been sent',
    });
});
