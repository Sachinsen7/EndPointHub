export * from "./auth";
export * from "./api";
export * from "./analytics";
export * from "./user";

// Common types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: string[];
  timestamp: string;
}
