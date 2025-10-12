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
    let token: string | undefined;
    try {
        const { password } = resetPasswordSchema.parse(await request.json());
        const resolvedParams = await params;
        token = resolvedParams.token;

        const user = await prisma.user.findFirst({
            where: { 
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            },
        });
        if (!user) {
            throw new ApiError('Invalid or expired reset token', 400);
        }

        const hashedPassword = await hashPassword(password);
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            },
        });

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
