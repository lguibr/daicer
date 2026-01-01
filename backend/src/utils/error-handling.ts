export interface StrapiErrorDetails {
  errors?: Array<{
    path: string[];
    message: string;
    name: string;
  }>;
}

export interface StrapiError extends Error {
  details?: StrapiErrorDetails;
  status?: number;
  name: string;
  message: string;
}

/**
 * Type guard to check if an unknown error looks like a StrapiError
 */
export function isStrapiError(error: unknown): error is StrapiError {
  return error instanceof Error && typeof (error as StrapiError).details === 'object';
}

/**
 * Safely extracts validation details from a Strapi error object
 */
export function formatStrapiError(error: unknown): string {
  if (isStrapiError(error)) {
    if (error.details?.errors && Array.isArray(error.details.errors)) {
      return error.details.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Safe logger helper that handles Strapi error structures
 */
export function logStrapiError(
  logger: { error: (msg: string, meta?: object) => void },
  context: string,
  error: unknown
) {
  const message = error instanceof Error ? error.message : String(error);
  const details = isStrapiError(error) && error.details?.errors ? formatStrapiError(error) : undefined;

  logger.error(`[${context}] Failed: ${message}`, {
    details,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
