export * from './auth';
export * from './api';
export * from './analytics';
export * from './user';

export interface ApiResponse<T = any> {
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface ApiError {
    message: string;
    statusCode: number;
    details?: string[];
    timestamp: string;
}

export interface RealtimeAnalytics {
    hourlyStats: Array<{
        minute: string;
        apiId: string;
        apiName: string;
        requests: number;
        errors: number;
        avgResponseTime: number;
    }>;
    recentRequests: Array<{
        id: string;
        method: string;
        path: string;
        statusCode: number;
        responseTime: number;
        timestamp: string;
    }>;
    activeApis: Array<{
        id: string;
        name: string;
        category: string;
        requests: number;
        errors: number;
        errorRate: number;
        avgResponseTime: number;
    }>;
    timestamp: string;
}
