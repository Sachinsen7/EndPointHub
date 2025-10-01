import { NextResponse } from 'next/server';
import { authenticateUser, AuthenticatedRequest } from '@/libs/middleware/auth';
import { UserModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const GET = authenticateUser(async (request: AuthenticatedRequest) => {
    if (!request.user) {
        throw new ApiError('Unauthorized', 401);
    }

    const user = await UserModel.findById(request.user.id);
    if (!user) {
        throw new ApiError('User not found', 404);
    }

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            company: user.company,
            createdAt: user.createdAt,
        },
    });
});
