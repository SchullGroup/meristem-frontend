import { useStore } from "@/lib/store";

export function usePermission(key: string): boolean {
  return useStore((state) => state.userPermissions.includes(key));
}

export function useRolePermission(key: string): boolean {
  const roles = useStore((state) => state.currentUser?.roles ?? []);
  const upperRoles = roles.map((r) => r.toUpperCase());

  if (key.includes("icu")) {
    return upperRoles.includes("ICU");
  }
  if (key.includes("approve") || key.includes("authorise")) {
    return upperRoles.includes("OPS") || upperRoles.includes("ADMIN");
  }
  return false;
}
