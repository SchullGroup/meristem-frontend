import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import {
  createLga,
  updateLga,
  deleteLga,
  getAllLgas,
  getLgasByState,
} from "@/actions/parameterActions";

import { CreateLgaPayload, LGA, UpdateLgaPayload } from "@/types/parameters";

import { ApiResponse } from "@/types";
import { stateKeys } from "./useStates";

export const lgaKeys = {
  all: ["lgas"] as const,

  lists: () => [...lgaKeys.all, "list"] as const,

  list: () => [...lgaKeys.lists()] as const,

  details: () => [...lgaKeys.all, "detail"] as const,

  detail: (id: number) => [...lgaKeys.details(), id] as const,
};

// ========================================
// GET ALL LGAs
// ========================================
export const useGetAllLGAs = (
  options?: Omit<UseQueryOptions<LGA[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ["lgas"],
    queryFn: getAllLgas,
    ...options,
  });
};

// ========================================
// GET LGAs BY STATE
// ========================================
export const useGetLGAsByState = (
  stateId?: number,
  options?: Omit<UseQueryOptions<LGA[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ["lgas", stateId],
    queryFn: () => getLgasByState(stateId),
    enabled: !!stateId,
    ...options,
  });
};

// ========================================
// GET LGA BY ID
// ========================================
// ========================================
// CREATE LGA
// ========================================

export const useCreateLGA = (
  options?: UseMutationOptions<ApiResponse<LGA>, Error, CreateLgaPayload>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLga,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: stateKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["lgas"],
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// UPDATE LGA
// ========================================

type UpdateLgaVariables = {
  id: number;
  payload: UpdateLgaPayload;
};

export const useUpdateLGA = (
  options?: UseMutationOptions<ApiResponse<LGA>, Error, UpdateLgaVariables>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => updateLga(id, payload),

    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["states"] });
      queryClient.invalidateQueries({ queryKey: ["lgas"] });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};

// ========================================
// DELETE LGA
// ========================================

export const useDeleteLGA = (
  options?: UseMutationOptions<ApiResponse<string>, Error, number>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLga,

    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: stateKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: lgaKeys.all,
      });

      options?.onSuccess?.(...args);
    },

    ...options,
  });
};
