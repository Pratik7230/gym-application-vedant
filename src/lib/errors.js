export class AppError extends Error {
  constructor(message, status = 400, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AppError";
  }
}

export function jsonError(error) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
