export const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: {
    code?: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLRequestOptions {
  query: string;
  variables?: Record<string, unknown>;
}

// Custom error class untuk GraphQL errors
export class GraphQLRequestError extends Error {
  code?: string;
  statusCode?: number;
  isAuthError: boolean;
  isForbiddenError: boolean;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GraphQLRequestError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isAuthError = code === "UNAUTHENTICATED" || statusCode === 401;
    this.isForbiddenError = code === "FORBIDDEN" || statusCode === 403;
  }

  // Helper to check if this is an access denied error
  get isAccessDenied(): boolean {
    return this.isForbiddenError || this.isAuthError;
  }

  // Get user-friendly error message
  get userMessage(): string {
    if (this.isForbiddenError) {
      return "You don't have permission to perform this action. Please contact your administrator.";
    }
    if (this.isAuthError) {
      return "Your session has expired. Please log in again.";
    }
    return this.message;
  }
}

export const isAuthErr = (errors: GraphQLError[]) =>
  errors.some(
    (e) =>
      e.extensions?.code === "UNAUTHENTICATED" ||
      e.extensions?.statusCode === 401
  );

export const isForbidErr = (errors: GraphQLError[]) =>
  errors.some(
    (e) =>
      e.extensions?.code === "FORBIDDEN" ||
      e.extensions?.statusCode === 403
  );

export const isAuthenticationError = isAuthErr;
export const isForbiddenError = isForbidErr;
