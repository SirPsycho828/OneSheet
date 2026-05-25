export interface ApiError {
  error: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}
