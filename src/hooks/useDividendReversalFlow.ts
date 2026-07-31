import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GET_REVERSALS,
  CREATE_REVERSAL,
  DECIDE_REVERSAL,
} from "@/actions/dividendReversalActions";
import type {
  ReversalDecision,
  ReversalStatus,
  ReversalType,
} from "@/types/dividend-reversal-flow";

// Real API-backed implementation of the dividend reversals flow. Hook names, signatures and
// return shapes are unchanged from the previous mock so the Pending / History tabs and the
// Enquiry-launched request modal bind unchanged — the backend DividendReversalResponse mirrors
// ReversalRequest 1:1. Status filtering stays client-side (History wants APPROVED+REJECTED,
// which the single-status backend param can't express in one call).

const KEY = "dividend-reversals";

export interface ReversalFilters {
  status?: ReversalStatus | ReversalStatus[];
}

export function useReversalRequests(filters?: ReversalFilters) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const rows = await GET_REVERSALS(filters?.status);
      let out = [...rows];
      if (filters?.status) {
        const statuses = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
        out = out.filter((r) => statuses.includes(r.status));
      }
      return out.sort((a, b) => (a.dateRequested < b.dateRequested ? 1 : -1));
    },
    refetchOnWindowFocus: false,
  });
}

export interface CreateReversalPayload {
  holderName: string;
  registerSymbol: string;
  accountNumber: string;
  dividendNumber: string;
  amount: number;
  reversalType: ReversalType;
  reason: string;
  supportingDocName?: string;
  requestedBy: string;
  sourceHolderId?: string;
}

export function useCreateReversalRequest() {
  const qc = useQueryClient();
  return useMutation({
    // requestedBy is derived server-side from the authenticated principal; the rest maps 1:1.
    mutationFn: (payload: CreateReversalPayload) =>
      CREATE_REVERSAL({
        holderName: payload.holderName,
        registerSymbol: payload.registerSymbol,
        accountNumber: payload.accountNumber,
        dividendNumber: payload.dividendNumber,
        amount: payload.amount,
        reversalType: payload.reversalType,
        reason: payload.reason,
        supportingDocName: payload.supportingDocName,
        sourceHolderId: payload.sourceHolderId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDecideReversal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      comment,
    }: {
      id: string;
      decision: ReversalDecision;
      actor: string;
      comment?: string;
    }) => DECIDE_REVERSAL(id, { decision, comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
