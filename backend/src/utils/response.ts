/**
 * Standard API response formatters
 */

/**
 * Success response
 * @param data - Response data
 * @returns Formatted success response
 */
export function successResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}

/**
 * Error response
 * @param message - Error message
 * @param stack - Error stack trace (dev only)
 * @returns Formatted error response
 */
export function errorResponse(message: string, stack?: string) {
  return {
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && stack && { stack }),
    },
  };
}
