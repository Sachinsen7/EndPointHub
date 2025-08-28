import { NextRequest } from "next/server";
import crypto from "crypto";
import { ApiError } from "../utils/error";
// import prisma from "../db/models/"

export const validateApiKey = (handler: Function) => {
  return async (request: NextRequest, context?: any) => {
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      throw new ApiError("API Key required", 401);
    }

    const keyRecord = await prisma.apiKey.findFirst({
      where: {
        key: apiKey,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: { id: true, email: true, isActive: true },
        },
      },
    });
  };
};
