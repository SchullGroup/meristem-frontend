import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions
} from "@tanstack/react-query";
import { getAllCertificateDemat, captureDematRequest, rejectDematRequest, lodgetDematRequest, icuApproveDematRequest, submitForCalloverDematRequest, authorizeDematRequest, bulkRejectDematRequest, bulkIcuApproveDematRequest, bulkAuthorizeDematRequest, getDematRecordById, getWorkflowStageCounts, DematParams, Demat, CaptureDematRequest } from "@/actions/certDematActions";
import { ContentPaginatedResponse } from "@/types";


export const useGetAllCertificateDemat = (params?: DematParams, options?: Omit<UseQueryOptions<ContentPaginatedResponse<Demat>, any, ContentPaginatedResponse<Demat>>, 'queryKey' | 'queryFn'>) => {

    return useQuery({
        queryKey: ["demat", params],
        queryFn: () => getAllCertificateDemat(params),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useCaptureDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CaptureDematRequest) => captureDematRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useRejectDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: { reason: string } }) => rejectDematRequest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useLodgetDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: { reason: { rinStatus: "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS"; method: "DOWNLOAD" | "PUSH"; } } }) => lodgetDematRequest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useIcuApproveDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => icuApproveDematRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useSubmitForCalloverDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => submitForCalloverDematRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useAuthorizeDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => authorizeDematRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useBulkRejectDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => bulkRejectDematRequest(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useBulkIcuApproveDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => bulkIcuApproveDematRequest(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useBulkAuthorizeDematRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => bulkAuthorizeDematRequest(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["demat"] });
        },
    });
};

export const useGetDematRecordById = (id: string, options?: Omit<UseQueryOptions<Demat, any, Demat>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ["demat", id],
        queryFn: () => getDematRecordById(id),
        refetchOnWindowFocus: false,
        ...options,
    });
};

export const useGetWorkflowStageCounts = (options?: Omit<UseQueryOptions<{
    [key: string]: number;
}, any, {
    [key: string]: number;
}>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ["demat", "workflow-stage-counts"],
        queryFn: () => getWorkflowStageCounts(),
        refetchOnWindowFocus: false,
        ...options,
    });
};