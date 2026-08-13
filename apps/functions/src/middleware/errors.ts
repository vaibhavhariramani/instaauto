export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, fields?: Record<string, string>) {
    return new ApiError(400, message, 'BAD_REQUEST', fields);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }
  static conflict(message: string) {
    return new ApiError(409, message, 'CONFLICT');
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message, 'RATE_LIMITED');
  }
  static serviceUnavailable(message: string) {
    return new ApiError(503, message, 'SERVICE_UNAVAILABLE');
  }
  static internal(message = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL');
  }
}
