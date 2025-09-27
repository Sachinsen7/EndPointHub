import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
    var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
    return new PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'event' },
            { level: 'warn', emit: 'event' },
            { level: 'info', emit: 'event' },
        ],
        errorFormat: 'pretty',
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
};

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Duration: ${e.duration}ms`);
    }
});

prisma.$on('error', (e) => {
    logger.error('Prisma error:', e);
});

prisma.$on('warn', (e) => {
    logger.warn('Prisma warning:', e);
});

prisma.$on('info', (e) => {
    logger.info('Prisma info:', e);
});

let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const CONNECTION_RETRY_DELAY = 5000;

export const connectDB = async () => {
    if (isConnected) {
        logger.info('Database already connected!');
        return;
    }

    while (connectionAttempts < MAX_CONNECTION_ATTEMPTS && !isConnected) {
        try {
            connectionAttempts++;
            logger.info(
                `Attempting database connection (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`
            );

            await prisma.$connect();

            await prisma.$queryRaw`SELECT 1 as test`;

            isConnected = true;
            connectionAttempts = 0;

            logger.info('PostgreSQL connected successfully');

            prisma.$on('beforeExit', async () => {
                logger.info('Prisma is disconnecting...');
                await prisma.$disconnect();
                isConnected = false;
            });

            return;
        } catch (error) {
            logger.error(
                `Database connection attempt ${connectionAttempts} failed:`,
                error
            );

            if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
                logger.error('Max connection attempts reached. Giving up.');
                throw new Error(
                    'Unable to connect to database after maximum retry attempts'
                );
            }

            // Wait before retrying
            logger.info(`Waiting ${CONNECTION_RETRY_DELAY}ms before retry...`);
            await new Promise((resolve) =>
                setTimeout(resolve, CONNECTION_RETRY_DELAY)
            );
        }
    }
};

export const disconnectDB = async () => {
    if (!isConnected) {
        logger.info('Database is already disconnected');
        return;
    }

    try {
        await prisma.$disconnect();
        isConnected = false;
        logger.info('Database disconnected successfully');
    } catch (error) {
        logger.error('Database disconnection failed:', error);
        throw error;
    }
};

export const checkDBHealth = async () => {
    const startTime = Date.now();

    try {
        await prisma.$queryRaw`SELECT 1 as test`;

        const testWrite = await prisma.$queryRaw`SELECT NOW() as current_time`;
        const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT count(*) FROM users) as user_count,
        (SELECT count(*) FROM apis) as api_count,
        (SELECT count(*) FROM usage WHERE timestamp > NOW() - INTERVAL '1 hour') as recent_usage
    `;

        const responseTime = Date.now() - startTime;

        return {
            status: 'healthy',
            timestamp: new Date(),
            responseTime: `${responseTime}ms`,
            stats,
            connection: {
                isConnected,
                attempts: connectionAttempts,
            },
        };
    } catch (error: any) {
        logger.error('Database health check failed:', error);
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date(),
            responseTime: `${Date.now() - startTime}ms`,
            connection: {
                isConnected,
                attempts: connectionAttempts,
            },
        };
    }
};

export const withTransaction = async <T>(
    fn: (
        prisma: Omit<
            PrismaClient,
            '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
        >
    ) => Promise<T>,
    options: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionClient;
        retries?: number;
    } = {}
): Promise<T> => {
    const {
        maxWait = 5000,
        timeout = 10000,
        isolationLevel,
        retries = 3,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await prisma.$transaction(fn, {
                maxWait,
                timeout,
                isolationLevel,
            });
        } catch (error) {
            lastError = error as Error;
            logger.warn(
                `Transaction attempt ${attempt}/${retries} failed:`,
                error
            );

            if (attempt === retries) {
                break;
            }

            // Exponential backoff
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
};

export const bulkOperation = async <T>(
    operation: (batch: T[]) => Promise<any>,
    data: T[],
    batchSize = 1000
): Promise<void> => {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        await operation(batch);
    }
};

export const getConnectionStatus = () => ({
    isConnected,
    attempts: connectionAttempts,
    maxAttempts: MAX_CONNECTION_ATTEMPTS,
    client: prisma,
});

if (typeof window === 'undefined') {
    connectDB().catch((error) => {
        logger.error('Failed to initialize database connection:', error);
    });
}

if (typeof window === 'undefined') {
    const gracefulShutdown = async (signal: string) => {
        logger.info(`${signal} received, closing database connection...`);
        try {
            await disconnectDB();
            process.exit(0);
        } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    process.on('uncaughtException', async (error) => {
        logger.error('Uncaught Exception:', error);
        await disconnectDB();
        process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        await disconnectDB();
        process.exit(1);
    });
}
