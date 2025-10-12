import { NextRequest, NextResponse } from 'next/server';
import {
    apiKeyRateLimit,
    authenticateApiKey,
} from '@/libs/middleware/rateLimit';
import { prisma } from '@/libs/db/connections';
import { UsageModel, APIModel } from '@/libs/db/models';
import { ApiError } from '@/libs/utils/error';
import axios, { AxiosHeaders } from 'axios';
import { ApiKey } from '@/types';
import { HttpMethod } from '@/generated/prisma';

interface AuthenticatedRequest extends NextRequest {
    apiKey?: ApiKey;
}

const convertAxiosHeaders = (
    axiosHeaders: AxiosHeaders
): Record<string, string> => {
    const headers: Record<string, string> = {};
    axiosHeaders.forEach((value: string | string[], key: string) => {
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
            { params }: { params: Promise<{ apiId: string; path: string[] }> }
        ) => {
            const { apiId, path } = await params;
            const apiKey = request.apiKey;
            if (!apiKey || !apiKey.user) {
                throw new ApiError('API key not attached', 500, [
                    'Middleware error: apiKey missing',
                ]);
            }

            const api = await APIModel.findById(apiId);
            if (!api || !api.isActive) {
                throw new ApiError('API not found or inactive', 404, [
                    'API ID: ' + apiId,
                ]);
            }

            const subscription = await prisma.subscription.findFirst({
                where: {
                    apiId,
                    userId: apiKey.user.id,
                    isActive: true,
                },
            });
            if (!subscription) {
                throw new ApiError('No active subscription for this API', 403, [
                    'User ID: ' + apiKey.user.id,
                    'API ID: ' + apiId,
                ]);
            }

            const usageCount = await prisma.usage.count({
                where: {
                    apiId,
                    userId: apiKey.user.id,
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

            const targetUrl = `${api.baseUrl}/${path.join('/')}${request.nextUrl.search || ''}`;
            const startTime = Date.now();

            try {
                const response = await axios({
                    method: request.method as
                        | 'GET'
                        | 'POST'
                        | 'PUT'
                        | 'DELETE'
                        | 'PATCH',
                    url: targetUrl,
                    headers: {
                        ...Object.fromEntries(request.headers),
                        'x-api-key': apiKey.key,
                    },
                    data: request.body ? await request.json() : undefined,
                    validateStatus: () => true,
                    timeout: 30000,
                });

                await UsageModel.create({
                    api: { connect: { id: apiId } },
                    user: { connect: { id: apiKey.user.id } },
                    apiKey: { connect: { id: apiKey.id } },
                    method: request.method as HttpMethod,
                    path: `/${path.join('/')}`,
                    statusCode: response.status,
                    responseTime: Date.now() - startTime,
                    timestamp: new Date(),
                    country: request.headers.get('x-geo-country') || 'unknown',
                });

                await APIModel.incrementRequests(apiId);

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
                await prisma.usage.create({
                    data: {
                        api: { connect: { id: apiId } },
                        user: { connect: { id: apiKey.user.id } },
                        apiKey: { connect: { id: apiKey.id } },
                        method: request.method as HttpMethod,
                        path: `/${path.join('/')}`,
                        statusCode: error.response?.status || 500,
                        responseTime: Date.now() - startTime,
                        timestamp: new Date(),
                        country:
                            request.headers.get('x-geo-country') || 'unknown',
                    },
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
