import { authoriseConsolidation, batchAuthoriseConsolidations, BatchConsolidationRequest, BatchConsolidationResponse, batchRejectConsolidations, Consolidation, ConsolidationDecisionRequest, ConsolidationFilters, ConsolidationListResponse, ConsolidationUploadJob, createConsolidation, CreateConsolidationRequest, getConsolidation, getConsolidations, rejectConsolidation, uploadConsolidations } from "@/actions/accountMaintenanceActions";
import { ApiResponse } from "@/types";
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from "@tanstack/react-query";

export const useGetConsolidations = (
    params?: ConsolidationFilters,
    options?: Omit<
        UseQueryOptions<
            ApiResponse<ConsolidationListResponse>
        >,
        "queryKey" | "queryFn"
    >,
) =>
    useQuery({
        queryKey: ["consolidations", params],
        queryFn: () => getConsolidations(params),
        refetchOnWindowFocus: false,
        ...options,
    });

export const useGetConsolidation = (
    id: number,
    options?: Omit<
        UseQueryOptions<ApiResponse<Consolidation>>,
        "queryKey" | "queryFn"
    >,
) =>
    useQuery({
        queryKey: ["consolidation", id],
        queryFn: () => getConsolidation(id),
        enabled: !!id,
        refetchOnWindowFocus: false,
        ...options,
    });


export const useCreateConsolidation = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<Consolidation>,
            Error,
            CreateConsolidationRequest
        >,
        "mutationFn"
    >,
) =>
    useMutation({
        mutationFn: createConsolidation,
        ...options,
    });

export const useAuthoriseConsolidation = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<Consolidation>,
            Error,
            {
                id: number;
                data: ConsolidationDecisionRequest;
            }
        >,
        "mutationFn"
    >,
) =>
    useMutation({
        mutationFn: ({ id, data }) =>
            authoriseConsolidation(id, data),
        ...options,
    });

export const useRejectConsolidation = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<Consolidation>,
            Error,
            {
                id: number;
                data: ConsolidationDecisionRequest;
            }
        >,
        "mutationFn"
    >,
) =>
    useMutation({
        mutationFn: ({ id, data }) =>
            rejectConsolidation(id, data),
        ...options,
    });

export const useBatchAuthoriseConsolidations = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<BatchConsolidationResponse>,
            Error,
            BatchConsolidationRequest
        >,
        "mutationFn"
    >,
) =>
    useMutation({
        mutationFn: batchAuthoriseConsolidations,
        ...options,
    });

export const useBatchRejectConsolidations = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<BatchConsolidationResponse>,
            Error,
            BatchConsolidationRequest
        >,
        "mutationFn"
    >,
) =>
    useMutation({
        mutationFn: batchRejectConsolidations,
        ...options,
    });

export const useUploadConsolidations = (
    options?: Omit<
        UseMutationOptions<
            ApiResponse<ConsolidationUploadJob>,
            Error,
            {
                registerId: string;
                file: File;
            }
        >,
        "mutationFn"
    >,
) =>
    useMutation({
        mutationFn: ({ registerId, file }) =>
            uploadConsolidations(registerId, file),
        ...options,
    });