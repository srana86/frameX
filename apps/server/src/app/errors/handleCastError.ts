import { TErrorSources, TGenericErrorResponse } from '../interface/error';

/**
 * Handle invalid ID errors (Prisma record not found or invalid format)
 */
const handleCastError = (
  err: Error & { code?: string; meta?: { cause?: string } }
): TGenericErrorResponse => {
  const errorSources: TErrorSources = [
    {
      path: '',
      message: err.message || 'Invalid ID format',
    },
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: 'Invalid ID',
    errorSources,
  };
};

export default handleCastError;
