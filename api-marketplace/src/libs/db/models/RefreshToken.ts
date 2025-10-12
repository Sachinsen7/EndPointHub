import { prisma } from '../connections';
import { Prisma } from '@prisma/client';
import { hashToken } from '../../utils/crypto';

export class RefreshTokenModel {
    static async create(userId: string, token: string, expiresAt: Date) {
        const tokenHash = await hashToken(token);
        return prisma.refreshToken.create({
            data: {
                token,
                tokenHash,
                userId,
                expiresAt,
            },
        });
    }

    static async findByToken(token: string) {
        return prisma.refreshToken.findFirst({
            where: {
                token,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
    }

    static async revoke(token: string) {
        return prisma.refreshToken.update({
            where: { token },
            data: { isRevoked: true },
        });
    }

    static async revokeAllForUser(userId: string) {
        return prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
    }
}
