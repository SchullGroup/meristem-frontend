import { useStore } from "@/lib/store";

/**
 * The access gate for the whole app. SUPER_ADMIN sees everything; every other user is
 * gated by their ACTUAL granted permission keys (module.submodule.action), which now
 * arrive on the login response and live in the store's userPermissions.
 */
export function usePermission(key: string): boolean {
  const isSuperAdmin = useStore(
    (state) => state.currentUser?.roles?.includes("SUPER_ADMIN") ?? false,
  );
  const has = useStore((state) => state.userPermissions.includes(key));
  return isSuperAdmin || has;
}

/**
 * Kept for existing call sites (approve/ICU action gates). Previously this checked
 * hard-coded role names (ICU/OPS/ADMIN) and ignored the user's real permissions, so
 * any custom UI-created role was locked out. It now defers to the real permission set.
 */
export function useRolePermission(key: string): boolean {
  return usePermission(key);
}
