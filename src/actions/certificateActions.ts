// "use server";

import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Certificate, CertificateParams, CscsShareholder } from "@/types/cscs";

export const GET_CERTIFICATES = async (params?: CertificateParams) => {
    try {
        const res = await api.get<PaginatedResponse<Certificate>>(`/certificates`, {
            params
        });
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const GET_CERTIFICATE_BY_ID = async (id: string) => {
    try {
        const res = await api.get<ApiResponse<Certificate>>(`/certificates/${id}`);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const ISSUE_CERTIFICATE = async (payload: {
    registerId: string;
    shareholderId: string;
    accountNumber: string;
    units: number;
    issueDate: string;
    certNumber: string;
    notes?: string;
}) => {
    try {
        const res = await api.post<ApiResponse<Certificate>>(`/certificates`, payload);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

export const DISABLE_CERTIFICATE = async (id: string, data: { reason?: string }) => {
    try {
        const res = await api.patch<ApiResponse<Certificate>>(`/certificates/${id}/disable`, data);
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};

// shareholder lookup

export const GET_SHAREHOLDERS_CERTIFICATE = async (params: { search: string, registerId?: string }) => {
    try {
        const res = await api.get<ApiResponse<CscsShareholder[]>>(`/certificates/shareholders/lookup`, { params });
        return res.data;
    } catch (error) {
        const err = error as ErrorLike;
        throw new Error(returnErrorMessage(err));
    }
};