import { TErrorSources, TGenericErrorResponse } from '../interface/error';

/**
 * Handle validation errors (Prisma validation or Zod errors)
 */
const handleValidationError = (
  err: Error & { errors?: Record<string, { message: string; path?: string }> }
): TGenericErrorResponse => {
  const errorSources: TErrorSources = err.errors
    ? Object.entries(err.errors).map(([key, val]) => ({
      path: val?.path || key,
      message: val?.message || 'Validation error',
    }))
    : [{ path: '', message: err.message || 'Validation Error' }];

  const statusCode = 400;

  return {
    statusCode,
    message: 'Validation Error',
    errorSources,
  };
};

export default handleValidationError;
