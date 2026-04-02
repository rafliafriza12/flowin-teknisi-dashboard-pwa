/**
 * RoleName — role disimpan hanya di JWT, tidak di database.
 * Web ini hanya untuk Teknisi; JWT selalu memiliki role "Technician".
 */
export type RoleName = "Admin" | "Technician" | "User";

export const VALID_ROLES: RoleName[] = ["Admin", "Technician", "User"];
