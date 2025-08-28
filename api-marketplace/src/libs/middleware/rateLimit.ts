import { NextRequest } from "next/server";
import { getRedisCLient } from "../redis/client";
import { config } from "../config/env";
import { ApiError } from "../utils/error";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
}

const defaultKeyGenerator = (req: NextRequest): string => {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
};

export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs = config.rateLimit.requests,
    max = config.rateLimit.requests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
  } = options;

  return (handler: Function) => {
    return async (request: NextRequest, context?: any) => {
      const redis = getRedisCLient();

      if (!redis) {
        return handler(request, context);
      }

      const key = `rate_limit:${keyGenerator(request)}`;
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > max) {
        throw new ApiError("Too Many Requests", 429);
      }

      const response = await handler(request, context);

      if (
        skipSuccessfulRequests &&
        response.status >= 200 &&
        response.status < 400
      ) {
        await redis.decr(key);
      }

      const headers = new Headers(response.headers);
      headers.set("X-RateLimit-Limit", max.toString());
      headers.set(
        "X-RateLimit-Remaining",
        Math.max(0, max - current).toString()
      );
      headers.set(
        "X-RateLimit-Reset",
        new Date(Date.now() + windowMs).toISOString()
      );

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  };
};

export const apiKeyRateLimit = (handler: Function) => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 1000, // 1000 requests per minute per API key
    keyGenerator: (req) => {
      const apiKey =
        req.headers.get("x-api-key") ||
        req.headers.get("authorization")?.replace("Bearer ", "");
      return `api_key:${apiKey}`;
    },
  })(handler);
};
