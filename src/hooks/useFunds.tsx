"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SEARCH_FUND_HOLDERS,
  SUBMIT_SUBSCRIPTION,
  BULK_SUBSCRIPTION,
  GET_PENDING_SUBSCRIPTIONS,
  GET_APPROVED_SUBSCRIPTIONS,
  APPROVE_SUBSCRIPTION,
  REJECT_SUBSCRIPTION,
  UPDATE_SUBSCRIPTION_FM_EMAIL,
  SUBMIT_REDEMPTION,
  BULK_REDEMPTION,
  GET_PENDING_REDEMPTIONS,
  GET_APPROVED_REDEMPTIONS,
  APPROVE_REDEMPTION,
  REJECT_REDEMPTION,
  UPDATE_REDEMPTION_FM_EMAIL,
  type SubmitSubscriptionPayload,
  type SubmitRedemptionPayload,
} from "@/actions/fundActions";

interface ListParams {
  search?: string;
  fundRegisterId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

/* ─── Shared ──────────────────────────────────────────────────────────────── */

export const useSearchFundHolders = (q: string, fundRegisterId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ["funds", "holders", q, fundRegisterId ?? ""],
    queryFn: () => SEARCH_FUND_HOLDERS(q, fundRegisterId),
    enabled: enabled && q.trim().length >= 2,
    refetchOnWindowFocus: false,
  });

/* ─── Subscriptions ────────────────────────────────────────────────────────── */

export const useSubmitSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitSubscriptionPayload) => SUBMIT_SUBSCRIPTION(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "subscriptions"] }),
  });
};

export const useBulkSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: { fundRegisterId: string; subscriberType: "NEW" | "EXISTING"; createdBy?: string } }) =>
      BULK_SUBSCRIPTION(file, meta),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "subscriptions"] }),
  });
};

export const usePendingSubscriptions = (params?: ListParams) =>
  useQuery({
    queryKey: ["funds", "subscriptions", "pending", params ?? {}],
    queryFn: () => GET_PENDING_SUBSCRIPTIONS(params),
  });

export const useApprovedSubscriptions = (params?: ListParams) =>
  useQuery({
    queryKey: ["funds", "subscriptions", "approved", params ?? {}],
    queryFn: () => GET_APPROVED_SUBSCRIPTIONS(params),
  });

export const useApproveSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy?: string }) => APPROVE_SUBSCRIPTION(id, approvedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "subscriptions"] }),
  });
};

export const useRejectSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionRemark, rejectedBy }: { id: string; rejectionRemark: string; rejectedBy?: string }) =>
      REJECT_SUBSCRIPTION(id, rejectionRemark, rejectedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "subscriptions"] }),
  });
};

export const useUpdateSubscriptionFmEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fundManagerEmail, updatedBy }: { id: string; fundManagerEmail: string; updatedBy?: string }) =>
      UPDATE_SUBSCRIPTION_FM_EMAIL(id, fundManagerEmail, updatedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "subscriptions"] }),
  });
};

/* ─── Redemptions ──────────────────────────────────────────────────────────── */

export const useSubmitRedemption = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitRedemptionPayload) => SUBMIT_REDEMPTION(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "redemptions"] }),
  });
};

export const useBulkRedemption = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: { fundRegisterId: string; createdBy?: string } }) =>
      BULK_REDEMPTION(file, meta),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "redemptions"] }),
  });
};

export const usePendingRedemptions = (params?: ListParams) =>
  useQuery({
    queryKey: ["funds", "redemptions", "pending", params ?? {}],
    queryFn: () => GET_PENDING_REDEMPTIONS(params),
  });

export const useApprovedRedemptions = (params?: ListParams) =>
  useQuery({
    queryKey: ["funds", "redemptions", "approved", params ?? {}],
    queryFn: () => GET_APPROVED_REDEMPTIONS(params),
  });

export const useApproveRedemption = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy?: string }) => APPROVE_REDEMPTION(id, approvedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "redemptions"] }),
  });
};

export const useRejectRedemption = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionRemark, rejectedBy }: { id: string; rejectionRemark: string; rejectedBy?: string }) =>
      REJECT_REDEMPTION(id, rejectionRemark, rejectedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "redemptions"] }),
  });
};

export const useUpdateRedemptionFmEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fundManagerEmail, updatedBy }: { id: string; fundManagerEmail: string; updatedBy?: string }) =>
      UPDATE_REDEMPTION_FM_EMAIL(id, fundManagerEmail, updatedBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funds", "redemptions"] }),
  });
};
