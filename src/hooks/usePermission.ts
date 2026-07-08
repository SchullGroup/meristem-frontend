import { useStore } from "@/lib/store";

export function usePermission(key: string): boolean {
  return useStore((state) => state.userPermissions.includes(key));
}
