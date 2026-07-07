import api from "@/services/api";
import { returnErrorMessage, type ErrorLike } from "../utils/errorManager";

type ApprovalScope = "MY_DESK" | "GLOBAL";

type ApprovalModule =
  | "SETUP"
  | "DIVIDENDS"
  | "CERTIFICATES"
  | "ACCOUNT_MAINTENANCE"
  | "OFFERS";

type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RECALLED"
  | "RESUBMITTED";

interface GetApprovalsParams {
  scope: ApprovalScope;
  q?: string;
  module?: ApprovalModule;
  tier?: number;
  status?: ApprovalStatus;
  page?: number;
  size?: number;
  performedBy?: string;
}

export const GET_APPROVAL_SUMMARY = async (params: { performedBy: string }) => {
  try {
    const res = await api.get(`/approvals/summary`, { params });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_APPROVALS = async (params: GetApprovalsParams) => {
  try {
    const res = await api.get("/approvals", { params });
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const GET_APPROVAL_ITEM = async (id: string) => {
  try {
    const res = await api.get(`/approvals/${id}`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};

export const DOWNLOAD_SUPPORTING_DOC = async (id: string, docId: string) => {
  try {
    const res = await api.get(`/approvals/${id}/documents/${docId}/download`);
    return res.data;
  } catch (error) {
    const err = error as ErrorLike;
    throw new Error(returnErrorMessage(err));
  }
};
