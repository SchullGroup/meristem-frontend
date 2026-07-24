import type {
  MandateBatch,
  MandateBatchStatus,
  MandateRejectionStage,
  MandateSource,
} from "@/types/mandate-payment-flow";

export function formatNaira(num: number) {
  if (!num) return "₦0.00";
  if (Math.abs(num) >= 1_000_000_000)
    return `₦${(num / 1_000_000_000).toFixed(2)}B`;
  return `₦${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

// ── Status ────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MandateBatchStatus, string> = {
  QUEUED: "Queued",
  PENDING_APPROVAL: "Pending Review",
  PENDING_HOP: "Pending HOP",
  PENDING_ICU_1: "Pending ICU (1st)",
  PENDING_REREVIEW: "Returned to Initiator",
  PENDING_ICU_2: "Pending ICU (2nd)",
  PENDING_MD: "Pending MD",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  MANUAL_PROCESSING: "Manual Processing",
  REJECTED: "Rejected",
};

const REJECTION_STAGE_LABEL: Record<MandateRejectionStage, string> = {
  APPROVAL: "Initiator",
  HOP: "HOP",
  ICU_1: "ICU (1st)",
  ICU_2: "ICU (2nd)",
};

export function formatBatchStatus(
  status: MandateBatchStatus,
  rejectedAt?: MandateRejectionStage,
) {
  if (status === "REJECTED" && rejectedAt) {
    return `Rejected — ${REJECTION_STAGE_LABEL[rejectedAt]}`;
  }
  return STATUS_LABEL[status];
}

export function statusBadgeClass(status: MandateBatchStatus) {
  switch (status) {
    case "QUEUED":
      return "bg-slate-100 text-slate-700";
    case "PENDING_APPROVAL":
    case "PENDING_HOP":
    case "PENDING_ICU_1":
    case "PENDING_ICU_2":
      return "bg-amber-100 text-amber-800";
    case "PENDING_REREVIEW":
      return "bg-indigo-100 text-indigo-800";
    case "PENDING_MD":
      return "bg-blue-100 text-blue-800";
    case "MANUAL_PROCESSING":
      return "bg-purple-100 text-purple-800";
    case "PARTIALLY_PAID":
      return "bg-orange-100 text-orange-800";
    case "PAID":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

// ── Source ────────────────────────────────────────────────────────────────────

export const SOURCE_LABEL: Record<MandateSource, string> = {
  NIBSS: "NIBSS",
  CSCS: "CSCS",
  KYC: "KYC (Mary Connect)",
  MANUAL_PUSH: "Manual Push",
};

export function sourceBadgeClass(source: MandateSource) {
  switch (source) {
    case "NIBSS":
      return "bg-blue-100 text-blue-800";
    case "CSCS":
      return "bg-teal-100 text-teal-800";
    case "KYC":
      return "bg-violet-100 text-violet-800";
    case "MANUAL_PUSH":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

// ── Batch-derived metrics ─────────────────────────────────────────────────────

export function batchTotalAmount(batch: MandateBatch) {
  return batch.shareholders.reduce((s, r) => s + r.amount, 0);
}

export function batchRegisters(batch: MandateBatch) {
  return Array.from(new Set(batch.shareholders.map((s) => s.registerSymbol)));
}

export function batchDividendNumbers(batch: MandateBatch) {
  return Array.from(new Set(batch.shareholders.map((s) => s.dividendNumber)));
}

export function batchSources(batch: MandateBatch): MandateSource[] {
  return Array.from(new Set(batch.shareholders.map((s) => s.source)));
}

// A batch may span sources; show the single source or "Mixed".
export function batchSourceLabel(batch: MandateBatch) {
  const sources = batchSources(batch);
  if (sources.length === 0) return "—";
  if (sources.length === 1) return SOURCE_LABEL[sources[0]];
  return "Mixed";
}
