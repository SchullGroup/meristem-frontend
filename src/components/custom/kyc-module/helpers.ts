import type {
  KycRequestStatus,
  KycChannel,
  ValResult,
  NibssRowValidation,
} from "@/types/kyc-module";

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

const STATUS_LABEL: Record<KycRequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  HOD_REVIEW: "HOD Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RETURNED: "Returned",
  PUSHED: "Pushed to Mandate",
};

export function requestStatusLabel(s: KycRequestStatus) {
  return STATUS_LABEL[s];
}

export function requestStatusClass(s: KycRequestStatus) {
  switch (s) {
    case "DRAFT":
      return "bg-gray-100 text-gray-600";
    case "SUBMITTED":
    case "HOD_REVIEW":
      return "bg-amber-100 text-amber-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "RETURNED":
      return "bg-orange-100 text-orange-800";
    case "PUSHED":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export const CHANNEL_SHORT: Record<KycChannel, string> = {
  STANDARD: "Standard",
  NIBSS: "NIBSS",
  CSCS: "CSCS",
  MERICONNECT: "Mericonnect",
};

export function channelBadgeClass(c: KycChannel) {
  switch (c) {
    case "STANDARD":
      return "bg-slate-100 text-slate-700";
    case "NIBSS":
      return "bg-indigo-100 text-indigo-800";
    case "CSCS":
      return "bg-teal-100 text-teal-800";
    case "MERICONNECT":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function valResultClass(v: ValResult) {
  return v === "PASS"
    ? "bg-green-100 text-green-800"
    : v === "WARN"
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-700";
}

export function valResultLabel(v: ValResult) {
  return v === "PASS" ? "Pass" : v === "WARN" ? "Warning" : "Fail";
}

export function rowValidationClass(v: NibssRowValidation) {
  return v === "VALID"
    ? "bg-green-100 text-green-800"
    : v === "WARNING"
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-700";
}

export function ageingClass(days: number) {
  return days >= 6
    ? "text-red-600 font-semibold"
    : days >= 3
      ? "text-amber-600"
      : "text-muted-foreground";
}
