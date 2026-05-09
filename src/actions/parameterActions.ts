"use server";

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

// ========================================
// services/currency.ts
// ========================================

// GET ALL WITH PAGINATION
export const getCurrencies = async (params?: GetCurrenciesParams) => {
  const response = await api.get<PaginatedResponse<Currency>>(
    "/parameters/currencies",
    {
      params,
    },
  );

  return response.data;
};

// GET ALL WITHOUT PAGINATION
export const getAllCurrencies = async () => {
  const response = await api.get<ApiResponse<Currency[]>>(
    "/parameters/currencies/all",
  );

  return response.data;
};

// GET BY ID
export const getCurrencyById = async (id: number) => {
  const response = await api.get<ApiResponse<Currency>>(
    `/parameters/currencies/${id}`,
  );

  return response.data;
};

// CREATE
export const createCurrency = async (payload: CreateCurrencyPayload) => {
  const response = await api.post<ApiResponse<Currency>>(
    "/parameters/currencies",
    payload,
  );

  return response.data;
};

// UPDATE
export const updateCurrency = async (
  id: number,
  payload: UpdateCurrencyPayload,
) => {
  const response = await api.put<ApiResponse<Currency>>(
    `/parameters/currencies/${id}`,
    payload,
  );

  return response.data;
};

// DELETE
export const deleteCurrency = async (id: number) => {
  const response = await api.delete<ApiResponse<string>>(
    `/parameters/currencies/${id}`,
  );

  return response.data;
};

// ========================================
// services/state.ts
// ========================================

// GET ALL STATES
export const getAllStates = async () => {
  const response = await api.get<ApiResponse<State[]>>(
    "/parameters/states/all",
  );

  return response.data;
};

// GET STATE BY ID
export const getStateById = async (id: number) => {
  const response = await api.get<ApiResponse<State>>(
    `/parameters/states/${id}`,
  );

  return response.data;
};

// GET LGAS BY STATE ID
export const getStateLgas = async (id: number) => {
  const response = await api.get<ApiResponse<LGA[]>>(
    `/parameters/states/${id}/lgas`,
  );

  return response.data;
};

// CREATE STATE
export const createState = async (payload: CreateStatePayload) => {
  const response = await api.post<ApiResponse<State>>(
    "/parameters/states",
    payload,
  );

  return response.data;
};

// UPDATE STATE
export const updateState = async (id: number, payload: UpdateStatePayload) => {
  const response = await api.put<ApiResponse<State>>(
    `/parameters/states/${id}`,
    payload,
  );

  return response.data;
};

// DELETE STATE
export const deleteState = async (id: number) => {
  const response = await api.delete<ApiResponse<string>>(
    `/parameters/states/${id}`,
  );

  return response.data;
};

// ========================================
// services/lga.ts
// ========================================

// GET ALL LGAs
export const getAllLgas = async () => {
  const response = await api.get<ApiResponse<LGA[]>>("/parameters/lgas/all");
  return response.data?.data;
};

// GET LGAs BY STATE
export const getLgasByState = async (stateId?: number) => {
  const response = await api.get<ApiResponse<LGA[]>>(
    `/parameters/lgas/state/${stateId}`,
  );
  return response.data?.data;
};

// GET LGA BY ID
export const getLgaById = async (id: number) => {
  const response = await api.get<ApiResponse<LGA>>(`/parameters/lgas/${id}`);
  return response.data;
};

// CREATE LGA
export const createLga = async (payload: CreateLgaPayload) => {
  const response = await api.post<ApiResponse<LGA>>(
    "/parameters/lgas",
    payload,
  );
  return response.data;
};

// UPDATE LGA
export const updateLga = async (id: number, payload: UpdateLgaPayload) => {
  const response = await api.put<ApiResponse<LGA>>(
    `/parameters/lgas/${id}`,
    payload,
  );
  return response.data;
};

// DELETE LGA
export const deleteLga = async (id: number) => {
  const response = await api.delete<ApiResponse<string>>(
    `/parameters/lgas/${id}`,
  );
  return response.data;
};

// ========================================
// services/caution-reason.ts
// ========================================

// GET ALL WITH PAGINATION
export const getCautionReasons = async (params?: GetCautionReasonsParams) => {
  const response = await api.get<PaginatedResponse<CautionReason>>(
    "/parameters/caution-reasons",
    {
      params,
    },
  );

  return response.data;
};

// GET ALL WITHOUT PAGINATION
export const getAllCautionReasons = async () => {
  const response = await api.get<ApiResponse<CautionReason[]>>(
    "/parameters/caution-reasons/all",
  );

  return response.data;
};

// GET BY CODE
export const getCautionReasonByCode = async (code: string) => {
  const response = await api.get<ApiResponse<CautionReason>>(
    `/parameters/caution-reasons/${code}`,
  );

  return response.data;
};

// CREATE
export const createCautionReason = async (
  payload: CreateCautionReasonPayload,
) => {
  const response = await api.post<ApiResponse<CautionReason>>(
    "/parameters/caution-reasons",
    payload,
  );

  return response.data;
};

// UPDATE
export const updateCautionReason = async (
  code: string,
  payload: UpdateCautionReasonPayload,
) => {
  const response = await api.put<ApiResponse<CautionReason>>(
    `/parameters/caution-reasons/${code}`,
    payload,
  );

  return response.data;
};

// DELETE
export const deleteCautionReason = async (code: string) => {
  const response = await api.delete<ApiResponse<string>>(
    `/parameters/caution-reasons/${code}`,
  );

  return response.data;
};

// ========================================
// services/document-type.ts
// ========================================

// GET ALL DOCUMENT TYPES
export const getDocumentTypes = async () => {
  const response = await api.get<ApiResponse<DocumentType[]>>(
    "/parameters/document-types",
  );

  return response.data;
};

// GET DOCUMENT TYPE BY CODE
export const getDocumentTypeByCode = async (code: string) => {
  const response = await api.get<ApiResponse<DocumentType>>(
    `/parameters/document-types/${code}`,
  );

  return response.data;
};

// CREATE DOCUMENT TYPE
export const createDocumentType = async (
  payload: CreateDocumentTypePayload,
) => {
  const response = await api.post<ApiResponse<DocumentType>>(
    "/parameters/document-types",
    payload,
  );

  return response.data;
};

// UPDATE DOCUMENT TYPE
export const updateDocumentType = async (
  code: string,
  payload: UpdateDocumentTypePayload,
) => {
  const response = await api.put<ApiResponse<DocumentType>>(
    `/parameters/document-types/${code}`,
    payload,
  );

  return response.data;
};

// DELETE DOCUMENT TYPE
export const deleteDocumentType = async (code: string) => {
  const response = await api.delete<ApiResponse<string>>(
    `/parameters/document-types/${code}`,
  );

  return response.data;
};
