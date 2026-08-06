import { useQuery } from "@tanstack/react-query";
import { GET_ALL_ROLES, GET_PERMISSIONS } from "@/actions/rolesAction";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const data = await GET_ALL_ROLES();
      if (data?.isSuccessful && data?.data) {
        return data.data;
      }
      return []; // Return empty array as fallback
    },
  });
}

/** One row of the backend permission catalogue (GET /permissions). */
export interface CatalogPermission {
  name: string;
  module: string | null;
  submodule: string | null;
  /** "read" | "write" | "approve" */
  action: string | null;
  label: string | null;
  adminOnly?: boolean | null;
}

/**
 * The full assignable-permission catalogue, owned by the backend (the seeded
 * `permissions` table). The roles UI builds its matrix from this, so what is shown
 * and assignable can never drift from what the server actually enforces.
 */
export function usePermissionCatalog() {
  return useQuery<CatalogPermission[]>({
    queryKey: ["permissions", "catalog"],
    queryFn: async () => {
      const data = await GET_PERMISSIONS();
      if (data?.isSuccessful && Array.isArray(data?.data)) {
        return data.data as CatalogPermission[];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // catalogue is effectively static within a session
  });
}
