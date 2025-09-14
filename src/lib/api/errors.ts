export function normalizeApiError(err: unknown): string {
  const anyErr: any = err;
  const status: number | undefined = anyErr?.response?.status ?? anyErr?.status;

  // Network errors
  if (anyErr?.name === "TypeError" && typeof anyErr?.message === "string" && anyErr.message.includes("fetch")) {
    return "Network error. Please check your internet connection and try again.";
  }

  switch (status) {
    case 400:
      return "Bad request. Please check your inputs and try again.";
    case 401:
      return "Authentication required. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "Requested resource was not found.";
    case 409:
      return "Request conflict. Please refresh and try again.";
    case 422:
      return "Validation failed. Please review your input.";
    case 429:
      return "Too many requests. Please slow down and try again later.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Server error. Please try again in a few moments.";
    default:
      return anyErr?.message || "An unexpected error occurred";
  }
}

