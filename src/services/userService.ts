import { useQueryClient } from "@tanstack/react-query";
import { useGraphQLQuery, useGraphQLMutation, queryKeys } from "@/libs/graphql";
import {
  GET_USERS,
  GET_USER_BY_ID,
  GET_USERS_SEARCH,
} from "@/libs/graphql/queries";
import { UPDATE_USER } from "@/libs/graphql/mutations";
import { IUser, IUpdateUserInput } from "@/types/user";

// Re-export User type from types file
export type { IUser as User, IUpdateUserInput as UpdateUserInput };

export interface UsersResponse {
  users: IUser[];
}

export interface UserResponse {
  user: IUser;
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
    filters,
  );
}

export function useUser(id: string) {
  return useGraphQLQuery<UserResponse>(
    queryKeys.users.detail(id),
    GET_USER_BY_ID,
    { id },
    {
      enabled: !!id,
    },
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

/**
 * Cari teknisi berdasarkan nama atau NIP — digunakan untuk autocomplete tim.
 * Query hanya dijalankan jika `search` tidak kosong.
 */
export function useSearchTeknisi(search: string) {
  return useGraphQLQuery<UsersResponse>(
    [...queryKeys.users.all, "search", search],
    GET_USERS_SEARCH,
    { search },
    {
      enabled: search.trim().length >= 1,
    },
  );
}
