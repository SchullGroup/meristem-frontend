import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  listPaymentRunsRequest,
  initiatePaymentRunRequest,
  getPaymentRunByIdRequest,
  repushPaymentRunRequest,
  approvePaymentRunRequest,
  downloadPaymentRunReceiptRequest,
  listRepushQueueRequest,
  repushSingleRequest,
  batchRepushRequest,
  batchPushMandateQueueToNibssRequest,
  pushMandateQueueToNibssRequest,
  declarationPaymentRequest,
  downloadNibssFileRequest,
} from "@/actions/dividendPayments";
import type {
  PaymentRun,
  InitiatePaymentRunRequest,
  ApprovePaymentRunRequest,
  RepushResponse,
  ListPaymentRunsParams,
  DividendDeclaration,
  RepushQueueItem,
  SingleRepushResponse,
  BatchRepushRequest,
  BatchRepushResponse,
  ListRepushQueueParams,
  DeclarationPaymentResponse,
} from "@/actions/dividendPayments";
import { ApiResponse, PaginatedResponse } from "@/types";
import { GET_ALL_DIVIDEND_DECLARATIONS } from "@/actions/divDeclarationActions";
import { GET_LOADED_MANDATE_QUEUES } from "@/actions/divNewMandate";

export const useListPaymentRuns = (
  params?: ListPaymentRunsParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<PaymentRun>,
      Error,
      PaginatedResponse<PaymentRun>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["payment-runs", params],
    queryFn: () => listPaymentRunsRequest(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useGetPaymentRunById = (
  id: number,
  options?: Omit<
    UseQueryOptions<ApiResponse<PaymentRun>, Error, ApiResponse<PaymentRun>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["payment-run", id],
    queryFn: () => getPaymentRunByIdRequest(id),
    refetchOnWindowFocus: false,
    enabled: !!id,
    ...options,
  });
};

export const useGetDeclarationPayment = (params?: {
  registerId?: string;
  paymentNumber?: string;
  status?: string;
  page?: number;
  size?: number;
},
  options?: Omit<
    UseQueryOptions<DeclarationPaymentResponse, Error, DeclarationPaymentResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["declaration-payment", params],
    queryFn: () => declarationPaymentRequest(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useInitiatePaymentRun = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PaymentRun>,
      Error,
      InitiatePaymentRunRequest
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InitiatePaymentRunRequest) =>
      initiatePaymentRunRequest(data),
    onSuccess: () => {
      // Invalidate list queries to refresh the table
      queryClient.invalidateQueries({ queryKey: ["payment-runs"] });
    },
    ...options,
  });
};

export const useRepushPaymentRun = (
  options?: Omit<
    UseMutationOptions<ApiResponse<RepushResponse>, Error, number>,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => repushPaymentRunRequest(id),
    onSuccess: (_, id) => {
      // Invalidate the specific run's details and the list
      queryClient.invalidateQueries({ queryKey: ["payment-run", id] });
      queryClient.invalidateQueries({ queryKey: ["payment-runs"] });
    },
    ...options,
  });
};

export const useApprovePaymentRun = (
  options?: Omit<
    UseMutationOptions<
      ApiResponse<PaymentRun>,
      Error,
      { id: number; body: ApprovePaymentRunRequest }
    >,
    "mutationKey" | "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: ApprovePaymentRunRequest;
    }) => approvePaymentRunRequest(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["payment-run", id] });
      queryClient.invalidateQueries({ queryKey: ["payment-runs"] });
    },
    ...options,
  });
};

export const useDownloadPaymentRunReceipt = (
  options?: Omit<
    UseMutationOptions<Blob, Error, number>,
    "mutationKey" | "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: (id: number) => downloadPaymentRunReceiptRequest(id),
    ...options,
  });
};

export const useDownloadNibssFile = (
  options?: Omit<
    UseMutationOptions<Blob, Error, number>,
    "mutationKey" | "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: (id: number) => downloadNibssFileRequest(id),
    ...options,
  });
};


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

}


export const useGetMandatePayments = (params?: {
  registerId?: string;
  dividendNumber?: string;
  page?: number;
  size?: number;
},
  options?: Omit<UseQueryOptions<PaginatedResponse<DividendDeclaration>, Error, PaginatedResponse<DividendDeclaration>>, "queryKey" | "queryFn">) => {
  return useQuery({
    queryKey: ["loaded-mandate-queue", params?.registerId, params?.dividendNumber, params?.page, params?.size],
    queryFn: ({ queryKey }) => GET_LOADED_MANDATE_QUEUES({ queryKey: queryKey as [string, string, string, number, number] }),
    enabled: !!params?.registerId && !!params?.dividendNumber,
    ...options
  });


}

// hook to push mandate queue to nibss
export const usePushMandateQueueToNibss = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => pushMandateQueueToNibssRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["loaded-mandate-queue", id] });
      queryClient.invalidateQueries({ queryKey: ["loaded-mandate-queue"] });
    },
  });
};

export const useBatchPushMandateQueueToNibss = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { ids: string[] }) => batchPushMandateQueueToNibssRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loaded-mandate-queue"] });
    },
  });
};


// Hook to list repush queue
export const useListRepushQueue = (
  params?: ListRepushQueueParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<RepushQueueItem>,
      Error,
      PaginatedResponse<RepushQueueItem>
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['repush-queue', params],
    queryFn: () => listRepushQueueRequest(params),
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Mutation to repush a single item
export const useRepushSingle = (
  options?: Omit<
    UseMutationOptions<ApiResponse<SingleRepushResponse>, Error, number>,
    'mutationKey' | 'mutationFn'
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => repushSingleRequest(id),
    onSuccess: () => {
      // Invalidate the list to reflect updated statuses
      queryClient.invalidateQueries({ queryKey: ['repush-queue'] });
    },
    ...options,
  });
};

// Mutation for batch repush
export const useBatchRepush = (
  options?: Omit<
    UseMutationOptions<ApiResponse<BatchRepushResponse>, Error, BatchRepushRequest>,
    'mutationKey' | 'mutationFn'
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BatchRepushRequest) => batchRepushRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repush-queue'] });
    },
    ...options,
  });
};