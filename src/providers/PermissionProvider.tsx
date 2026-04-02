"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useMe } from "@/services/authService";
import { useRoleByName, IRolePermissions, DEFAULT_PERMISSIONS } from "@/services/roleService";

interface PermissionContextType {
  permissions: IRolePermissions;
  isLoading: boolean;
  isSuperAdmin: boolean;
  roleName: string | null;
  // Permission check helpers
  canReadContent: boolean;
  canWriteContent: boolean;
  canDeleteContent: boolean;
  canManageCategories: boolean;
  canManageRoles: boolean;
  canManageUsers: boolean;
  canAccessGeneralSettings: boolean;
  canAccessNotificationSettings: boolean;
  canAccessIntegrationSettings: boolean;
  // Function to check any permission
  hasPermission: (permission: keyof IRolePermissions) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
}

interface PermissionProviderProps {
  children: React.ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { data: meData, isLoading: isLoadingMe } = useMe();
  const userRole = meData?.me?.role;
  
  const { data: roleData, isLoading: isLoadingRole } = useRoleByName(userRole || "");
  
  const isLoading = isLoadingMe || isLoadingRole;
  const isSuperAdmin = userRole === "Super Admin";
  
  // Get permissions - Super Admin has all permissions
  const permissions: IRolePermissions = useMemo(() => {
    if (isSuperAdmin) {
      return {
        readAllContent: true,
        writeAllContent: true,
        deleteAllContent: true,
        categoryManagement: true,
        roleManagement: true,
        userManagement: true,
        generalSettings: true,
        notificationSettings: true,
        integrationSettings: true,
      };
    }
    
    return roleData?.roleByName?.permissions || DEFAULT_PERMISSIONS;
  }, [isSuperAdmin, roleData]);
  
  // Helper function to check a specific permission
  const hasPermission = (permission: keyof IRolePermissions): boolean => {
    if (isSuperAdmin) return true;
    return permissions[permission] === true;
  };
  
  const value: PermissionContextType = useMemo(() => ({
    permissions,
    isLoading,
    isSuperAdmin,
    roleName: userRole || null,
    canReadContent: hasPermission("readAllContent"),
    canWriteContent: hasPermission("writeAllContent"),
    canDeleteContent: hasPermission("deleteAllContent"),
    canManageCategories: hasPermission("categoryManagement"),
    canManageRoles: hasPermission("roleManagement"),
    canManageUsers: hasPermission("userManagement"),
    canAccessGeneralSettings: hasPermission("generalSettings"),
    canAccessNotificationSettings: hasPermission("notificationSettings"),
    canAccessIntegrationSettings: hasPermission("integrationSettings"),
    hasPermission,
  }), [permissions, isLoading, isSuperAdmin, userRole]);
  
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionProvider;
