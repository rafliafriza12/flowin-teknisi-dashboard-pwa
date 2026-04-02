"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useMe } from "@/services/authService";
import { RoleName } from "@/services/roleService";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  userId: string;
  email: string;
  role: RoleName;
  type: "access" | "refresh";
}

/**
 * Baca role dari JWT access_token cookie.
 * Role tidak disimpan di database — hanya ada di token.
 */
function getRoleFromToken(): RoleName | null {
  try {
    const token = Cookies.get("access_token");
    if (!token) return null;
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

interface PermissionContextType {
  role: RoleName | null;
  isTechnician: boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
  undefined,
);

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

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
}) => {
  const { isLoading } = useMe();
  const router = useRouter();

  const role = useMemo(() => getRoleFromToken(), []);
  const isTechnician = role === "Technician";

  // Client-side guard: redirect jika bukan Technician
  useEffect(() => {
    if (!isLoading && role && role !== "Technician") {
      router.replace(`/access-denied?role=${role}`);
    }
  }, [isLoading, role, router]);

  const value: PermissionContextType = useMemo(
    () => ({
      role,
      isTechnician,
      isLoading,
    }),
    [role, isTechnician, isLoading],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionProvider;
