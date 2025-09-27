import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@endpointhub.com' },
        update: {},
        create: {
            email: 'admin@endpointhub.com',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            isActive: true,
            emailVerified: true,
        },
    });

    //create test user

    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'user@endpointhub.com' },
        update: {},
        create: {
            email: 'user@endpointhub.com',
            password: userPassword,
            firstName: 'John',
            lastName: 'User',
            role: 'USER',
            isActive: true,
            emailVerified: true,
        },
    });

    const weatherApi = await prisma.api.upsert({
        where: { slug: 'weather-api' },
        update: {},
        create: {
            name: 'Weather API',
            description: 'Get current weather data for any location worldwide',
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            category: 'WEATHER',
            slug: 'weather-api',
            tags: ['weather', 'forecast', 'climate'],
            pricing: {
                free: true,
                pricePerRequest: 0,
                monthlyLimit: 1000,
            },
            ownerId: admin.id,
        },
    });

    const newsApi = await prisma.api.upsert({
        where: { slug: 'news-api' },
        update: {},
        create: {
            name: 'News API',
            description:
                'Access breaking news and historical articles from thousands of sources',
            baseUrl: 'https://newsapi.org/v2',
            category: 'NEWS',
            slug: 'news-api',
            tags: ['news', 'articles', 'journalism'],
            pricing: {
                free: true,
                pricePerRequest: 0,
                monthlyLimit: 500,
            },
            ownerId: admin.id,
        },
    });

    console.log('Database seeded successfully!');
    console.log('Admin user: admin@endpointhub.com / admin123');
    console.log('Test user: user@endpointhub.com / user123');
}

main()
    .catch(() => {
        console.error('Error seeding the database');
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
