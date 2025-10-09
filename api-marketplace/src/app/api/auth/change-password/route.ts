import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { changePasswordSchema } from '@/libs/validations/auth';
import { prisma } from '@/libs/db/connections';
import { ApiError } from '@/libs/utils/error';
import { hashPassword, verifyPassword } from '@/libs/utils/crypto';
import { Prisma } from '@/generated/prisma';

export const POST = validateBody(changePasswordSchema)(
    authenticateUser(
        async (request: NextRequest & { user: { id: string } }) => {
            const { oldPassword, newPassword } = (request as any)
                .validatedData as {
                oldPassword: string;
                newPassword: string;
            };
            const user = request.user;

            const userRecord = await prisma.user.findUnique({
                where: { id: user.id },
                select: { password: true },
            });
            if (!userRecord || !userRecord.password) {
                throw new ApiError(
                    'User not found or invalid credentials',
                    403
                );
            }

            const isValid = await verifyPassword(
                oldPassword,
                userRecord.password
            );
            if (!isValid) {
                throw new ApiError('Incorrect old password', 400);
            }

            const hashedPassword = await hashPassword(newPassword);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });

            return NextResponse.json(
                { message: 'Password changed successfully' },
                { status: 200 }
            );
        }
    )
);
