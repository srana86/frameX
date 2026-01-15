import { ZodError, ZodIssue } from "zod";
import { TErrorSources, TGenericErrorResponse } from "../types";

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources = err.issues.map((issue: ZodIssue) => {
    const pathValue = issue?.path[issue.path.length - 1];
    return {
      path: typeof pathValue === "symbol" ? pathValue.toString() : pathValue,
      message: issue.message,
    };
  });

  const statusCode = 400;

  return {
    statusCode,
    message: "Validation Error",
    errorSources,
  };
};

export default handleZodError;
