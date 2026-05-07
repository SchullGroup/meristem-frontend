import { useQuery } from "@tanstack/react-query";
import { GET_ALL_ROLES } from "@/actions/rolesAction";

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
