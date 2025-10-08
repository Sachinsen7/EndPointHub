import { z } from 'zod';

export const apiKeySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    permissions: z.array(z.string()).optional(),
    rateLimit: z.number().min(0).optional(),
});

export const apiKeyUpdateSchema = apiKeySchema.partial();
