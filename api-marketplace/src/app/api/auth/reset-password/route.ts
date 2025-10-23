import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { resetPasswordSchema } from '@/libs/validations/auth';
import { UserModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const POST = validateBody(resetPasswordSchema)(async (request: NextRequest) => {
    const { token, password } = (request as any).validatedData;

    const user = await UserModel.resetPassword(token, password);
    if (!user) {
        throw new ApiError('Invalid or expired reset token', 400);
    }

    return NextResponse.json({
        message: 'Password has been reset successfully. You can now login with your new password.',
    });
});