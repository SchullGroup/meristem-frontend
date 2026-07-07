// ========================================
// hooks/useDocumentTypes.ts
// ========================================

import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createDocumentType,
  deleteDocumentType,
  getDocumentTypeByCode,
  getDocumentTypes,
  updateDocumentType,
} from "@/actions/parameterActions";

import {
  CreateDocumentTypePayload,
  DocumentType,
  UpdateDocumentTypePayload,
} from "@/types/parameters";
import { ApiResponse } from "@/types";

// ========================================
// QUERY KEYS
// ========================================

export const documentTypeKeys = {
  all: ["document-types"] as const,

  lists: () => [...documentTypeKeys.all, "list"] as const,

  list: () => [...documentTypeKeys.lists()] as const,

  details: () => [...documentTypeKeys.all, "detail"] as const,

  detail: (code: string) => [...documentTypeKeys.details(), code] as const,
};

// ========================================
// GET ALL DOCUMENT TYPES
// ========================================

export const useGetDocumentTypes = (
  options?: Omit<
    UseQueryOptions<ApiResponse<DocumentType[]>, Error, DocumentType[]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: documentTypeKeys.list(),

    queryFn: getDocumentTypes,

    select: (data) => data.data,

    ...options,
  });
};

// ========================================
// GET DOCUMENT TYPE BY CODE
// ========================================

export const useGetDocumentTypeByCode = (
  code: string,
  options?: Omit<
    UseQueryOptions<ApiResponse<DocumentType>, Error, DocumentType>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: documentTypeKeys.detail(code),

    queryFn: () => getDocumentTypeByCode(code),

    select: (data) => data.data,

    enabled: !!code,

    ...options,
  });
};

// ========================================
// CREATE DOCUMENT TYPE
// ========================================

export const useCreateDocumentType = (
  options?: UseMutationOptions<
    ApiResponse<DocumentType>,
    Error,
    CreateDocumentTypePayload
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocumentType,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: documentTypeKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// UPDATE DOCUMENT TYPE
// ========================================

type UpdateDocumentTypeVariables = {
  code: string;
  payload: UpdateDocumentTypePayload;
};

export const useUpdateDocumentType = (
  options?: UseMutationOptions<
    ApiResponse<DocumentType>,
    Error,
    UpdateDocumentTypeVariables
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, payload }) => updateDocumentType(code, payload),

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: documentTypeKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// DELETE DOCUMENT TYPE
// ========================================

export const useDeleteDocumentType = (
  options?: UseMutationOptions<ApiResponse<string>, Error, string>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocumentType,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: documentTypeKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};
