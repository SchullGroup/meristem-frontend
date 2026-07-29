/**
 * Agent commission payment flow.
 *
 * A commission must clear two independent approvals before it can be paid:
 *   PENDING_OPS_REVIEW → PENDING_ICU_REVIEW → APPROVED_FOR_PAYMENT → PAID
 *
 * Either stage can reject, which parks the record until it is resubmitted.
 * Stage naming follows the sibling IPO refund flow (see refund-approval-dialog).
 */
export type CommissionStatus =
  | "PENDING_OPS_REVIEW"
  | "PENDING_ICU_REVIEW"
  | "APPROVED_FOR_PAYMENT"
  | "OPS_REJECTED"
  | "ICU_REJECTED"
  | "PAID";

export type CommissionStage = "OPS" | "ICU" | "PAYMENT";

export interface CommissionApprovalEntry {
  stage: CommissionStage;
  actor: string;
  action: "APPROVED" | "REJECTED" | "MARKED_PAID" | "RESUBMITTED";
  remark?: string;
  /** ISO timestamp. */
  date: string;
}

export interface AgentCommissionRecord {
  id: string;
  agentName: string;
  agentType: string;
  totalApplications: number;
  totalValueSubmitted: number;
  totalValueRefunded: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
  approvalTrail: CommissionApprovalEntry[];
}

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  PENDING_OPS_REVIEW: "Pending First Approval",
  PENDING_ICU_REVIEW: "Pending ICU Approval",
  APPROVED_FOR_PAYMENT: "Approved for Payment",
  OPS_REJECTED: "Rejected — First Approval",
  ICU_REJECTED: "Rejected — ICU",
  PAID: "Paid",
};

export const COMMISSION_STATUS_STYLES: Record<CommissionStatus, string> = {
  PENDING_OPS_REVIEW: "bg-amber-100 text-amber-800 border-0 text-[11px]",
  PENDING_ICU_REVIEW: "bg-blue-100 text-blue-800 border-0 text-[11px]",
  APPROVED_FOR_PAYMENT: "bg-violet-100 text-violet-800 border-0 text-[11px]",
  OPS_REJECTED: "bg-red-100 text-red-800 border-0 text-[11px]",
  ICU_REJECTED: "bg-red-100 text-red-800 border-0 text-[11px]",
  PAID: "bg-green-100 text-green-800 border-0 text-[11px]",
};
