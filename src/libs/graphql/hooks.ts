import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from "@tanstack/react-query";
import { graphqlAction, graphqlPublicAction } from "./actions";

/**
 * Generic hook for GraphQL queries with TanStack Query (WITH auth)
 * @param queryKey - Unique key for the query (use queryKeys from queryKeys.ts)
 * @param query - GraphQL query string
 * @param variables - Optional variables for the query
 * @param options - Additional TanStack Query options
 */
export function useGraphQLQuery<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>
>(
  queryKey: QueryKey,
  query: string,
  variables?: TVariables,
  options?: Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn">
) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn: () => graphqlAction<TData>(query, variables),
    ...options,
  });
}

/**
 * Generic hook for GraphQL mutations with TanStack Query (WITH auth)
 * Gunakan untuk protected mutations (CRUD yang butuh login)
 * @param mutation - GraphQL mutation string
 * @param options - Additional TanStack Mutation options
 */
export function useGraphQLMutation<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>
>(
  mutation: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) =>
      graphqlAction<TData>(mutation, variables),
    ...options,
  });
}

/**
 * Generic hook for GraphQL mutations WITHOUT authentication
 * Gunakan untuk public mutations seperti login, register, forgot password
 * @param mutation - GraphQL mutation string
 * @param options - Additional TanStack Mutation options
 */
export function useGraphQLPublicMutation<
  TData,
  TVariables extends Record<string, unknown> = Record<string, unknown>
>(
  mutation: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) =>
      graphqlPublicAction<TData>(mutation, variables),
    ...options,
  });
}
