import { Prisma, ApiCategory, ApiStatus } from '@/generated/prisma';
import { prisma } from '../connections';
import { ApiError } from '@/libs/utils/error';

interface ApiSearchParams {
    query?: string;
    category?: string;
    isPublic?: boolean;
    ownerId?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'rating' | 'totalRequests' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    tags?: string[];
}

export class APIModel {
    static async create(data: Prisma.ApiCreateInput) {
        try {
            return await prisma.api.create({
                data,
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            company: true,
                        },
                    },
                },
            });
        } catch (error) {
            throw new ApiError('Failed to create API', 500, [error as string]);
        }
    }

    static async findById(id: string) {
        return prisma.api.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
                endpoints: {
                    where: { isActive: true },
                },
                _count: {
                    select: {
                        subscriptions: { where: { isActive: true } },
                        reviews: true,
                        usage: {
                            where: {
                                timestamp: {
                                    gte: new Date(
                                        Date.now() - 30 * 24 * 60 * 60 * 1000
                                    ), // Last 30 days
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    static async findBySlug(slug: string) {
        return prisma.api.findUnique({
            where: { slug },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
                endpoints: {
                    where: { isActive: true },
                },
            },
        });
    }

    static async search(params: ApiSearchParams) {
        const {
            query,
            category,
            isPublic = true,
            ownerId,
            limit = 10,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = params;

        try {
            const where: Prisma.ApiWhereInput = {
                isActive: true,
                ...(isPublic !== undefined && { isPublic }),
                ...(category && { category: category as ApiCategory }),
                ...(ownerId && { ownerId }),
                ...(query && {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        {
                            description: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        { tags: { has: query } },
                    ],
                }),
            };

            const [apis, total] = await Promise.all([
                prisma.api.findMany({
                    where,
                    include: {
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                company: true,
                            },
                        },
                        _count: {
                            select: {
                                subscriptions: { where: { isActive: true } },
                                reviews: true,
                            },
                        },
                    },
                    take: limit,
                    skip: offset,
                    orderBy: { [sortBy]: sortOrder },
                }),
                prisma.api.count({ where }),
            ]);

            return { apis, total };
        } catch (error) {
            throw new ApiError('Failed to search APIs', 500, [error as string]);
        }
    }

    static async update(id: string, data: Prisma.ApiUpdateInput) {
        return prisma.api.update({
            where: { id },
            data,
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
            },
        });
    }

    static async delete(id: string) {
        return prisma.api.update({
            where: { id },
            data: { isActive: false },
        });
    }

    static async incrementRequests(id: string, count = 1) {
        return prisma.api.update({
            where: { id },
            data: {
                totalRequests: {
                    increment: count,
                },
            },
        });
    }

    static async updateRating(id: string) {
        const avgRating = await prisma.review.aggregate({
            where: { apiId: id, isActive: true },
            _avg: { rating: true },
        });

        return prisma.api.update({
            where: { id },
            data: {
                rating: avgRating._avg.rating || 0,
            },
        });
    }

    static async getPopular(limit = 10) {
        return prisma.api.findMany({
            where: { isPublic: true, isActive: true },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
                _count: {
                    select: {
                        subscriptions: { where: { isActive: true } },
                        reviews: true,
                    },
                },
            },
            orderBy: [{ rating: 'desc' }, { totalRequests: 'desc' }],
            take: limit,
        });
    }

    static async getByCategory(category: ApiCategory, limit = 10) {
        return prisma.api.findMany({
            where: {
                category,
                isPublic: true,
                isActive: true,
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    },
                },
                _count: {
                    select: {
                        subscriptions: { where: { isActive: true } },
                        reviews: true,
                    },
                },
            },
            orderBy: { rating: 'desc' },
            take: limit,
        });
    }

    static async getStats() {
        return prisma.api.groupBy({
            by: ['category'],
            _count: { id: true },
            where: { isActive: true, isPublic: true },
        });
    }
}
