export interface UsageAnalytics {
  summary: {
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    avgResponseTime: number;
  };
  chartData: Array<{
    timestamp: string;
    apiId: string;
    apiName: string;
    requests: number;
    errors?: number;
    avgResponseTime: number;
  }>;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface AnalyticsQuery {
  period: "24h" | "7d" | "30d" | "90d";
  apiId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: "hour" | "day" | "week" | "month";
  metrics?: string[];
}

export interface RealtimeAnalytics {
  hourlyStats: Array<{
    minute: number;
    apiId: string;
    apiName: string;
    requests: number;
    errors: number;
    avgResponseTime: number;
  }>;
  recentRequests: Array<{
    id: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    timestamp: string;
  }>;
  activeApis: Array<{
    id: string;
    name: string;
    category: string;
    requests: number;
    errors: number;
    errorRate: number;
    avgResponseTime: number;
  }>;
  timestamp: string;
}

export interface TopApisResponse {
  apis: Array<{
    id: string;
    name: string;
    category: string;
    requests: number;
    growth: number;
    rating: number;
  }>;
}
