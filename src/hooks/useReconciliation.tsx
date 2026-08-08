"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GET_RECON_FLAGGED,
  RESOLVE_RECON_FLAGGED,
  ALLOW_RECON_TRADE,
  GET_SHAREHOLDER_TX_HISTORY,
  GET_HOLDER_CERTIFICATES,
  SAVE_RECONCILIATION_CERTIFICATES,
  type ReconCertEntry,
} from "@/actions/reconciliationActions";

export const useReconFlagged = (params?: {
  batchRef?: string;
  register?: string;
  status?: "PENDING" | "RESOLVED";
  q?: string;
  page?: number;
  pageSize?: number;
}) =>
  useQuery({
    queryKey: ["reconciliation", "flagged", params ?? {}],
    queryFn: () => GET_RECON_FLAGGED(params),
  });

export const useResolveReconFlagged = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => RESOLVE_RECON_FLAGGED(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reconciliation", "flagged"] }),
  });
};

/** Officer override — force-apply a flagged trade (mandatory reason; backend blocks true oversells). */
export const useAllowReconTrade = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ALLOW_RECON_TRADE(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reconciliation", "flagged"] });
      qc.invalidateQueries({ queryKey: ["reconciliation", "holder-certificates"] });
    },
  });
};

export const useShareholderTxHistory = (chn?: string, register?: string) =>
  useQuery({
    queryKey: ["reconciliation", "tx-history", chn ?? "", register ?? ""],
    queryFn: () => GET_SHAREHOLDER_TX_HISTORY(chn!, register!),
    enabled: !!chn && !!register,
  });

/** Left panel: the shareholder's certificate ledger, grouped per account (multi-CHN aware). */
export const useHolderCertificates = (chn?: string, register?: string) =>
  useQuery({
    queryKey: ["reconciliation", "holder-certificates", chn ?? "", register ?? ""],
    queryFn: () => GET_HOLDER_CERTIFICATES(chn!, register!),
    enabled: !!chn && !!register,
  });

export const useSaveReconciliationCertificates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      register: string;
      flaggedItemId?: string;
      note?: string;
      entries: ReconCertEntry[];
    }) => SAVE_RECONCILIATION_CERTIFICATES(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reconciliation", "holder-certificates"] });
      qc.invalidateQueries({ queryKey: ["reconciliation", "flagged"] });
    },
  });
};
