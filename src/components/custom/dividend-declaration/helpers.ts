import type {
  DividendFlowStatus,
  RejectionStage,
  ShareholderCategory,
} from "@/types/dividend-declaration-flow";

export function formatNaira(num: number) {
  if (!num) return "₦0.00";
  if (Math.abs(num) >= 1_000_000_000)
    return `₦${(num / 1_000_000_000).toFixed(2)}B`;
  return `₦${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getTierBadge(tier: number) {
  switch (tier) {
    case 1:
      return "bg-green-100 text-green-800 border-0";
    case 2:
      return "bg-blue-100 text-blue-800 border-0";
    case 3:
      return "bg-amber-100 text-amber-800 border-0";
    default:
      return "bg-red-100 text-red-800 border-0";
  }
}

const STATUS_LABEL: Record<DividendFlowStatus, string> = {
  DRAFT: "Draft",
  PRELIST_GENERATED: "Prelist Ready",
  PENDING_ICU_1: "Pending ICU (1st)",
  PENDING_HOP: "Pending HOP",
  PENDING_ICU_2: "Pending ICU (2nd)",
  PENDING_MD: "Pending MD",
  MANUAL_PROCESSING: "Manual Processing",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  REJECTED: "Rejected",
};

const REJECTION_STAGE_LABEL: Record<RejectionStage, string> = {
  ICU_1: "ICU 1st Approval",
  HOP: "HOP Approval",
  ICU_2: "ICU 2nd Approval",
};

export function formatFlowStatus(
  status: DividendFlowStatus,
  rejectedAt?: RejectionStage,
) {
  if (status === "REJECTED" && rejectedAt) {
    return `Rejected — ${REJECTION_STAGE_LABEL[rejectedAt]}`;
  }
  return STATUS_LABEL[status];
}

export function statusBadgeClass(status: DividendFlowStatus) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-600";
    case "PRELIST_GENERATED":
      return "bg-slate-100 text-slate-700";
    case "PENDING_ICU_1":
    case "PENDING_HOP":
    case "PENDING_ICU_2":
      return "bg-amber-100 text-amber-800";
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

export function categoryBadgeClass(category: ShareholderCategory) {
  return category === "MANDATED"
    ? "bg-green-100 text-green-800"
    : "bg-amber-100 text-amber-800";
}

export function categoryLabel(category: ShareholderCategory) {
  return category === "MANDATED" ? "Mandated" : "Others";
}
