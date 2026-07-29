import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SEED_REVERSALS,
  nextReversalRef,
} from "@/components/custom/dividend-reversals/seed-data";
import type {
  ReversalDecision,
  ReversalRequest,
  ReversalStatus,
  ReversalType,
} from "@/types/dividend-reversal-flow";

// Mock data source — mutates the shared seed array in place so a request moves
// from Pending → History as HOP acts, and appears immediately when created from
// the Enquiry module.

function delay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms));
}

const KEY = "dividend-reversals";

function today() {
  return new Date().toISOString().split("T")[0];
}

export interface ReversalFilters {
  status?: ReversalStatus | ReversalStatus[];
}

export function useReversalRequests(filters?: ReversalFilters) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      await delay(250);
      let rows = [...SEED_REVERSALS];
      if (filters?.status) {
        const statuses = Array.isArray(filters.status)
          ? filters.status
          : [filters.status];
        rows = rows.filter((r) => statuses.includes(r.status));
      }
      return rows.sort((a, b) =>
        a.dateRequested < b.dateRequested ? 1 : -1,
      );
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
    mutationFn: async (payload: CreateReversalPayload) => {
      await delay(600);
      const request: ReversalRequest = {
        id: nextReversalRef(),
        ...payload,
        dateRequested: today(),
        status: "PENDING",
        sourceAccountNumber: payload.accountNumber,
      };
      SEED_REVERSALS.unshift(request);
      return request;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDecideReversal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      actor,
      comment,
    }: {
      id: string;
      decision: ReversalDecision;
      actor: string;
      comment?: string;
    }) => {
      await delay(600);
      const idx = SEED_REVERSALS.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("Reversal request not found");
      const updated: ReversalRequest = {
        ...SEED_REVERSALS[idx],
        status: decision,
        decidedBy: actor,
        decisionDate: today(),
        decisionComment: comment,
      };
      SEED_REVERSALS[idx] = updated;
      return updated;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
