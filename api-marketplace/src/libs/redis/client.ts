import Redis from "ioredis";
import { config } from "../config/env";
import { logger } from "../utils/logger";

let redis: Redis | null = null;

export const getRedisCLient = () => {
  if (!redis && config.redisUrl) {
    redis = new Redis(config.redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    redis.on("connect", () => {
      logger.info("Redis client connected");
    });

    redis.on("error", (error) => {
      logger.error("Redis client error", error);
    });
  }

  return redis;
};

export { redis };
