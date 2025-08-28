import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
// import {prisma} from "../db/"
import { ApiError } from "../utils/error";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export const verifyToken = (token: string): AuthUser => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    return decoded;
  } catch (error) {
    throw new ApiError("Invalid token", 401);
  }
};

export const authauthenticateUser = async (
  request: NextRequest
): Promise<AuthUser> => {
  const autheHeader = request.headers.get("authorization");
  const token = autheHeader?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError("Token not found", 401);
  }

  const decoded = verifyToken(token);

  //   const user = await
  return decoded;
};
