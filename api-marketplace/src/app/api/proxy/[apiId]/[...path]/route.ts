import { NextRequest, NextResponse } from 'next/server';
import {
    authenticateApiKey,
    apiKeyRateLimit,
} from '@/libs/middleware/rateLimit';
import { prisma } from '@/libs/db/connections';
import { UsageModel, APIModel, APIKeyModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';
import axios, { AxiosHeaders } from 'axios';
import { ApiKey } from '@/types';

interface AuthenticatedRequest extends NextRequest {
    apiKey?: ApiKey;
}

const convertAxiosHeaders = (
    axiosHeaders: AxiosHeaders
): Record<string, string> => {
    const headers: Record<string, string> = {};
    axiosHeaders.forEach((value, key) => {
        if (value !== undefined && value !== null) {
            headers[key] = String(value);
        }
    });
    return headers;
};

export const GET = apiKeyRateLimit(
    authenticateApiKey(
        async (
            request: AuthenticatedRequest,
            { params }: { params: { apiId: string; path: string[] } }
        ) => {
            const { apiId, path } = params;
            const apiKey = request.apiKey;
            if (!apiKey) {
                throw new ApiError('API key not attached', 500, [
                    'Middleware error: apiKey missing',
                ]);
            }

            // Validate API exists and is active
            const api = await APIModel.findById(apiId);
            if (!api || !api.isActive) {
                throw new ApiError('API not found or inactive', 404, [
                    'API ID: ' + apiId,
                ]);
            }

            // Verify user has an active subscription
            const subscription = await prisma.subscription.findFirst({
                where: {
                    apiId,
                    userId: apiKey.user?.id,
                    isActive: true,
                },
            });
            if (!subscription) {
                throw new ApiError('No active subscription for this API', 403, [
                    'User ID: ' + apiKey.user?.id,
                    'API ID: ' + apiId,
                ]);
            }

            // Check monthly limit
            const usageCount = await prisma.usage.count({
                where: {
                    apiId,
                    userId: apiKey.user?.id,
                    timestamp: {
                        gte: new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            1
                        ),
                    },
                },
            });
            if (usageCount >= subscription.monthlyLimit) {
                throw new ApiError('Monthly usage limit exceeded', 429, [
                    `Limit: ${subscription.monthlyLimit}`,
                    `Usage: ${usageCount}`,
                ]);
            }

            // Construct target URL
            const targetUrl = `${api.baseUrl}/${path.join('/')}${request.nextUrl.search || ''}`;

            // Forward request
            const startTime = Date.now(); // Moved outside try block
            try {
                const response = await axios({
                    method: request.method as
                        | 'GET'
                        | 'POST'
                        | 'PUT'
                        | 'DELETE'
                        | 'PATCH', // Type assertion for HttpMethod
                    url: targetUrl,
                    headers: {
                        ...Object.fromEntries(request.headers),
                        'x-api-key': apiKey.key,
                    },
                    data: request.body ? await request.json() : undefined,
                    validateStatus: () => true,
                    timeout: 30000,
                });

                // Log usage
                await UsageModel.create({
                    apiId,
                    userId: apiKey.user?.id,
                    keyId: apiKey.id,
                    method: request.method, // Prisma schema likely accepts string
                    path: `/${path.join('/')}`,
                    statusCode: response.status,
                    responseTime: Date.now() - startTime,
                    timestamp: new Date(),
                    country: request.headers.get('x-geo-country') || 'unknown',
                });

                // Increment API request count
                await APIModel.incrementRequests(apiId);

                // Convert axios headers to HeadersInit
                const responseHeaders = convertAxiosHeaders(
                    response.headers as AxiosHeaders
                );
                responseHeaders['X-RateLimit-Limit'] =
                    request.headers.get('X-RateLimit-Limit') || '';
                responseHeaders['X-RateLimit-Remaining'] =
                    request.headers.get('X-RateLimit-Remaining') || '';
                responseHeaders['X-RateLimit-Reset'] =
                    request.headers.get('X-RateLimit-Reset') || '';

                return new NextResponse(JSON.stringify(response.data), {
                    status: response.status,
                    headers: responseHeaders,
                });
            } catch (error: any) {
                // Log failed request
                await UsageModel.create({
                    apiId,
                    userId: apiKey.user?.id,
                    keyId: apiKey.id,
                    method: request.method,
                    path: `/${path.join('/')}`,
                    statusCode: error.response?.status || 500,
                    responseTime: Date.now() - startTime,
                    timestamp: new Date(),
                    country: request.headers.get('x-geo-country') || 'unknown',
                });

                throw new ApiError(
                    'Failed to proxy request',
                    error.response?.status || 500,
                    [
                        error.message || 'Unknown error',
                        `Target URL: ${targetUrl}`,
                        `Method: ${request.method}`,
                    ]
                );
            }
        }
    )
);

export const POST = GET;
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;
