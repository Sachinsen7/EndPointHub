import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { forgotPasswordSchema } from '@/libs/validations/auth';
import { UserModel } from '@/libs/db/models';
import { generateResetToken } from '@/libs/utils/crypto';
import { ApiError } from '@/libs/utils/error';

export const POST = validateBody(forgotPasswordSchema)(async (request: NextRequest) => {
    const { email } = (request as any).validatedData;

    const user = await UserModel.findByEmail(email);
    if (!user) {
        // Don't reveal if email exists or not for security
        return NextResponse.json({
            message: 'If an account with that email exists, we have sent a password reset link.',
        });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserModel.setResetToken(email, resetToken, resetTokenExpiry);

    // In a real app, you would send an email here
    // For now, we'll just return the token for testing
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.',
        // Remove this in production - only for testing
        resetToken: resetToken,
    });
});