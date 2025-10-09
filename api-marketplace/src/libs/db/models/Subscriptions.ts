import { prisma } from '../connections';
import { Prisma } from '@/generated/prisma';

export class SubscriptionsModel {
    static async create(data: Prisma.SubscriptionCreateInput) {
        return prisma.subscription.create({
            data,
            include: {
                api: { select: { id: true, name: true, category: true } },
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    static async findByUserAndApi(userId: string, apiId: string) {
        return prisma.subscription.findUnique({
            where: { userId_apiId: { userId, apiId } },
            include: {
                api: { select: { id: true, name: true, category: true } },
            },
        });
    }

    static async findByUserId(userId: string) {
        return prisma.subscription.findMany({
            where: { userId, isActive: true },
            include: {
                api: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        rating: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async updateUsage(userId: string, apiId: string, increment = 1) {
        return prisma.subscription.update({
            where: { userId_apiId: { userId, apiId } },
            data: { currentUsage: { increment } },
        });
    }

    static async resetMonthlyUsage() {
        return prisma.subscription.updateMany({
            where: { isActive: true },
            data: { currentUsage: 0 },
        });
    }

    static async cancel(userId: string, apiId: string) {
        return prisma.subscription.update({
            where: { userId_apiId: { userId, apiId } },
            data: { isActive: false, canceledAt: new Date() },
        });
    }

    static async getExpiringSoon(days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return prisma.subscription.findMany({
            where: {
                isActive: true,
                expiresAt: { lte: futureDate, gte: new Date() },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                api: { select: { id: true, name: true } },
            },
        });
    }
}
