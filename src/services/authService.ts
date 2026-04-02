import { useQueryClient } from "@tanstack/react-query";
import {
  useGraphQLPublicMutation,
  useGraphQLMutation,
  useGraphQLQuery,
  setAuthCookies,
  clearAuthCookies,
  queryKeys,
} from "@/libs/graphql";
import { GET_ME } from "@/libs/graphql/queries";
import {
  LOGIN,
  REGISTER,
  LOGOUT,
  CHANGE_PASSWORD,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
} from "@/libs/graphql/mutations";
import { UPDATE_USER } from "@/libs/graphql/mutations";

// ============ TYPES ============

export interface AuthUser {
  id: string;
  profilePictureUrl: string;
  fullname: string;
  username: string;
  email: string;
  isActive: boolean;
  lastOnline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  profilePictureUrl: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  profilePictureUrl?: string;
  fullname?: string;
  email?: string;
}

// Response Types sesuai dengan backend
export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
}

export interface LoginResponse {
  login: AuthResponse;
}

export interface RegisterResponse {
  register: AuthResponse;
}

export interface LogoutResponse {
  logout: {
    success: boolean;
    message: string;
  };
}

export interface ChangePasswordResponse {
  changePassword: {
    success: boolean;
    message: string;
  };
}

export interface ForgotPasswordResponse {
  forgotPassword: {
    success: boolean;
    message: string;
  };
}

export interface ResetPasswordResponse {
  resetPassword: {
    success: boolean;
    message: string;
  };
}

export interface MeResponse {
  me: AuthUser | null;
}

// ============ QUERY HOOKS ============

/**
 * Hook untuk get current user (dengan auth token)
 * Gunakan untuk check user yang sedang login
 */
export function useMe() {
  return useGraphQLQuery<MeResponse>(
    queryKeys.users.detail("me"),
    GET_ME,
    undefined,
    {
      retry: false,
    },
  );
}

// ============ MUTATION HOOKS ============

/**
 * Hook untuk login (tanpa auth token)
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useGraphQLPublicMutation<LoginResponse, { input: LoginInput }>(LOGIN, {
    onSuccess: async (data) => {
      // Simpan tokens setelah login berhasil (Server Action)
      await setAuthCookies(
        data.login.tokens.accessToken,
        data.login.tokens.refreshToken,
      );
      // Clear semua cache query setelah login
      queryClient.clear();
    },
  });
}

/**
 * Hook untuk register (tanpa auth token)
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useGraphQLPublicMutation<RegisterResponse, { input: RegisterInput }>(
    REGISTER,
    {
      onSuccess: async (data) => {
        // Simpan tokens setelah register berhasil (Server Action)
        await setAuthCookies(
          data.register.tokens.accessToken,
          data.register.tokens.refreshToken,
        );
        // Clear semua cache query
        queryClient.clear();
      },
    },
  );
}

/**
 * Hook untuk logout (dengan auth token)
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<LogoutResponse, Record<string, never>>(LOGOUT, {
    onSuccess: async () => {
      // Clear tokens (Server Action)
      await clearAuthCookies();
      // Clear semua cache query
      queryClient.clear();
      // Redirect ke login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
    onError: async () => {
      // Tetap clear tokens meskipun error
      await clearAuthCookies();
      queryClient.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}

/**
 * Hook untuk change password (dengan auth token)
 */
export function useChangePassword() {
  return useGraphQLMutation<
    ChangePasswordResponse,
    { input: ChangePasswordInput }
  >(CHANGE_PASSWORD);
}

/**
 * Hook untuk forgot password (tanpa auth token)
 * Sends a password reset email to the user
 */
export function useForgotPassword() {
  return useGraphQLPublicMutation<
    ForgotPasswordResponse,
    { input: ForgotPasswordInput }
  >(FORGOT_PASSWORD);
}

/**
 * Hook untuk reset password (tanpa auth token)
 * Resets the password using a token from the email link
 */
export function useResetPassword() {
  return useGraphQLPublicMutation<
    ResetPasswordResponse,
    { input: ResetPasswordInput }
  >(RESET_PASSWORD);
}

/**
 * Hook untuk update profile (dengan auth token)
 * Uses the existing updateUser mutation but invalidates 'me' query
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    { updateUser: AuthUser },
    { id: string; input: UpdateProfileInput }
  >(UPDATE_USER, {
    onSuccess: () => {
      // Invalidate the 'me' query to refresh current user data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail("me") });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

// ============ HELPER FUNCTIONS ============

/**
 * Clear all tokens and redirect to login
 */
export async function logout(): Promise<void> {
  await clearAuthCookies();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
