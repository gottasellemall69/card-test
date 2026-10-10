export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function publicError(error: unknown): { status: number; message: string } {
  if (error instanceof HttpError) return { status: error.statusCode, message: error.message };
  return { status: 500, message: 'Internal server error' };
}
