import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 25;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateApiKey = (): string => {
  const prefix = "eph_";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return prefix + randomBytes;
};

export const generateAccessToken = (payload: any): string => {
  if (!config.jwt.secret) {
    throw new Error("JWT secret is not defined in config");
  }

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn || "1h",
  });
};

export const generateRefreshToken = (payload: any): string => {
  if (!config.jwt.secret) {
    throw new Error("JWT secret is not defined in config");
  }

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn || "30d",
  });
};

export const generateSecretKey = (length: number = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

export const generateEmailVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};
