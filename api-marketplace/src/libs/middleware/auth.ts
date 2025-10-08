import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserModel } from '../db/models';
import { ApiError } from '../utils/error';

export interface AuthUser {
    id: string;
    email: string;
    role: string;
}

export interface AuthenticatedRequest extends NextRequest {
    user: AuthUser;
}

export const verifyToken = (token: string): AuthUser => {
    try {
        return jwt.verify(token, config.jwt.secret) as AuthUser;
    } catch (error) {
        throw new ApiError('Invalid token', 401);
    }
};

export const authenticateUser = (
    handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) => {
    return async (request: NextRequest, context?: any) => {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError('Token not found', 401);
        }

        const decoded = verifyToken(token);
        const user = await UserModel.findById(decoded.id);
        if (!user || !user.isActive || !user.emailVerified) {
            throw new ApiError('Unauthorized user', 401);
        }

        const authRequest: AuthenticatedRequest = Object.assign(request, {
            user: { id: user.id, email: user.email, role: user.role },
        });

        return handler(authRequest, context);
    };
};
