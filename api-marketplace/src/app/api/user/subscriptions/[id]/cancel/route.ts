import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/libs/middleware/auth';
import { SubscriptionsModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const POST = authenticateUser(
    async (
        request: NextRequest & { user: { id: string } },
        { params }: { params: { id: string } }
    ) => {
        const user = request.user;

        const subscription = await SubscriptionsModel.findByUserAndApi(
            user.id,
            params.id
        );
        if (!subscription || subscription.userId !== user.id) {
            throw new ApiError('Subscription not found or unauthorized', 403);
        }

        await SubscriptionsModel.cancel(user.id, params.id);
        return NextResponse.json({
            message: 'Subscription canceled successfully',
        });
    }
);
