import z from 'zod';

export const updateProfileSchema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    company: z.string().optional(),
    bio: z.string().max(500).optional(),
    website: z.string().url().optional(),
    avatar: z.string().url().optional(),
});

export const createApiKeySchema = z.object({
    name: z.string().min(3, 'API key name must be at least 3 characters'),
    description: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    permissions: z.array(z.string()).default(['read']),
});
