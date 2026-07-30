"use client";

import { useMutation, useQuery, useQueryClient, type Query } from "@tanstack/react-query";
import {
  GET_CSCS_BATCHES,
  UPLOAD_CSCS_BATCH,
  PROCESS_CSCS_BATCH,
  GET_CSCS_BATCH,
  GET_CSCS_BATCH_REGISTERS,
  GET_CSCS_BATCH_HOLDERS,
  UPDATE_CSCS_HOLDER_STATE,
  ACCEPT_CSCS_GIS_STATES,
  COMMIT_CSCS_STATES,
  GET_CSCS_BANK_CHANGES,
  GET_CSCS_TRADE_BALANCES,
  APPLY_CSCS_TRADE_BALANCES,
  FINALIZE_CSCS_BATCH,
  GET_CSCS_BATCH_SUMMARY,
  GET_CSCS_PROCESSED_LOG,
  type CscsBatchStatus,
  type CscsStateSource,
  type CscsBatchListResponse,
} from "@/actions/cscsPipelineActions";

type BatchesQuery = Query<CscsBatchListResponse, Error, CscsBatchListResponse, readonly unknown[]>;

/* ─── Batch list / upload / process / detail ────────────────────────────── */

export const useCscsBatches = (
  params?: { status?: CscsBatchStatus; q?: string; page?: number; pageSize?: number },
  refetchInterval?:
    | number
    | false
    | ((query: BatchesQuery) => number | false | undefined),
) =>
  useQuery({
    queryKey: ["cscs-pipeline", "batches", params ?? {}],
    queryFn: () => GET_CSCS_BATCHES(params),
    refetchInterval,
  });

export const useUploadCscsBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file }: { file: File }) => UPLOAD_CSCS_BATCH(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cscs-pipeline", "batches"] }),
  });
};

export const useProcessCscsBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchRef }: { batchRef: string }) => PROCESS_CSCS_BATCH(batchRef),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cscs-pipeline", "batches"] }),
  });
};

export const useCscsBatch = (batchRef?: string, refetchInterval?: number) =>
  useQuery({
    queryKey: ["cscs-pipeline", "batch", batchRef ?? ""],
    queryFn: () => GET_CSCS_BATCH(batchRef!),
    enabled: !!batchRef,
    refetchInterval,
  });

/* ─── Step 1: registers ─────────────────────────────────────────────────── */

export const useCscsBatchRegisters = (batchRef?: string) =>
  useQuery({
    queryKey: ["cscs-pipeline", "registers", batchRef ?? ""],
    queryFn: () => GET_CSCS_BATCH_REGISTERS(batchRef!),
    enabled: !!batchRef,
  });

/* ─── Step 2: holders / states ──────────────────────────────────────────── */

export const useCscsBatchHolders = (
  batchRef?: string,
  params?: { register?: string; stateFilter?: "ALL" | "MISSING" | "CONFIRMED"; page?: number; pageSize?: number },
) =>
  useQuery({
    queryKey: ["cscs-pipeline", "holders", batchRef ?? "", params ?? {}],
    queryFn: () => GET_CSCS_BATCH_HOLDERS(batchRef!, params),
    enabled: !!batchRef,
  });

const useInvalidateHolders = () => {
  const qc = useQueryClient();
  return (batchRef: string) => {
    qc.invalidateQueries({ queryKey: ["cscs-pipeline", "holders", batchRef] });
  };
};

export const useUpdateCscsHolderState = () => {
  const invalidate = useInvalidateHolders();
  return useMutation({
    mutationFn: ({
      batchRef,
      chn,
      payload,
    }: {
      batchRef: string;
      chn: string;
      payload: { register: string; resolvedState: string; source: CscsStateSource };
    }) => UPDATE_CSCS_HOLDER_STATE(batchRef, chn, payload),
    onSuccess: (_d, v) => invalidate(v.batchRef),
  });
};

export const useAcceptCscsGisStates = () => {
  const invalidate = useInvalidateHolders();
  return useMutation({
    mutationFn: ({ batchRef }: { batchRef: string }) => ACCEPT_CSCS_GIS_STATES(batchRef),
    onSuccess: (_d, v) => invalidate(v.batchRef),
  });
};

export const useCommitCscsStates = () => {
  const invalidate = useInvalidateHolders();
  return useMutation({
    mutationFn: ({ batchRef }: { batchRef: string }) => COMMIT_CSCS_STATES(batchRef),
    onSuccess: (_d, v) => invalidate(v.batchRef),
  });
};

/* ─── Step 3: bank changes ──────────────────────────────────────────────── */

export const useCscsBankChanges = (batchRef?: string) =>
  useQuery({
    queryKey: ["cscs-pipeline", "bank-changes", batchRef ?? ""],
    queryFn: () => GET_CSCS_BANK_CHANGES(batchRef!),
    enabled: !!batchRef,
  });

/* ─── Step 4: trade balances ────────────────────────────────────────────── */

export const useCscsTradeBalances = (
  batchRef?: string,
  params?: { register?: string; status?: string },
) =>
  useQuery({
    queryKey: ["cscs-pipeline", "trade-balances", batchRef ?? "", params ?? {}],
    queryFn: () => GET_CSCS_TRADE_BALANCES(batchRef!, params),
    enabled: !!batchRef,
  });

export const useApplyCscsTradeBalances = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchRef }: { batchRef: string }) => APPLY_CSCS_TRADE_BALANCES(batchRef),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["cscs-pipeline", "trade-balances", v.batchRef] });
      qc.invalidateQueries({ queryKey: ["cscs-pipeline", "summary", v.batchRef] });
    },
  });
};

/* ─── Step 5: finalize / summary / processed log ────────────────────────── */

export const useFinalizeCscsBatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchRef }: { batchRef: string }) => FINALIZE_CSCS_BATCH(batchRef),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["cscs-pipeline", "batches"] });
      qc.invalidateQueries({ queryKey: ["cscs-pipeline", "summary", v.batchRef] });
    },
  });
};

export const useCscsBatchSummary = (batchRef?: string) =>
  useQuery({
    queryKey: ["cscs-pipeline", "summary", batchRef ?? ""],
    queryFn: () => GET_CSCS_BATCH_SUMMARY(batchRef!),
    enabled: !!batchRef,
  });

export const useCscsProcessedLog = (
  batchRef?: string,
  params?: { register?: string; type?: string; q?: string; page?: number; pageSize?: number },
) =>
  useQuery({
    queryKey: ["cscs-pipeline", "processed-log", batchRef ?? "", params ?? {}],
    queryFn: () => GET_CSCS_PROCESSED_LOG(batchRef!, params),
    enabled: !!batchRef,
  });
