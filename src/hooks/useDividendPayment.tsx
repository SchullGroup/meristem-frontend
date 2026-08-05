import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import type { DividendDeclaration } from "@/actions/dividendPayments";
import { PaginatedResponse } from "@/types";
import { GET_ALL_DIVIDEND_DECLARATIONS } from "@/actions/divDeclarationActions";

export const useGetDividendDeclarations = (params?: {
  size?: number;
  page?: number;
  status?: string;
},
  options?: Omit<UseQueryOptions<PaginatedResponse<DividendDeclaration>, Error, PaginatedResponse<DividendDeclaration>>, "queryKey" | "queryFn">) => {
  return useQuery({
    queryKey: ["all-declarations", params?.size, params?.page],
    queryFn: () => GET_ALL_DIVIDEND_DECLARATIONS(params),
    refetchOnWindowFocus: false,
    ...options
  });
};
