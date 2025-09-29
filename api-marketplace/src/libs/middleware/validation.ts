import { z, ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '../utils/error';

interface ValidatedRequest<T> extends NextRequest {
    validatedData?: T;
    validatedQuery?: T;
}

type Handler<T> = (
    request: ValidatedRequest<T>,
    context?: any
) => Promise<NextResponse>;

export const validateBody = <T>(schema: ZodSchema<T>) => {
    return (handler: Handler<T>) => {
        return async (request: ValidatedRequest<T>, context?: any) => {
            try {
                const body = await request.json();
                const validatedData = schema.parse(body);
                request.validatedData = validatedData;
                return handler(request, context);
            } catch (error: any) {
                if (error instanceof z.ZodError) {
                    throw new ApiError(
                        'Validation failed',
                        400,
                        error.issues.map(
                            (e) => `${e.path.join('.')}: ${e.message}`
                        )
                    );
                }
                throw new ApiError('Internal server error', 500, [
                    error.message,
                ]);
            }
        };
    };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
    return (handler: Handler<T>) => {
        return async (request: ValidatedRequest<T>, context?: any) => {
            try {
                const { searchParams } = new URL(request.url);
                const queryObject = Object.fromEntries(searchParams);
                const validatedQuery = schema.parse(queryObject);
                request.validatedQuery = validatedQuery;
                return handler(request, context);
            } catch (error: any) {
                if (error instanceof z.ZodError) {
                    throw new ApiError(
                        'Query validation failed',
                        400,
                        error.issues.map(
                            (e) => `${e.path.join('.')}: ${e.message}`
                        )
                    );
                }
                throw new ApiError('Internal server error', 500, [
                    error.message,
                ]);
            }
        };
    };
};
