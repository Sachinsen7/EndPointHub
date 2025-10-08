import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/libs/middleware/auth';
import { SubscriptionsModel } from '@/libs/db/models';

export const GET = authenticateUser(
    async (request: NextRequest & { user: { id: string } }) => {
        const subscriptions = await SubscriptionsModel.findByUserId(
            request.user.id
        );
        return NextResponse.json({ subscriptions });
    }
);
