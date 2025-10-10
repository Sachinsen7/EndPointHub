import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';
import { hashPassword } from '@/libs/utils/crypto';
import { logger } from '@/libs/utils/logger';
import { z } from 'zod';

const resetPasswordSchema = z.object({
    password: z.string().min(8),
});

export const POST = async (
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) => {
    try {
        const { password } = resetPasswordSchema.parse(await request.json());
        const { token } = await params;

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (
            !resetToken ||
            !resetToken.user ||
            resetToken.expiresAt < new Date()
        ) {
            throw new ApiError('Invalid or expired reset token', 400);
        }

        const hashedPassword = await hashPassword(password);
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.delete({
                where: { token },
            }),
        ]);

        return NextResponse.json(
            { message: 'Password reset successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        logger.error('Reset password error', {
            error: error.message,
            token,
        });
        throw error instanceof ApiError || error instanceof z.ZodError
            ? error
            : new ApiError('Failed to reset password', 500, [
                  error.message || 'Unknown error',
              ]);
    }
};
