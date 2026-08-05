import { getAgentDetail, getAgentMandates, getAgents, getRightsEntitlements, searchShareholders, getWarrants, uploadAgentMandate, bulkAgentMandateUpload } from "@/actions/enquiryActions";
import { ApiResponse, ContentPaginatedResponse } from "@/types";
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
    Agent,
    AgentDetail,
    AgentMandate,
    AgentMandatesParams,
    RightsSearchResponse,
    SearchAgentsParams,
    SearchRightsParams,
    SearchWarrantsParams,
    ShareholderSearchCriteria,
    ShareholderSearchResult,
    Warrant,
} from "@/types/enquiry";

export const useGetWarrants = (
    params: SearchWarrantsParams,
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<Warrant>,
            Error,
            ContentPaginatedResponse<Warrant>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["warrants", params],
        queryFn: () => getWarrants(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetAgents = (
    params: SearchAgentsParams,
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<Agent>,
            Error,
            ContentPaginatedResponse<Agent>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["agents", params],
        queryFn: () => getAgents(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetAgentDetail = (
    id: string,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<AgentDetail>,
            Error,
            ApiResponse<AgentDetail>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["agent-detail", id],
        queryFn: () => getAgentDetail(id),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetAgentMandates = (
    id: string,
    params?: AgentMandatesParams,
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<AgentMandate>,
            Error,
            ContentPaginatedResponse<AgentMandate>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["agent-mandates", id, params],
        queryFn: () => getAgentMandates(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetRightsEntitlements = (
    params: SearchRightsParams,
    options?: Omit<
        UseQueryOptions<
            RightsSearchResponse,
            Error,
            RightsSearchResponse
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["rights-entitlements", params],
        queryFn: () => getRightsEntitlements(params),
        enabled: !!params.registerSymbol,
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useSearchShareholders = (
    criteria: ShareholderSearchCriteria,
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<ShareholderSearchResult>,
            Error,
            ContentPaginatedResponse<ShareholderSearchResult>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["shareholderSearch", criteria],
        queryFn: () => searchShareholders(criteria),
        refetchOnWindowFocus: false,
        placeholderData: (prev) => prev, // keep prior page visible while paging/re-searching
        ...options,
    });
};

export const useUploadMandate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: unknown) => uploadAgentMandate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["agent-mandates"],
                exact: false
            })
        }
    });
};

export const useBulkUploadMandate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ data, id }: { data: FormData, id?: string }) => bulkAgentMandateUpload(data, id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["agent-mandates"],
                exact: false
            })
        }
    })
}
