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
