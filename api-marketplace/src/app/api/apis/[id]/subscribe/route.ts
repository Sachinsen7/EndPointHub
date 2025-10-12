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
            { params }: { params: Promise<{ id: string }> }
        ) => {
            const data = (request as any)
                .validatedData as Prisma.SubscriptionCreateInput;
            const user = request.user;
            const { id } = await params;

            const api = await APIModel.findById(id);
            if (!api || !api.isActive) {
                throw new ApiError('API not found or inactive', 404);
            }

            const existingSubscription =
                await SubscriptionsModel.findByUserAndApi(user.id, id);
            if (existingSubscription) {
                throw new ApiError('Already subscribed to this API', 400);
            }

            const subscription = await SubscriptionsModel.create({
                ...data,
                user: { connect: { id: user.id } },
                api: { connect: { id } },
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
