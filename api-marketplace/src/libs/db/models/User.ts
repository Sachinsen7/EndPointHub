import { hashPassword, comparePassword } from '@/libs/utils/crypto';
import { UserRole, Prisma } from '@/generated/prisma';
import { prisma } from '../connections';

export class UserModel {
    static async create(data: Prisma.UserCreateInput) {
        const hashedPassword = await hashPassword(data.password);

        return prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        apiKeys: { where: { isActive: true } },
                        subscriptions: { where: { isActive: true } },
                    },
                },
            },
        });
    }

    static async findByEmail(email: string, includePassword = false) {
        return prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: includePassword,
                firstName: true,
                lastName: true,
                company: true,
                bio: true,
                website: true,
                avatar: true,
                role: true,
                isActive: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                _count: {
                    select: {
                        apiKeys: { where: { isActive: true } },
                        subscriptions: { where: { isActive: true } },
                    },
                },
            },
        });
    }

    static async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                bio: true,
                website: true,
                avatar: true,
                role: true,
                isActive: true,
                emailVerified: true,
                lastLoginAt: true,
                createdAt: true,
                _count: {
                    select: {
                        apiKeys: { where: { isActive: true } },
                        subscriptions: { where: { isActive: true } },
                    },
                },
            },
        });
    }

    static async validatePassword(email: string, password: string) {
        const user = await UserModel.findByEmail(email, true);
        if (!user || !user.password) return null;

        const isValid = await comparePassword(password, user.password);
        if (!isValid) return null;

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async updateLastLogin(id: string) {
        return prisma.user.update({
            where: { id },
            data: { lastLoginAt: new Date() },
        });
    }

    static async update(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                bio: true,
                website: true,
                avatar: true,
                role: true,
                emailVerified: true,
                updatedAt: true,
            },
        });
    }

    static async verifyEmail(token: string) {
        return prisma.user.update({
            where: { verificationToken: token },
            data: {
                emailVerified: true,
                verificationToken: null,
            },
        });
    }

    static async setResetToken(email: string, token: string, expiry: Date) {
        return prisma.user.update({
            where: { email },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry,
            },
        });
    }

    static async resetPassword(token: string, newPassword: string) {
        const hashedPassword = await hashPassword(newPassword);

        return prisma.user.update({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
    }

    static async changePassword(
        id: string,
        currentPassword: string,
        newPassword: string
    ) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { password: true },
        });

        if (!user || !(await comparePassword(currentPassword, user.password))) {
            throw new Error('Current password is incorrect');
        }

        const hashedPassword = await hashPassword(newPassword);

        return prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    static async getStats() {
        return prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
            where: { isActive: true },
        });
    }

    static async search(query: string, limit = 10, offset = 0) {
        return prisma.user.findMany({
            where: {
                isActive: true,
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { company: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
                avatar: true,
                role: true,
                createdAt: true,
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });
    }
}
