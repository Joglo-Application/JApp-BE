export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function error(code: string, message: string, details?: unknown): ErrorResponse {
  return details !== undefined
    ? { success: false, error: { code, message, details } }
    : { success: false, error: { code, message } };
}
