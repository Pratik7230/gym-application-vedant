export class AppError extends Error {
  constructor(message, status = 400, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AppError";
  }
}

/** Standard API error codes for clients */
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  SERVER_CONFIG: "SERVER_CONFIG",
};

export function jsonError(error) {
  if (error instanceof AppError) {
    const fallbackCode =
      error.status === 401
        ? ErrorCodes.UNAUTHORIZED
        : error.status === 403
          ? ErrorCodes.FORBIDDEN
          : error.status === 404
            ? ErrorCodes.NOT_FOUND
            : error.status === 409
              ? ErrorCodes.CONFLICT
              : undefined;
    return Response.json(
      {
        error: error.message,
        code: error.code ?? fallbackCode,
      },
      { status: error.status }
    );
  }
  if (error instanceof Error && error.message === "Please define MONGODB_URI in .env") {
    return Response.json(
      { error: "Service unavailable", code: ErrorCodes.SERVER_CONFIG },
      { status: 503 }
    );
  }
  const jwtMissing =
    error instanceof Error &&
    (error.message?.includes("JWT_ACCESS_SECRET is not set") || error.message?.includes("JWT_REFRESH_SECRET is not set"));
  if (jwtMissing) {
    return Response.json(
      { error: "Service unavailable", code: ErrorCodes.SERVER_CONFIG },
      { status: 503 }
    );
  }
  console.error(error);
  return Response.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
}
