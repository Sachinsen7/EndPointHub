import { z } from 'zod';

export const subscriptionSchema = z.object({
    planType: z.enum(['free', 'basic', 'pro', 'enterprise']),
    billingPeriod: z.enum(['monthly', 'yearly']).optional(),
});

export const subscriptionUpdateSchema = subscriptionSchema.partial();
