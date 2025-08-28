export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiError";
  }
}

export const handleApiError = (error: any) => {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      }),
      {
        status: error.statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  console.error("Unexpected error:", error);

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
};
