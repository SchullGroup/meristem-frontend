// "use server";

import api from "@/services/api";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
  CreateCurrencyPayload,
  Currency,
  GetCurrenciesParams,
  UpdateCurrencyPayload,
  CreateStatePayload,
  LGA,
  State,
  UpdateStatePayload,
  CreateLgaPayload,
  UpdateLgaPayload,
  CautionReason,
  CreateCautionReasonPayload,
  GetCautionReasonsParams,
  UpdateCautionReasonPayload,
  CreateDocumentTypePayload,
  DocumentType,
  UpdateDocumentTypePayload,
} from "@/types/parameters";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

// ========================================
// services/currency.ts
// ========================================

// GET ALL WITH PAGINATION
export const getCurrencies = async (params?: GetCurrenciesParams) => {
  try {
    const response = await api.get<PaginatedResponse<Currency>>(
      "/parameters/currencies",
      {
        params,
      },
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET ALL WITHOUT PAGINATION
export const getAllCurrencies = async () => {
  try {
    const response = await api.get<ApiResponse<Currency[]>>(
      "/parameters/currencies/all",
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET BY ID
export const getCurrencyById = async (id: number) => {
  try {
    const response = await api.get<ApiResponse<Currency>>(
      `/parameters/currencies/${id}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// CREATE
export const createCurrency = async (payload: CreateCurrencyPayload) => {
  try {
    const response = await api.post<ApiResponse<Currency>>(
      "/parameters/currencies",
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// UPDATE
export const updateCurrency = async (
  id: number,
  payload: UpdateCurrencyPayload,
) => {
  try {
    const response = await api.put<ApiResponse<Currency>>(
      `/parameters/currencies/${id}`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// DELETE
export const deleteCurrency = async (id: number) => {
  try {
    const response = await api.delete<ApiResponse<string>>(
      `/parameters/currencies/${id}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ========================================
// services/state.ts
// ========================================

// GET ALL STATES
export const getAllStates = async () => {
  try {
    const response = await api.get<ApiResponse<State[]>>(
      "/parameters/states/all",
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET STATE BY ID
export const getStateById = async (id: number) => {
  try {
    const response = await api.get<ApiResponse<State>>(
      `/parameters/states/${id}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET LGAS BY STATE ID
export const getStateLgas = async (id: number) => {
  try {
    const response = await api.get<ApiResponse<LGA[]>>(
      `/parameters/states/${id}/lgas`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// CREATE STATE
export const createState = async (payload: CreateStatePayload) => {
  try {
    const response = await api.post<ApiResponse<State>>(
      "/parameters/states",
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// UPDATE STATE
export const updateState = async (id: number, payload: UpdateStatePayload) => {
  try {
    const response = await api.put<ApiResponse<State>>(
      `/parameters/states/${id}`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// DELETE STATE
export const deleteState = async (id: number) => {
  try {
    const response = await api.delete<ApiResponse<string>>(
      `/parameters/states/${id}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ========================================
// services/lga.ts
// ========================================

// GET ALL LGAs
export const getAllLgas = async () => {
  try {
    const response = await api.get<ApiResponse<LGA[]>>("/parameters/lgas/all");
    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET LGAs BY STATE
export const getLgasByState = async (stateId?: number) => {
  try {
    const response = await api.get<ApiResponse<LGA[]>>(
      `/parameters/lgas/state/${stateId}`,
    );
    return response.data?.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET LGA BY ID
export const getLgaById = async (id: number) => {
  try {
    const response = await api.get<ApiResponse<LGA>>(`/parameters/lgas/${id}`);
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// CREATE LGA
export const createLga = async (payload: CreateLgaPayload) => {
  try {
    const response = await api.post<ApiResponse<LGA>>(
      "/parameters/lgas",
      payload,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// UPDATE LGA
export const updateLga = async (id: number, payload: UpdateLgaPayload) => {
  try {
    const response = await api.put<ApiResponse<LGA>>(
      `/parameters/lgas/${id}`,
      payload,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// DELETE LGA
export const deleteLga = async (id: number) => {
  try {
    const response = await api.delete<ApiResponse<string>>(
      `/parameters/lgas/${id}`,
    );
    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ========================================
// services/caution-reason.ts
// ========================================

// GET ALL WITH PAGINATION
export const getCautionReasons = async (params?: GetCautionReasonsParams) => {
  try {
    const response = await api.get<PaginatedResponse<CautionReason>>(
      "/parameters/caution-reasons",
      {
        params,
      },
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET ALL WITHOUT PAGINATION
export const getAllCautionReasons = async () => {
  try {
    const response = await api.get<ApiResponse<CautionReason[]>>(
      "/parameters/caution-reasons/all",
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET BY CODE
export const getCautionReasonByCode = async (code: string) => {
  try {
    const response = await api.get<ApiResponse<CautionReason>>(
      `/parameters/caution-reasons/${code}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// CREATE
export const createCautionReason = async (
  payload: CreateCautionReasonPayload,
) => {
  try {
    const response = await api.post<ApiResponse<CautionReason>>(
      "/parameters/caution-reasons",
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// UPDATE
export const updateCautionReason = async (
  code: string,
  payload: UpdateCautionReasonPayload,
) => {
  try {
    const response = await api.put<ApiResponse<CautionReason>>(
      `/parameters/caution-reasons/${code}`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// DELETE
export const deleteCautionReason = async (code: string) => {
  try {
    const response = await api.delete<ApiResponse<string>>(
      `/parameters/caution-reasons/${code}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// ========================================
// services/document-type.ts
// ========================================

// GET ALL DOCUMENT TYPES
export const getDocumentTypes = async () => {
  try {
    const response = await api.get<ApiResponse<DocumentType[]>>(
      "/parameters/document-types",
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// GET DOCUMENT TYPE BY CODE
export const getDocumentTypeByCode = async (code: string) => {
  try {
    const response = await api.get<ApiResponse<DocumentType>>(
      `/parameters/document-types/${code}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// CREATE DOCUMENT TYPE
export const createDocumentType = async (
  payload: CreateDocumentTypePayload,
) => {
  try {
    const response = await api.post<ApiResponse<DocumentType>>(
      "/parameters/document-types",
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// UPDATE DOCUMENT TYPE
export const updateDocumentType = async (
  code: string,
  payload: UpdateDocumentTypePayload,
) => {
  try {
    const response = await api.put<ApiResponse<DocumentType>>(
      `/parameters/document-types/${code}`,
      payload,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

// DELETE DOCUMENT TYPE
export const deleteDocumentType = async (code: string) => {
  try {
    const response = await api.delete<ApiResponse<string>>(
      `/parameters/document-types/${code}`,
    );

    return response.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
