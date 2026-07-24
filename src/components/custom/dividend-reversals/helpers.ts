import type {
  ReversalStatus,
  ReversalType,
} from "@/types/dividend-reversal-flow";

export function formatNaira(num: number) {
  if (!num) return "₦0.00";
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

export const REVERSAL_TYPE_LABEL: Record<ReversalType, string> = {
  TYPE_A: "Type A — Reverse Paid Dividend",
  TYPE_B: "Type B — Reverse / Exclude Mandate",
};

export const REVERSAL_TYPE_SHORT: Record<ReversalType, string> = {
  TYPE_A: "Type A",
  TYPE_B: "Type B",
};

export function reversalTypeBadgeClass(type: ReversalType) {
  return type === "TYPE_A"
    ? "bg-blue-100 text-blue-800"
    : "bg-purple-100 text-purple-800";
}

export const REVERSAL_STATUS_LABEL: Record<ReversalStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function reversalStatusBadgeClass(status: ReversalStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
