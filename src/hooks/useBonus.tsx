"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GET_BONUS_OFFERS } from "@/actions/offerSetUp";
import {
  GET_OR_CREATE_BONUS_DECLARATION,
  COMPUTE_BONUS_ISSUE_DECLARATION,
  GET_SHAREHOLDERS_BY_DECLARATION_ID,
  GET_DECLARATIONS,
  GET_DECLARATION_BY_ID,
  SUBMIT_DECLARATION_FOR_APPROVAL,
  APPROVE_DECLARATION,
  REJECT_DECLARATION,
  APPROVE_DECLARATION_BY_ICU,
  RETURN_DECLARATION_TO_OPS,
  GET_DELCARED_BONUS_ALLOTMENTS,
  EMAIL_SHAREHOLDERS,
  LODGE_BONUS,
} from "@/actions/bonusIssuesAction";

export const useBonusOffers = () =>
  useQuery({
    queryKey: ["bonus", "offers"],
    queryFn: () => GET_BONUS_OFFERS({ size: 100 }),
  });

export const useGetOrCreateBonusDeclaration = () =>
  useMutation({
    mutationFn: ({ offerId, createdBy }: { offerId: string | number; createdBy?: string }) =>
      GET_OR_CREATE_BONUS_DECLARATION(offerId, createdBy),
  });

export const useComputeBonus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ declarationId }: { declarationId: string | number }) =>
      COMPUTE_BONUS_ISSUE_DECLARATION({ declarationId }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["bonus", "entitlements", String(v.declarationId)] });
      qc.invalidateQueries({ queryKey: ["bonus", "declarations"] });
    },
  });
};

export const useBonusEntitlements = (
  declarationId?: string,
  params?: { page?: number; pageSize?: number },
  enabled = true,
) =>
  useQuery({
    queryKey: ["bonus", "entitlements", String(declarationId ?? ""), params ?? {}],
    queryFn: () => GET_SHAREHOLDERS_BY_DECLARATION_ID(declarationId, params),
    enabled: !!declarationId && enabled,
  });

export const useBonusDeclarations = (params?: {
  status?: string;
  registerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) =>
  useQuery({
    queryKey: ["bonus", "declarations", params ?? {}],
    queryFn: () => GET_DECLARATIONS(params),
  });

export const useBonusDeclaration = (id?: string) =>
  useQuery({
    queryKey: ["bonus", "declaration", String(id ?? "")],
    queryFn: () => GET_DECLARATION_BY_ID(id),
    enabled: !!id,
  });

export const useBonusAllotment = (
  declarationId?: string,
  params?: { page?: number; pageSize?: number },
) =>
  useQuery({
    queryKey: ["bonus", "allotment", String(declarationId ?? ""), params ?? {}],
    queryFn: () => GET_DELCARED_BONUS_ALLOTMENTS(declarationId, params),
    enabled: !!declarationId,
  });

function useInvalidateDeclarations() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["bonus", "declarations"] });
    qc.invalidateQueries({ queryKey: ["bonus", "allotment"] });
  };
}

export const useSubmitBonusForApproval = () => {
  const invalidate = useInvalidateDeclarations();
  return useMutation({
    mutationFn: ({ declarationId }: { declarationId: string | number }) =>
      SUBMIT_DECLARATION_FOR_APPROVAL({ declarationId }),
    onSuccess: invalidate,
  });
};

export const useApproveBonusDeclaration = () => {
  const invalidate = useInvalidateDeclarations();
  return useMutation({
    mutationFn: ({ declarationId, payload }: { declarationId: string | number; payload: unknown }) =>
      APPROVE_DECLARATION({ declarationId, payload }),
    onSuccess: invalidate,
  });
};

export const useRejectBonusDeclaration = () => {
  const invalidate = useInvalidateDeclarations();
  return useMutation({
    mutationFn: ({ declarationId, payload }: { declarationId: string | number; payload: unknown }) =>
      REJECT_DECLARATION({ declarationId, payload }),
    onSuccess: invalidate,
  });
};

export const useIcuApproveBonusDeclaration = () => {
  const invalidate = useInvalidateDeclarations();
  return useMutation({
    mutationFn: ({ declarationId, payload }: { declarationId: string | number; payload: unknown }) =>
      APPROVE_DECLARATION_BY_ICU({ declarationId, payload }),
    onSuccess: invalidate,
  });
};

export const useReturnBonusToOps = () => {
  const invalidate = useInvalidateDeclarations();
  return useMutation({
    mutationFn: ({ declarationId, payload }: { declarationId: string | number; payload: unknown }) =>
      RETURN_DECLARATION_TO_OPS({ declarationId, payload }),
    onSuccess: invalidate,
  });
};

export const useEmailBonusShareholders = () =>
  useMutation({
    mutationFn: ({ declarationId }: { declarationId: string | number }) =>
      EMAIL_SHAREHOLDERS({ declarationId }),
  });

export const useLodgeBonus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ declarationId, payload }: { declarationId: string | number; payload: { lodgmentDate?: string; lodgmentRef?: string; notes?: string; processedBy?: string } }) =>
      LODGE_BONUS(declarationId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bonus", "declarations"] }),
  });
};
