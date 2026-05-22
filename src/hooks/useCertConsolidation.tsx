import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions
} from "@tanstack/react-query";
import { PaginatedResponse } from "@/types";
import { approveConsolidationRequest, batchApproveOrRejectConsolidationRequest, getAllConsolidationRequests, rejectConsolidationRequest, submitConsolidationRequest } from "@/actions/certConsolidation";
import { CertificateConsolidation, ConsolidationRequestParams, SubmitConsolidationRequest } from "@/types/cscs";


export const useGetAllCertConsolidations = (params?: ConsolidationRequestParams, options?: Omit<UseQueryOptions<PaginatedResponse<CertificateConsolidation>, any, PaginatedResponse<CertificateConsolidation>>, 'queryKey' | 'queryFn'>) => {

    return useQuery({
        queryKey: ["consolidation", params],
        queryFn: () => getAllConsolidationRequests(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useSubmitConsolidationRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SubmitConsolidationRequest) => submitConsolidationRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["consolidation"] });
        },
    });
};

export const useRejectConsolidationRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ approvalId, data }: {
            approvalId: string,
            data: {
                comment: string,
                authorisedBy: string
            }
        }) => rejectConsolidationRequest(approvalId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["consolidation"] });
        },
    });
};

export const useApproveConsolidationRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ approvalId, data }: {
            approvalId: string,
            data: {
                comment: string,
                authorisedBy: string
            }
        }) => approveConsolidationRequest(approvalId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["consolidation"] });
        },
    });
};

export const useBatchApproveOrRejectConsolidationRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            approveIds: string[],
            rejectIds: string[],
            rejectComment: string,
            authorisedBy: string
        }) => batchApproveOrRejectConsolidationRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["consolidation"] });
        },
    });
};
