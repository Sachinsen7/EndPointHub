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
            { params }: { params: { id: string } }
        ) => {
            const data = (request as any)
                .validatedData as Prisma.SubscriptionCreateInput;
            const user = request.user;

            const api = await APIModel.findById(params.id);
            if (!api || !api.isActive) {
                throw new ApiError('API not found or inactive', 404);
            }

            const existingSubscription =
                await SubscriptionsModel.findByUserAndApi(user.id, params.id);
            if (existingSubscription) {
                throw new ApiError('Already subscribed to this API', 400);
            }

            const subscription = await SubscriptionsModel.create({
                ...data,
                user: { connect: { id: user.id } },
                api: { connect: { id: params.id } },
                startDate: new Date(),
                monthlyLimit: api.pricing.monthlyLimit,
                isActive: true,
            });

            return NextResponse.json(
                { message: 'Subscribed successfully', subscription },
                { status: 201 }
            );
        }
    )
);
