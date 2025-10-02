import z from 'zod';

export const createApiSchema = z.object({
    name: z.string().min(3, 'API name must be at least 3 characters'),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters'),
    baseUrl: z.string().url('Invalid base URL'),
    category: z.string().min(1, 'Category is required'),
    version: z.string().default('1.0.0'),
    isPublic: z.boolean().default(true),
    pricing: z.object({
        free: z.boolean().default(true),
        pricePerRequest: z.number().min(0).default(0),
        monthlyLimit: z.number().min(0).default(1000),
    }),
    documentation: z.string().optional(),
    tags: z.array(z.string()).default([]),
});

export const updateApiSchema = createApiSchema.partial();

export const apiSearchSchema = z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().optional().default(10),
    offset: z.number().optional().default(0),
    sortBy: z
        .enum(['name', 'rating', 'totalRequests', 'createdAt'])
        .optional()
        .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    tags: z.string().optional(),
    isPublic: z
        .string()
        .transform((val) => val === 'true')
        .optional()
        .default(true),
});

export const subscribeApiSchema = z.object({
    planType: z.enum(['free', 'basic', 'premium']),
    billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
});
