import { z, ZodSchema } from "zod";
import { NextRequest } from "next/server";
import { ApiError } from "../utils/error";

export const validateBody = (schema: ZodSchema) => {
  return (handler: Function) => {
    return async (request: NextRequest, context?: any) => {
      try {
        const body = await request.json();
        const validatedData = schema.parse(body);

        (request as any).validatedData = validatedData;
        return handler(request, context);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ApiError(
            "Validation failed",
            400,
            error.issues.map((e) => `${e.path.join(".")}: ${e.message}`)
          );
        }
        throw error;
      }
    };
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (handler: Function) => {
    return async (request: NextRequest, context?: any) => {
      try {
        const { searchParams } = new URL(request.url);
        const queryObject = Object.fromEntries(searchParams);
        const validatedQuery = schema.parse(queryObject);

        (request as any).validatedQuery = validatedQuery;
        return handler(request, context);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ApiError(
            "Query validation failed",
            400,
            error.issues.map((e) => `${e.path.join(".")}: ${e.message}`)
          );
        }
        throw error;
      }
    };
  };
};
