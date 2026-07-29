import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SEED_KYC_REQUESTS,
  SEED_NIBSS_BATCHES,
  SEED_MANDATING_QUEUE,
  SEED_SYNC_LOG,
  generateNibssRows,
  runMandateValidation,
  nextRequestId,
  nextBatchRef,
} from "@/components/custom/kyc-module/seed-data";
import type {
  KycRequest,
  KycChannel,
  KycRequestStatus,
  KycFieldChange,
  KycDoc,
  MandateValidation,
  NibssBatch,
  NibssBatchRow,
  SyncLogEntry,
} from "@/types/kyc-module";

// Mock data layer — mutates shared seed arrays in place so the pipeline
// progresses across screens as the user clicks through it.

function delay(ms = 500) {
  return new Promise((r) => setTimeout(r, ms));
}
function today() {
  return new Date().toISOString().split("T")[0];
}

const REQ = "kyc-requests";
const BATCH = "kyc-nibss-batches";
const MANDATE = "kyc-mandating-queue";

function findReq(id: string): KycRequest {
  const r = SEED_KYC_REQUESTS.find((x) => x.id === id);
  if (!r) throw new Error("Request not found");
  return r;
}
function replaceReq(next: KycRequest) {
  const i = SEED_KYC_REQUESTS.findIndex((x) => x.id === next.id);
  if (i === -1) throw new Error("Request not found");
  SEED_KYC_REQUESTS[i] = next;
  return next;
}
function findBatch(ref: string): NibssBatch {
  const b = SEED_NIBSS_BATCHES.find((x) => x.batchRef === ref);
  if (!b) throw new Error("Batch not found");
  return b;
}
function replaceBatch(next: NibssBatch) {
  const i = SEED_NIBSS_BATCHES.findIndex((x) => x.batchRef === next.batchRef);
  if (i === -1) throw new Error("Batch not found");
  SEED_NIBSS_BATCHES[i] = next;
  return next;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export interface KycRequestFilters {
  channel?: KycChannel;
  registerSymbol?: string;
  submittedBy?: string;
  status?: KycRequestStatus | KycRequestStatus[];
  field?: string;
  q?: string;
  ageingBucket?: "0-2" | "3-5" | "6+";
}

export function useKycRequests(filters?: KycRequestFilters) {
  return useQuery({
    queryKey: [REQ, filters],
    queryFn: async () => {
      await delay(250);
      let rows = [...SEED_KYC_REQUESTS];
      if (filters?.channel) rows = rows.filter((r) => r.channel === filters.channel);
      if (filters?.registerSymbol)
        rows = rows.filter((r) => r.registerSymbol === filters.registerSymbol);
      if (filters?.submittedBy) rows = rows.filter((r) => r.submittedBy === filters.submittedBy);
      if (filters?.status) {
        const s = Array.isArray(filters.status) ? filters.status : [filters.status];
        rows = rows.filter((r) => s.includes(r.status));
      }
      if (filters?.field)
        rows = rows.filter((r) => r.changes.some((c) => c.field === filters.field));
      if (filters?.ageingBucket) {
        rows = rows.filter((r) =>
          filters.ageingBucket === "0-2"
            ? r.ageingDays <= 2
            : filters.ageingBucket === "3-5"
              ? r.ageingDays >= 3 && r.ageingDays <= 5
              : r.ageingDays >= 6,
        );
      }
      if (filters?.q) {
        const q = filters.q.toLowerCase();
        rows = rows.filter((r) =>
          [r.requestId, r.holderName, r.chn, r.accountNumber, r.registerSymbol]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
      }
      return rows.sort((a, b) => (a.submittedDate < b.submittedDate ? 1 : -1));
    },
    refetchOnWindowFocus: false,
  });
}

export function useKycRequest(id?: string) {
  return useQuery({
    queryKey: [REQ, "one", id],
    queryFn: async () => {
      await delay(120);
      return SEED_KYC_REQUESTS.find((r) => r.id === id) ?? null;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
}

// ── Create requests (Standard + NIBSS single) ────────────────────────────────

export interface AccountRef {
  accountNumber: string;
  chn: string;
  holderName: string;
  registerSymbol: string;
  registerName: string;
}

export interface CreateRequestPayload extends AccountRef {
  changes: KycFieldChange[];
  documents: KycDoc[];
  submittedBy: string;
  reason?: string;
  validation?: MandateValidation;
}

function buildRequest(channel: KycChannel, p: CreateRequestPayload): KycRequest {
  const rid = nextRequestId();
  return {
    id: rid,
    requestId: rid,
    channel,
    accountNumber: p.accountNumber,
    chn: p.chn,
    holderName: p.holderName,
    registerSymbol: p.registerSymbol,
    registerName: p.registerName,
    submittedBy: p.submittedBy,
    submittedDate: today(),
    status: "SUBMITTED",
    ageingDays: 0,
    changes: p.changes,
    documents: p.documents,
    reason: p.reason,
    validation: p.validation,
    hasUnpaidDividend: Math.random() < 0.5,
  };
}

export function useCreateStandardRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateRequestPayload) => {
      await delay(700);
      const req = buildRequest("STANDARD", p);
      SEED_KYC_REQUESTS.unshift(req);
      return req;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [REQ] }),
  });
}

export function useCreateNibssSingleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: CreateRequestPayload) => {
      await delay(700);
      const req = buildRequest("NIBSS", p);
      SEED_KYC_REQUESTS.unshift(req);
      return req;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [REQ] }),
  });
}

export function useNibssNameEnquiry() {
  return useMutation({
    mutationFn: async () => {
      await delay(900);
      return runMandateValidation();
    },
  });
}

// ── HOD decisions ────────────────────────────────────────────────────────────

export interface DecisionPayload {
  id: string;
  decision: "APPROVE" | "REJECT" | "RETURN";
  actor: string;
  reason?: string;
}

export function useKycDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: DecisionPayload) => {
      await delay(600);
      const existing = findReq(p.id);
      // Maker-checker: submitter cannot approve their own request.
      if (p.decision === "APPROVE" && existing.submittedBy === p.actor) {
        throw new Error("Maker-checker: you cannot approve your own submission.");
      }
      const status: KycRequestStatus =
        p.decision === "APPROVE" ? "APPROVED" : p.decision === "REJECT" ? "REJECTED" : "RETURNED";
      return replaceReq({
        ...existing,
        status,
        rejectionReason: p.decision !== "APPROVE" ? p.reason : undefined,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [REQ] }),
  });
}

export function useBulkApproveRequests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, actor }: { ids: string[]; actor: string }) => {
      await delay(900);
      let approved = 0;
      let skipped = 0;
      ids.forEach((id) => {
        const r = SEED_KYC_REQUESTS.find((x) => x.id === id);
        if (!r) return;
        if (r.submittedBy === actor) {
          skipped += 1; // maker-checker skip
          return;
        }
        replaceReq({ ...r, status: "APPROVED" });
        approved += 1;
      });
      return { approved, skipped };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [REQ] }),
  });
}

// ── Push to Dividend Mandate ─────────────────────────────────────────────────

export function usePushToDividendMandate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, actor }: { ids: string[]; actor: string }) => {
      await delay(1000);
      ids.forEach((id) => {
        const r = SEED_KYC_REQUESTS.find((x) => x.id === id);
        if (!r || r.status !== "APPROVED") return;
        replaceReq({ ...r, status: "PUSHED" });
        SEED_MANDATING_QUEUE.push({
          id: `MQ-${Date.now()}-${r.id}`,
          accountNumber: r.accountNumber,
          holderName: r.holderName,
          registerSymbol: r.registerSymbol,
          newBank: r.changes.find((c) => c.field === "bankName")?.newValue ?? "—",
          newAccountNo: r.changes.find((c) => c.field === "nuban")?.newValue ?? "—",
          source: "KYC Module",
          status: "Mandated (Verified)",
          pushedBy: actor,
          pushedDate: today(),
        });
      });
      return { pushed: ids.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [REQ] });
      qc.invalidateQueries({ queryKey: [MANDATE] });
    },
  });
}

// ── NIBSS bulk batch ─────────────────────────────────────────────────────────

export function useNibssBatch(ref?: string) {
  return useQuery({
    queryKey: [BATCH, "one", ref],
    queryFn: async () => {
      await delay(150);
      return SEED_NIBSS_BATCHES.find((b) => b.batchRef === ref) ?? null;
    },
    enabled: !!ref,
    refetchOnWindowFocus: false,
  });
}

export function useCreateNibssBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      registerSymbol,
      uploadedBy,
      count,
    }: {
      registerSymbol: string;
      uploadedBy: string;
      count?: number;
    }) => {
      await delay(1200);
      const batch: NibssBatch = {
        batchRef: nextBatchRef(),
        uploadedBy,
        uploadedDate: today(),
        status: "DRAFT",
        registerSymbol,
        rows: generateNibssRows(count ?? 24),
      };
      SEED_NIBSS_BATCHES.push(batch);
      return batch;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCH] }),
  });
}

function recomputeRow(row: NibssBatchRow): NibssBatchRow {
  const status: NibssBatchRow["rowStatus"] =
    row.rowStatus === "REMOVED"
      ? "REMOVED"
      : row.validationStatus === "FAILED"
        ? "NEEDS_FIX"
        : "VALID";
  return { ...row, rowStatus: status };
}

export function useUpdateNibssRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ref,
      rowNo,
      patch,
    }: {
      ref: string;
      rowNo: number;
      patch: Partial<NibssBatchRow>;
    }) => {
      await delay(300);
      const b = findBatch(ref);
      const rows = b.rows.map((r) => (r.rowNo === rowNo ? recomputeRow({ ...r, ...patch }) : r));
      return replaceBatch({ ...b, rows });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCH] }),
  });
}

export function useAttachDocsToRows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ref,
      rowNos,
      doc,
    }: {
      ref: string;
      rowNos: number[];
      doc: KycDoc;
    }) => {
      await delay(500);
      const b = findBatch(ref);
      const set = new Set(rowNos);
      const rows = b.rows.map((r) =>
        set.has(r.rowNo)
          ? recomputeRow({ ...r, documentAttached: true, documents: [...r.documents, doc] })
          : r,
      );
      return replaceBatch({ ...b, rows });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCH] }),
  });
}

// Bulk-attach by filename: filenames matched to a row's CHN or account number.
export function useAttachByFilename() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ref, filenames }: { ref: string; filenames: string[] }) => {
      await delay(800);
      const b = findBatch(ref);
      const matched: string[] = [];
      const rows = b.rows.map((r) => {
        const hit = filenames.find(
          (f) => f.includes(r.chn) || f.includes(r.accountNumber.replace("ACC-", "")),
        );
        if (!hit) return r;
        matched.push(hit);
        return recomputeRow({
          ...r,
          documentAttached: true,
          documents: [...r.documents, { name: hit, url: "#", type: "application/pdf" }],
        });
      });
      replaceBatch({ ...b, rows });
      const unmatched = filenames.filter((f) => !matched.includes(f));
      return { matched: matched.length, unmatched };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCH] }),
  });
}

export function useRevalidateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ref }: { ref: string }) => {
      await delay(1000);
      const b = findBatch(ref);
      const rows = b.rows.map((r) => {
        if (r.rowStatus === "REMOVED") return r;
        const v = runMandateValidation();
        const overallFail = v.nuban === "FAIL" || v.nameEnquiry === "FAIL" || v.bvnMatch === "FAIL";
        const overallWarn = v.nuban === "WARN" || v.nameEnquiry === "WARN" || v.bvnMatch === "WARN";
        const validationStatus = overallFail ? "FAILED" : overallWarn ? "WARNING" : "VALID";
        return recomputeRow({
          ...r,
          validationStatus,
          nameEnquiryResult: v.nameEnquiryResult ?? "—",
        });
      });
      return replaceBatch({ ...b, rows });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCH] }),
  });
}

export function useRemoveNibssRows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ref, rowNos }: { ref: string; rowNos: number[] }) => {
      await delay(300);
      const b = findBatch(ref);
      const set = new Set(rowNos);
      const rows = b.rows.map((r) =>
        set.has(r.rowNo) ? { ...r, rowStatus: "REMOVED" as const } : r,
      );
      return replaceBatch({ ...b, rows });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BATCH] }),
  });
}

export function useSubmitNibssBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ref, submittedBy }: { ref: string; submittedBy: string }) => {
      await delay(900);
      const b = findBatch(ref);
      const active = b.rows.filter((r) => r.rowStatus !== "REMOVED");
      const blocking = active.filter(
        (r) => r.validationStatus === "FAILED" || !r.documentAttached,
      );
      if (blocking.length > 0) {
        throw new Error(
          `${blocking.length} row(s) are not valid-with-document. Fix or remove them before submitting.`,
        );
      }
      replaceBatch({ ...b, status: "SUBMITTED" });
      // Represent the batch as one request in the unified HOD queue.
      const rid = nextRequestId();
      SEED_KYC_REQUESTS.unshift({
        id: rid,
        requestId: rid,
        channel: "NIBSS",
        accountNumber: `${active.length} accounts`,
        chn: "—",
        holderName: `NIBSS Bulk Batch (${active.length})`,
        registerSymbol: b.registerSymbol,
        registerName: b.registerSymbol,
        submittedBy,
        submittedDate: today(),
        status: "SUBMITTED",
        ageingDays: 0,
        changes: [],
        documents: [],
        reason: "Bulk bank mandate update",
        batchRef: b.batchRef,
        hasUnpaidDividend: true,
      });
      return b;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BATCH] });
      qc.invalidateQueries({ queryKey: [REQ] });
    },
  });
}

export function useMandatingQueue() {
  return useQuery({
    queryKey: [MANDATE],
    queryFn: async () => {
      await delay(150);
      return [...SEED_MANDATING_QUEUE];
    },
    refetchOnWindowFocus: false,
  });
}

// ── CSCS / Mericonnect inbox (officer review before submit) ──────────────────

const SYNC = "kyc-sync-log";

export interface SubmitInboxPayload {
  id: string;
  submittedBy: string;
  acceptedFields: string[];
  documents: KycDoc[];
}

export function useSubmitInboxRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: SubmitInboxPayload) => {
      await delay(600);
      const existing = findReq(p.id);
      const accepted = new Set(p.acceptedFields);
      const changes = existing.changes
        .filter((c) => accepted.has(c.field))
        .map((c) => ({ ...c, accepted: true }));
      if (changes.length === 0) {
        throw new Error("Accept at least one changed field before submitting.");
      }
      return replaceReq({
        ...existing,
        status: "SUBMITTED",
        submittedBy: p.submittedBy,
        submittedDate: today(),
        ageingDays: 0,
        changes,
        documents: p.documents.length ? p.documents : existing.documents,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [REQ] }),
  });
}

export function useRejectInboxRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await delay(500);
      const existing = findReq(id);
      return replaceReq({ ...existing, status: "REJECTED", rejectionReason: reason });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [REQ] }),
  });
}

export function useRequestAdditionalDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await delay(500);
      const existing = findReq(id);
      return replaceReq({ ...existing, docsRequested: true, rejectionReason: note });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [REQ] }),
  });
}

export function useSyncLog() {
  return useQuery({
    queryKey: [SYNC],
    queryFn: async () => {
      await delay(150);
      return [...SEED_SYNC_LOG].sort((a, b) => (a.ranAt < b.ranAt ? 1 : -1));
    },
    refetchOnWindowFocus: false,
  });
}

export function useMericonnectSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ranBy }: { ranBy: string }) => {
      await delay(1200);
      const entry: SyncLogEntry = {
        id: `SYNC-${Date.now()}`,
        ranAt: new Date().toISOString(),
        recordsPulled: Math.floor(Math.random() * 8),
        errors: Math.random() < 0.3 ? 1 : 0,
        ranBy,
      };
      SEED_SYNC_LOG.unshift(entry);
      return entry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [SYNC] }),
  });
}
