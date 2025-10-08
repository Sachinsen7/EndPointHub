import z from 'zod';

export const analyticsQuerySchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    apiId: z.string().optional(),
    groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
    metrics: z
        .array(z.enum(['requests', 'errors', 'latency', 'users']))
        .default(['requests']),
});

export const usageQuerySchema = z.object({
    period: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
    apiId: z.string().optional(),
});

export const topApisSchema = z.object({
    period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
    limit: z.string().transform(Number).optional().default(10),
    category: z.string().optional(),
});

export const performanceSchema = z.object({
    period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
    metrics: z.string().optional(),
});
