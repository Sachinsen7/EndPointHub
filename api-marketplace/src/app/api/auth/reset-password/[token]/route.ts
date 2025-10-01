import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { resetPasswordSchema } from '@/libs/validations/auth';
import { UserModel } from '@/libs/db/models';
import { hashPassword } from '@/libs/utils/crypto';
import { ApiError } from '@/libs/utils/error';

export const POST = validateBody(resetPasswordSchema)(async (
    request: NextRequest,
    { params }: { params: { token: string } }
) => {
    const { password } = (request as any).validatedData;
    const { token } = params;

    const updatedUser = await UserModel.resetPassword(token, password);
    if (!updatedUser) {
        throw new ApiError('Invalid or expired reset token', 400);
    }

    return NextResponse.json({ message: 'Password reset successfully' });
});
