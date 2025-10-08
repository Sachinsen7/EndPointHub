import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 25;
    return bcrypt.hash(password, saltRounds);
};

export const hashToken = async (token: string): Promise<string> => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const generateApiKey = (): string => {
    const prefix = 'eph_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
};

export const hasApiKey = async (apiKey: string): Promise<boolean> => {
    const key = await prisma.apiKey.findUnique({
        where: { key: apiKey },
    });
    return !!key;
};

export const generateAccessToken = (payload: any): string => {
    if (!config.jwt.secret) {
        throw new Error('JWT secret is not defined in config');
    }

    return jwt.sign(
        payload,
        config.jwt.secret as Secret,
        {
            expiresIn: config.jwt.expiresIn || '1h',
        } as SignOptions
    );
};

export const generateRefreshToken = (payload: any): string => {
    if (!config.jwt.secret) {
        throw new Error('JWT secret is not defined in config');
    }

    return jwt.sign(
        payload,
        config.jwt.secret as Secret,
        {
            expiresIn: config.jwt.refreshExpiresIn || '30d',
        } as SignOptions
    );
};

export const generateSecretKey = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

export const generateEmailVerificationToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};
