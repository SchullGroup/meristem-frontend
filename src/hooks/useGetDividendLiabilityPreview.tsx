import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { GET_DIVIDEND_LIABILITY_PREVIEW } from "@/actions/divDeclarationActions";

export const dividendLiabilityKeys = {
  all: ["dividend-liability-preview"] as const,
  preview: (registerId: string, rate: string, page: number) =>
    [...dividendLiabilityKeys.all, registerId, rate, String(page)] as const,
};

interface UseGetDividendLiabilityPreviewParams {
  registerId: string;
  rate: number | "";
  /** 0-indexed page number (matches the Spring Page API). Defaults to 0. */
  page?: number;
}

export const useGetDividendLiabilityPreview = (
  { registerId, rate, page = 0 }: UseGetDividendLiabilityPreviewParams,
  options?: Omit<
    UseQueryOptions<unknown, Error, unknown>,
    "queryKey" | "queryFn"
  >,
) => {
  const rateStr = rate !== "" ? String(rate) : "";

  return useQuery({
    queryKey: dividendLiabilityKeys.preview(registerId, rateStr, page),
    queryFn: ({ queryKey }) =>
      GET_DIVIDEND_LIABILITY_PREVIEW({
        queryKey: queryKey as [string, string, string, string],
      }),
    enabled: !!registerId && rate !== "" && Number(rate) > 0,
    ...options,
  });
};
