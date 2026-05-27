import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions
} from "@tanstack/react-query";
import { approveTransferRequest, batchApproveOrRejectTransferRequest, getAllTransferRequests, rejectTransferRequest, submitTransferRequest } from "@/actions/certTransferActions";
import { PaginatedResponse } from "@/types";
import { SubmitTransferRequest, TransferRequest, TransferRequestParams } from "@/types/cscs";


export const useGetAllTransferRequests = (params?: TransferRequestParams, options?: Omit<UseQueryOptions<PaginatedResponse<TransferRequest>, any, PaginatedResponse<TransferRequest>>, 'queryKey' | 'queryFn'>) => {

    return useQuery({
        queryKey: ["transfer-requests", params],
        queryFn: () => getAllTransferRequests(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};


export const useSubmitTransferRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SubmitTransferRequest) => submitTransferRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transfer-requests"] });
        },
    });
};

export const useRejectTransferRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ approvalId, data }: {
            approvalId: string,
            data: {
                comment: string,
                authorisedBy: string
            }
        }) => rejectTransferRequest(approvalId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transfer-requests"] });
        },
    });
};

export const useApproveTransferRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ approvalId, data }: {
            approvalId: string,
            data: {
                comment: string,
                authorisedBy: string
            }
        }) => approveTransferRequest(approvalId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transfer-requests"] });
        },
    });
};

export const useBatchApproveOrRejectTransferRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            approveIds: string[],
            rejectIds: string[],
            rejectComment: string,
            authorisedBy: string
        }) => batchApproveOrRejectTransferRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transfer-requests"] });
        },
    });
};
