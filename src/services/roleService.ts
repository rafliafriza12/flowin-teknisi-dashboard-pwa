import { useQueryClient } from "@tanstack/react-query";
import {
  useGraphQLMutation,
  useGraphQLQuery,
  queryKeys,
} from "@/libs/graphql";
import { GET_ROLES, GET_ROLE, GET_ROLE_BY_NAME } from "@/libs/graphql/queries";
import {
  CREATE_ROLE,
  UPDATE_ROLE,
  DELETE_ROLE,
} from "@/libs/graphql/mutations";

// ============ TYPES ============

export interface IRolePermissions {
  readAllContent: boolean;
  writeAllContent: boolean;
  deleteAllContent: boolean;
  categoryManagement: boolean;
  roleManagement: boolean;
  userManagement: boolean;
  generalSettings: boolean;
  notificationSettings: boolean;
  integrationSettings: boolean;
}

export interface IRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: IRolePermissions;
  isSystem: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  permissions: IRolePermissions;
}

export interface UpdateRoleInput {
  name?: string;
  displayName?: string;
  description?: string;
  permissions?: IRolePermissions;
}

// Response types
export interface RolesResponse {
  roles: IRole[];
}

export interface RoleResponse {
  role: IRole | null;
}

export interface RoleByNameResponse {
  roleByName: IRole | null;
}

export interface CreateRoleResponse {
  createRole: IRole;
}

export interface UpdateRoleResponse {
  updateRole: {
    role: IRole;
    affectedUsersCount: number;
  };
}

export interface DeleteRoleResponse {
  deleteRole: {
    success: boolean;
    affectedUsersCount: number;
  };
}

// ============ PERMISSION LABELS ============

export const PERMISSION_LABELS: Record<keyof IRolePermissions, { label: string; description: string }> = {
  readAllContent: {
    label: "Read All Content",
    description: "Can view all content (pages, reports, documents) without editing",
  },
  writeAllContent: {
    label: "Write All Content",
    description: "Can create and edit all content (pages, reports, documents)",
  },
  deleteAllContent: {
    label: "Delete All Content",
    description: "Can delete all content (pages, reports, documents)",
  },
  categoryManagement: {
    label: "Category Management",
    description: "Can manage categories in Settings",
  },
  roleManagement: {
    label: "Role Management",
    description: "Can manage roles and permissions in Settings",
  },
  userManagement: {
    label: "User Management",
    description: "Can manage users (create, edit, delete users)",
  },
  generalSettings: {
    label: "General Settings",
    description: "Can modify general settings",
  },
  notificationSettings: {
    label: "Notification Settings",
    description: "Can modify notification settings",
  },
  integrationSettings: {
    label: "Integration Settings",
    description: "Can modify integration settings",
  },
};

// Default permissions for new roles
export const DEFAULT_PERMISSIONS: IRolePermissions = {
  readAllContent: false,
  writeAllContent: false,
  deleteAllContent: false,
  categoryManagement: false,
  roleManagement: false,
  userManagement: false,
  generalSettings: false,
  notificationSettings: false,
  integrationSettings: false,
};

// ============ QUERY HOOKS ============

/**
 * Hook to get all roles
 */
export function useRoles() {
  return useGraphQLQuery<RolesResponse>(
    queryKeys.roles.lists(),
    GET_ROLES,
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to get a specific role by ID
 */
export function useRole(id: string) {
  return useGraphQLQuery<RoleResponse>(
    queryKeys.roles.detail(id),
    GET_ROLE,
    { id },
    {
      enabled: !!id,
    }
  );
}

/**
 * Hook to get a role by name
 */
export function useRoleByName(name: string) {
  return useGraphQLQuery<RoleByNameResponse>(
    queryKeys.roles.byName(name),
    GET_ROLE_BY_NAME,
    { name },
    {
      enabled: !!name,
    }
  );
}

// ============ MUTATION HOOKS ============

/**
 * Hook to create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<CreateRoleResponse, { input: CreateRoleInput }>(
    CREATE_ROLE,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      },
    }
  );
}

/**
 * Hook to update a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    UpdateRoleResponse,
    { id: string; input: UpdateRoleInput }
  >(UPDATE_ROLE, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      // If users were affected, also invalidate users list
      if (data.updateRole.affectedUsersCount > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      }
    },
  });
}

/**
 * Hook to delete a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useGraphQLMutation<
    DeleteRoleResponse,
    { id: string; fallbackRoleName?: string }
  >(DELETE_ROLE, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      // If users were affected, also invalidate users list
      if (data.deleteRole.affectedUsersCount > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      }
    },
  });
}
