import { ObjectId } from 'mongodb';
import connectDB from './mongodb';
import { logger } from '../utils/logger';
import clientPromise from './mongodb';

export const isValidObjectId = (id: string): boolean => {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
};

export const toObjectId = (id: string): ObjectId => {
    if (!isValidObjectId(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new ObjectId(id);
};

export const buildApiSearchPipeline = (filters: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}) => {
    const {
        search,
        category,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = filters;

    const pipeline: any[] = [];

    const matchStage: any = {
        isPublic: true,
        isActive: true,
    };

    if (category) {
        matchStage.category = category;
    }

    // Text search stage
    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } },
                ],
            },
        });
    }

    pipeline.push({ $match: matchStage });

    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'ownerId',
            foreignField: '_id',
            as: 'owner',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        company: 1,
                    },
                },
            ],
        },
    });

    pipeline.push({
        $unwind: '$owner',
    });

    pipeline.push({
        $lookup: {
            from: 'subscriptions',
            localField: '_id',
            foreignField: 'apiId',
            as: 'subscriptions',
            pipeline: [{ $match: { isActive: true } }],
        },
    });

    pipeline.push({
        $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'apiId',
            as: 'reviews',
        },
    });

    // Project final fields
    pipeline.push({
        $project: {
            _id: 1,
            name: 1,
            description: 1,
            category: 1,
            version: 1,
            tags: 1,
            pricing: 1,
            rating: 1,
            totalRequests: 1,
            createdAt: 1,
            owner: 1,
            subscriberCount: { $size: '$subscriptions' },
            reviewCount: { $size: '$reviews' },
        },
    });

    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({
        $sort: { [sortBy]: sortDirection },
    });

    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    return pipeline;
};

export const buildUsageAnalyticsPipeline = (filters: {
    userId: string;
    apiId?: string;
    startDate: Date;
    endDate: Date;
    groupBy: 'hour' | 'day' | 'week' | 'month';
}) => {
    const { userId, apiId, startDate, endDate, groupBy } = filters;

    const pipeline: any[] = [];

    const matchStage: any = {
        userId: toObjectId(userId),
        timestamp: {
            $gte: startDate,
            $lte: endDate,
        },
    };

    if (apiId) {
        matchStage.apiId = toObjectId(apiId);
    }

    pipeline.push({ $match: matchStage });

    let dateGrouping: any;

    switch (groupBy) {
        case 'hour':
            dateGrouping = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
                hour: { $hour: '$timestamp' },
            };
            break;
        case 'day':
            dateGrouping = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
            };
            break;
        case 'week':
            dateGrouping = {
                year: { $year: '$timestamp' },
                week: { $week: '$timestamp' },
            };
            break;
        case 'month':
            dateGrouping = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
            };
            break;
    }

    pipeline.push({
        $group: {
            _id: {
                ...dateGrouping,
                apiId: '$apiId',
            },
            requestCount: { $sum: 1 },
            errorCount: {
                $sum: {
                    $cond: [{ $gte: ['$statusCode', 400] }, 1, 0],
                },
            },
            avgResponseTime: { $avg: '$responseTime' },
            totalResponseTime: { $sum: '$responseTime' },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'apis',
            localField: '_id.apiId',
            foreignField: '_id',
            as: 'api',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        name: 1,
                    },
                },
            ],
        },
    });

    pipeline.push({
        $unwind: '$api',
    });

    // Sort by timestamp
    pipeline.push({
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 },
    });

    return pipeline;
};

export const withTransaction = async <T>(
    callback: (session: any) => Promise<T>
): Promise<T> => {
    const client = await clientPromise;
    const session = client.startSession();

    try {
        session.startTransaction();
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

export const bulkWriteTheRetry = async (
    collectionName: string,
    operations: any[],
    maxRetries = 3
) => {
    const db = await connectDB();
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const result = await db
                .collection(collectionName)
                .bulkWrite(operations);
            return result;
        } catch (error: any) {
            retries++;
            if (retries >= maxRetries || !error.code || error.code !== 11000) {
                throw error;
            }
            await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retries) * 1000)
            );
        }
    }
};
