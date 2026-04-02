import { useQueryClient } from "@tanstack/react-query";
import { useGraphQLQuery, useGraphQLMutation, queryKeys } from "@/libs/graphql";
import {
  GET_USERS,
  GET_USER_BY_ID,
  GET_USERS_BY_ROLE,
  USER_SETTINGS,
} from "@/libs/graphql/queries";
import {
  CREATE_USER,
  UPDATE_USER,
  DELETE_USER,
  TOGGLE_USER_STATUS,
  ADD_USER_ROLE,
  REMOVE_USER_ROLE,
} from "@/libs/graphql/mutations";
import { IUser, ICreateUserInput, IUpdateUserInput, IUserSettings, IUserSettingsResponse } from "@/types/user";

// Re-export User type from types file
export type { IUser as User, ICreateUserInput as CreateUserInput, IUpdateUserInput as UpdateUserInput };

export interface UsersResponse {
  users: IUser[];
}

export interface UserResponse {
  user: IUser;
}

export interface UsersByRoleResponse {
  usersByRole: IUser[];
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export function useUsers(filters?: UserFilters) {
  return useGraphQLQuery<UsersResponse>(
    queryKeys.users.list(filters),
    GET_USERS,
    filters
  );
}

export function useUser(id: string) {
  return useGraphQLQuery<UserResponse>(
    queryKeys.users.detail(id),
    GET_USER_BY_ID,
    { id },
    {
      enabled: !!id,
    }
  );
}

export function useUsersByRole(role: string) {
  return useGraphQLQuery<UsersByRoleResponse>(
    queryKeys.users.byRole(role),
    GET_USERS_BY_ROLE,
    { role },
    {
      enabled: !!role,
    }
  );
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<{ createUser: IUser }, { input: ICreateUserInput }>(
    CREATE_USER,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      },
    }
  );
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    { updateUser: IUser },
    { id: string; input: IUpdateUserInput }
  >(UPDATE_USER, {
    onSuccess: (data: { updateUser: IUser }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(data.updateUser.id),
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    { deleteUser: { success: boolean; message: string } },
    { id: string }
  >(DELETE_USER, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    { toggleUserStatus: { success: boolean; message: string; user: IUser } },
    { id: string }
  >(TOGGLE_USER_STATUS, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ==================== SETTINGS ====================

/**
 * Hook to fetch user settings (roles)
 * @returns Query result with settings
 */
export function useUserSettings() {
  return useGraphQLQuery<IUserSettingsResponse>(
    ["userSettings"],
    USER_SETTINGS
  );
}

/**
 * Hook to add a new user role
 * @returns Mutation function to add role
 */
export function useAddUserRole() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    { addUserRole: IUserSettings },
    { role: string }
  >(ADD_USER_ROLE, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
  });
}

/**
 * Hook to remove a user role
 * @returns Mutation function to remove role
 */
export function useRemoveUserRole() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    { removeUserRole: IUserSettings },
    { role: string }
  >(REMOVE_USER_ROLE, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
  });
}
