import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { scryptSync, randomBytes } from 'crypto';

export const hashPassword = async (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hashedPassword}`;
};
export const verifyPassword = async (password: string, hash: string) => {
    const [salt, storedHash] = hash.split(':');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return hashedPassword === storedHash;
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

export const hasApiKey = async (apiKey: string): Promise<string> => {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
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
