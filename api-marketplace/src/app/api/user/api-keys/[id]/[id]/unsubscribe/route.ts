import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/libs/middleware/auth';
import { SubscriptionsModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';

export const DELETE = authenticateUser(
    async (
        request: NextRequest & { user: { id: string } },
        { params }: { params: Promise<{ id: string }> }
    ) => {
        const user = request.user;
        const { id } = await params;

        const subscription = await SubscriptionsModel.findByUserAndApi(
            user.id,
            id
        );
        if (!subscription) {
            throw new ApiError('Subscription not found', 404);
        }

        await SubscriptionsModel.cancel(subscription.id, user.id);
        return NextResponse.json({ message: 'Unsubscribed successfully' });
    }
);
