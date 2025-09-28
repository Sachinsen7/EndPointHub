import { prisma } from '../connections';
import { Prisma, HttpMethod } from '@/generated/prisma';

export class UsageModel {
    static async create(data: Prisma.UsageCreateInput) {
        return prisma.usage.create({ data });
    }

    static async bulkCreate(data: Prisma.UsageCreateInput[]) {
        return prisma.usage.createMany({ data, skipDuplicates: true });
    }

    static async getAnalytics(params: {
        userId?: string;
        apiId?: string;
        startDate: Date;
        endDate: Date;
        groupBy?: 'hour' | 'day' | 'month';
    }) {
        const { userId, apiId, startDate, endDate, groupBy = 'day' } = params;

        // Build the date truncation expression
        let dateTrunc: Prisma.Sql;
        switch (groupBy) {
            case 'hour':
                dateTrunc = Prisma.sql`DATE_TRUNC('hour', timestamp)`;
                break;
            case 'month':
                dateTrunc = Prisma.sql`DATE_TRUNC('month', timestamp)`;
                break;
            default:
                dateTrunc = Prisma.sql`DATE_TRUNC('day', timestamp)`;
        }

        const whereClause = Prisma.sql`
          WHERE timestamp >= ${startDate}::timestamp 
          AND timestamp <= ${endDate}::timestamp
          ${userId ? Prisma.sql`AND user_id = ${userId}::uuid` : Prisma.empty}
          ${apiId ? Prisma.sql`AND api_id = ${apiId}::uuid` : Prisma.empty}
        `;

        return prisma.$queryRaw`
          SELECT 
            ${dateTrunc} as period,
            COUNT(*)::int as request_count,
            COUNT(CASE WHEN status_code >= 400 THEN 1 END)::int as error_count,
            AVG(response_time)::int as avg_response_time,
            MIN(response_time)::int as min_response_time,
            MAX(response_time)::int as max_response_time
          FROM usage 
          ${whereClause}
          GROUP BY ${dateTrunc}
          ORDER BY period ASC
        `;
    }

    static async getTopApis(params: {
        startDate: Date;
        endDate: Date;
        limit?: number;
    }) {
        const { startDate, endDate, limit = 10 } = params;

        return prisma.$queryRaw`
          SELECT 
            a.id,
            a.name,
            a.category,
            COUNT(u.id)::int as request_count,
            COUNT(CASE WHEN u.status_code >= 400 THEN 1 END)::int as error_count,
            AVG(u.response_time)::int as avg_response_time,
            COUNT(DISTINCT u.user_id)::int as unique_users
          FROM usage u
          JOIN apis a ON u.api_id = a.id
          WHERE u.timestamp >= ${startDate}::timestamp 
          AND u.timestamp <= ${endDate}::timestamp
          AND a.is_active = true
          GROUP BY a.id, a.name, a.category
          ORDER BY request_count DESC
          LIMIT ${limit}
        `;
    }

    static async getUserStats(userId: string, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return prisma.$queryRaw`
          SELECT 
            COUNT(*)::int as total_requests,
            COUNT(CASE WHEN status_code >= 400 THEN 1 END)::int as error_count,
            AVG(response_time)::int as avg_response_time,
            COUNT(DISTINCT api_id)::int as unique_apis_used
          FROM usage 
          WHERE user_id = ${userId}::uuid
          AND timestamp >= ${startDate}::timestamp
        `;
    }

    static async getApiStats(apiId: string, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return prisma.$queryRaw`
          SELECT 
            COUNT(*)::int as total_requests,
            COUNT(CASE WHEN status_code >= 400 THEN 1 END)::int as error_count,
            AVG(response_time)::int as avg_response_time,
            COUNT(DISTINCT user_id)::int as unique_users
          FROM usage 
          WHERE api_id = ${apiId}::uuid
          AND timestamp >= ${startDate}::timestamp
        `;
    }

    static async getRealTimeStats(minutes = 60) {
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - minutes);

        return prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('minute', timestamp) as minute,
            COUNT(*)::int as request_count,
            AVG(response_time)::int as avg_response_time
          FROM usage 
          WHERE timestamp >= ${startTime}::timestamp
          GROUP BY DATE_TRUNC('minute', timestamp)
          ORDER BY minute DESC
          LIMIT ${minutes}
        `;
    }
}
