import { toast, ToastOptions } from "react-toastify";
import { GraphQLRequestError } from "./graphql";

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options });
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
  },
};

/**
 * Check if error is authentication error (should not show toast)
 * Auth errors are handled by auto-refresh token logic
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof GraphQLRequestError) {
    return error.isAuthError;
  }
  // Check error message for common auth error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("unauthenticated") ||
      message.includes("authentication required") ||
      message.includes("no refresh token")
    );
  }
  return false;
};

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Remove "GraphQL Error: " prefix if exists
    return error.message.replace(/^GraphQL Error:\s*/i, "");
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
};

/**
 * Show toast error from any error type
 * Will NOT show toast for authentication errors (handled by auto-refresh)
 */
export const showErrorToast = (error: unknown, options?: ToastOptions) => {
  // Skip toast for auth errors - these are handled by auto-refresh logic
  if (isAuthError(error)) {
    return;
  }

  const message = getErrorMessage(error);
  showToast.error(message, options);
};
