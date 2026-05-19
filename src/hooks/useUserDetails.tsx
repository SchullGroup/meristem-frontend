import { GET_USER_BY_ID } from "@/actions/userAction";
import { useQuery } from "@tanstack/react-query";

export const useUserDetails = (userId?: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => GET_USER_BY_ID(userId as string),
    enabled: !!userId,
  });

  const userData = data?.data;

  const userName = userData
    ? `${userData.firstName} ${userData.lastName}`.trim()
    : "-";

  const userRole = userData?.role || userData?.roles.join(", ");

  return {
    userName,
    userRole,
    isLoading,
    isError,
  };
};
