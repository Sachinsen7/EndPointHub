export const API_CATEGORIES = [
  "ai-ml",
  "data",
  "finance",
  "social",
  "ecommerce",
  "productivity",
  "developer-tools",
  "communication",
  "multimedia",
  "location",
  "weather",
  "news",
  "sports",
  "gaming",
  "healthcare",
  "education",
  "other",
] as const;

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
} as const;

export const API_KEY_PERMISSIONS = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  ADMIN: "admin",
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
