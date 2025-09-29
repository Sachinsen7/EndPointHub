import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string().optional(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    NEXTAUTH_SECRET: z.string(),
    NEXTAUTH_URL: z.string().url(),
    EMAIL_HOST: z.string().optional(),
    EMAIL_PORT: z.string().transform(Number).optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    RATE_LIMIT_REQUESTS: z.string().transform(Number).default(100),
    RATE_LIMIT_WINDOW: z.string().transform(Number).default(900000),
});

const env = envSchema.parse(process.env);

export const config = {
    nodeEnv: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.DATABASE_URL,
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    nextAuth: {
        secret: env.NEXTAUTH_SECRET,
        url: env.NEXTAUTH_URL,
    },
    email: {
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
    rateLimit: {
        requests: env.RATE_LIMIT_REQUESTS,
        window: env.RATE_LIMIT_WINDOW,
    },
};
