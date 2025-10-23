import { NextRequest, NextResponse } from 'next/server';
import { validateBody } from '@/libs/middleware/validation';
import { authenticateUser } from '@/libs/middleware/auth';
import { subscriptionSchema } from '@/libs/validations/subscription';
import { SubscriptionsModel, APIModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';
import { Prisma } from '@/generated/prisma';

export const POST = validateBody(subscriptionSchema)(
    authenticateUser(
        async (
            request: NextRequest & { user: { id: string } },
            { params }: { params: Promise<{ id: string; apiId: string }> }
        ) => {
            const data = (request as any)
                .validatedData as Prisma.SubscriptionCreateInput;
            const user = request.user;
            const { apiId } = await params;

            const api = await APIModel.findById(apiId);
            if (!api || !api.isActive) {
                throw new ApiError('API not found or inactive', 404);
            }

            const existingSubscription =
                await SubscriptionsModel.findByUserAndApi(user.id, apiId);
            if (existingSubscription) {
                throw new ApiError('Already subscribed to this API', 400);
            }

            const subscriptionModel = new SubscriptionsModel();
            const subscription = await SubscriptionsModel.create({
                ...data,
                user: { connect: { id: user.id } },
                api: { connect: { id: apiId } },
                startDate: new Date(),
                monthlyLimit: (api.pricing as any)?.monthlyLimit || 1000,
                isActive: true,
            });

            return NextResponse.json(
                { message: 'Subscribed successfully', subscription },
                { status: 201 }
            );
        }
    )
);

export const DELETE = authenticateUser(
    async (
        request: NextRequest & { user: { id: string } },
        { params }: { params: Promise<{ id: string; apiId: string }> }
    ) => {
        const user = request.user;
        const { apiId } = await params;

        const subscription = await SubscriptionsModel.findByUserAndApi(
            user.id,
            apiId
        );
        if (!subscription || subscription.userId !== user.id) {
            throw new ApiError('Subscription not found or unauthorized', 404);
        }

        await SubscriptionsModel.cancel(user.id, apiId);
        return NextResponse.json({ message: 'Unsubscribed successfully' });
    }
);