"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GET_RECON_FLAGGED,
  RESOLVE_RECON_FLAGGED,
  GET_SHAREHOLDER_TX_HISTORY,
  SAVE_RECONCILIATION,
  type ReconSaveEntry,
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

export const useShareholderTxHistory = (chn?: string, register?: string) =>
  useQuery({
    queryKey: ["reconciliation", "tx-history", chn ?? "", register ?? ""],
    queryFn: () => GET_SHAREHOLDER_TX_HISTORY(chn!, register!),
    enabled: !!chn && !!register,
  });

export const useSaveReconciliation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      chn: string;
      register: string;
      flaggedItemId?: string;
      transactions: ReconSaveEntry[];
    }) => SAVE_RECONCILIATION(payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["reconciliation", "tx-history", v.chn, v.register] });
      qc.invalidateQueries({ queryKey: ["reconciliation", "flagged"] });
    },
  });
};
