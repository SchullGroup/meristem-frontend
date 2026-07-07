import { getAgentDetail, getAgentMandates, getAgents, getCertificateDetail, getCertificates, getDividendStatement, getHolderAdmonRecords, getHolderDividends, getHolderKycChanges, getHolderMergers, getHolderProfile, getHolderStatement, getHolderTransfers, getRightsEntitlements, getRightsHolderDetail, getShareholders, getShareholderSummary, getWarrantDetail, getWarrants, uploadAgentMandate, bulkAgentMandateUpload } from "@/actions/enquiryActions";
import { ApiResponse, ContentPaginatedResponse } from "@/types";
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
    Agent,
    AgentDetail,
    AgentMandate,
    AgentMandatesParams,
    Certificate,
    CertificatesParams,
    DividendStatement,
    HolderAdmonRecord,
    HolderDividend,
    HolderDividendsParams,
    HolderKycChange,
    HolderMerger,
    HolderProfile,
    HolderStatement,
    HolderStatementParams,
    HolderTransfer,
    RightsHolderDetail,
    RightsSearchResponse,
    SearchAgentsParams,
    SearchRightsParams,
    SearchWarrantsParams,
    Shareholder,
    ShareholdersParams,
    ShareholderSummary,
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

export const useGetWarrantDetail = (
    warrantNo: string,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<Warrant>,
            Error,
            ApiResponse<Warrant>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["warrant-detail", warrantNo],
        queryFn: () => getWarrantDetail(warrantNo),
        enabled: !!warrantNo,
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

export const useGetRightsHolderDetail = (
    rightsIssueId: string,
    accountNo: string,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<RightsHolderDetail>,
            Error,
            ApiResponse<RightsHolderDetail>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: [
            "rights-holder-detail",
            rightsIssueId,
            accountNo,
        ],
        queryFn: () =>
            getRightsHolderDetail(rightsIssueId, accountNo),
        enabled: !!rightsIssueId && !!accountNo,
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetShareholders = (
    params?: ShareholdersParams,
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<Shareholder>,
            Error,
            ContentPaginatedResponse<Shareholder>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["shareholders", params],
        queryFn: () => getShareholders(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetShareholderSummary = (
    registerSymbol?: string,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<ShareholderSummary>,
            Error,
            ApiResponse<ShareholderSummary>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["shareholder-summary", registerSymbol],
        queryFn: () => getShareholderSummary(registerSymbol),
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useGetHolderProfile = (
    id: string,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<HolderProfile>,
            Error,
            ApiResponse<HolderProfile>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-profile", id],
        queryFn: () => getHolderProfile(id),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};



export const useGetHolderTransfers = (
    id: string,
    params?: {
        page?: number;
        size?: number;
    },
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<HolderTransfer>,
            Error,
            ContentPaginatedResponse<HolderTransfer>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-transfers", id, params],
        queryFn: () => getHolderTransfers(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};



export const useGetHolderStatement = (
    id: string,
    params: HolderStatementParams,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<HolderStatement>,
            Error,
            ApiResponse<HolderStatement>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-statement", id, params],
        queryFn: () => getHolderStatement(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};



export const useGetHolderMergers = (
    id: string,
    params?: {
        page?: number;
        size?: number;
    },
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<HolderMerger>,
            Error,
            ContentPaginatedResponse<HolderMerger>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-mergers", id, params],
        queryFn: () => getHolderMergers(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};



export const useGetHolderDividends = (
    id: string,
    params?: HolderDividendsParams,
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<HolderDividend>,
            Error,
            ContentPaginatedResponse<HolderDividend>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-dividends", id, params],
        queryFn: () => getHolderDividends(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useGetDividendStatement = (
    id: string,
    params: HolderStatementParams,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<DividendStatement>,
            Error,
            ApiResponse<DividendStatement>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["dividend-statement", id, params],
        queryFn: () => getDividendStatement(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};



export const useGetHolderKycChanges = (
    id: string,
    params?: {
        page?: number;
        size?: number;
    },
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<HolderKycChange>,
            Error,
            ContentPaginatedResponse<HolderKycChange>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-kyc-changes", id, params],
        queryFn: () => getHolderKycChanges(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useGetHolderCertificates = (
    params: CertificatesParams,
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<Certificate>,
            Error,
            ContentPaginatedResponse<Certificate>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-certificates", params],
        queryFn: () => getCertificates(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetHolderCertificateDetail = (
    certNo: string,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<Certificate>,
            Error,
            ApiResponse<Certificate>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-certificate", certNo],
        queryFn: () => getCertificateDetail(certNo),
        enabled: !!certNo,
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useGetHolderAdmonRecords = (
    id: string,
    params?: {
        page?: number;
        size?: number;
    },
    options?: Omit<
        UseQueryOptions<
            ContentPaginatedResponse<HolderAdmonRecord>,
            Error,
            ContentPaginatedResponse<HolderAdmonRecord>
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["holder-admon-records", id, params],
        queryFn: () => getHolderAdmonRecords(id, params),
        enabled: !!id,
        refetchOnWindowFocus: false,
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