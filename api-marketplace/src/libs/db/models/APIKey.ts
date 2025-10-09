import { prisma } from '../connections';
import { Prisma } from '@/generated/prisma';
import { generateApiKey, hasApiKey } from '@/libs/utils/crypto';

export class APIKeyModel {
    static async create(
        userId: string,
        data: Omit<Prisma.ApiKeyCreateInput, 'user' | 'key' | 'keyHash'>
    ) {
        const key = generateApiKey();
        const keyHash = await hasApiKey(key);
        return prisma.apiKey.create({
            data: { ...data, key, keyHash, user: { connect: { id: userId } } },
            select: {
                id: true,
                name: true,
                description: true,
                key: true,
                permissions: true,
                isActive: true,
                expiresAt: true,
                rateLimit: true,
                createdAt: true,
            },
        });
    }

    static async findById(id: string) {
        return prisma.apiKey.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                name: true,
                description: true,
                key: true,
                keyHash: true,
                permissions: true,
                isActive: true,
                lastUsedAt: true,
                expiresAt: true,
                rateLimit: true,
                createdAt: true,
            },
        });
    }

    static async findByUserId(userId: string) {
        return prisma.apiKey.findMany({
            where: { userId, isActive: true },
            select: {
                id: true,
                name: true,
                description: true,
                key: true,
                permissions: true,
                isActive: true,
                lastUsedAt: true,
                expiresAt: true,
                rateLimit: true,
                createdAt: true,
                _count: {
                    select: {
                        usage: {
                            where: {
                                timestamp: {
                                    gte: new Date(
                                        Date.now() - 30 * 24 * 60 * 60 * 1000
                                    ),
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async update(id: string, data: Prisma.ApiKeyUpdateInput) {
        return prisma.apiKey.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                description: true,
                key: true,
                permissions: true,
                isActive: true,
                expiresAt: true,
                rateLimit: true,
                createdAt: true,
            },
        });
    }

    static async updateLastUsed(id: string) {
        return prisma.apiKey.update({
            where: { id },
            data: { lastUsedAt: new Date() },
        });
    }

    static async revoke(id: string, userId: string) {
        return prisma.apiKey.update({
            where: { id, userId },
            data: { isActive: false },
        });
    }

    static async delete(id: string) {
        return prisma.apiKey.delete({
            where: { id },
        });
    }

    static async validatePermission(apiKeyId: string, permission: string) {
        const apiKey = await prisma.apiKey.findUnique({
            where: { id: apiKeyId },
            select: { permissions: true },
        });
        return apiKey?.permissions.includes(permission) || false;
    }
}
