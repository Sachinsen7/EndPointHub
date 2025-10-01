import { NextResponse, NextRequest } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { UserModel } from '@/libs/db/models';
import { registerSchema } from '@/libs/validations/auth';
import {
    generateEmailVerificationToken,
    hashPassword,
} from '@/libs/utils/crypto';
import { ApiError } from '@/libs/utils/error';
import { sendVerificationEmail } from '@/libs/utils/email';

export const POST = validateBody(registerSchema)(async (
    request: NextRequest
) => {
    const { email, password, firstName, lastName } = (request as any)
        .validatedData;

    const existedUser = await UserModel.findByEmail(email);
    if (existedUser) throw new ApiError('Email already exists', 400);

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateEmailVerificationToken();

    const user = await UserModel.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        verificationToken,
    });

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
        {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            message: 'Registration successful. Please verify your email.',
        },
        { status: 201 }
    );
});
