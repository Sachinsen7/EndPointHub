export interface Api {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  category: string;
  version: string;
  slug: string;
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  documentation?: string;
  pricing: {
    free: boolean;
    pricePerRequest: number;
    monthlyLimit: number;
  };
  rating: number;
  totalRequests: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
  };
  subscriberCount?: number;
  reviewCount?: number;
}

export interface ApiSearchParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: "name" | "rating" | "totalRequests" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ApiSearchResponse {
  apis: Api[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateApiRequest {
  name: string;
  description: string;
  baseUrl: string;
  category: string;
  version?: string;
  isPublic?: boolean;
  pricing: {
    free: boolean;
    pricePerRequest: number;
    monthlyLimit: number;
  };
  documentation?: string;
  tags?: string[];
}

export interface UpdateApiRequest extends Partial<CreateApiRequest> {}

export interface ApiKey {
  id: string;
  name: string;
  description?: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  _count?: {
    usage: number;
  };
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  expiresAt?: string;
  permissions?: string[];
}

export interface Subscription {
  id: string;
  planType: string;
  billingPeriod: string;
  monthlyLimit: number;
  isActive: boolean;
  startDate: string;
  expiresAt?: string;
  canceledAt?: string;
  createdAt: string;
  api: {
    id: string;
    name: string;
    category: string;
  };
}
