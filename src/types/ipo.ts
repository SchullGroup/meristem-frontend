export type IPOBatchType = "APPROVED" | "DISAPPROVED" | "INVALID";

export interface IPO {
  batchReference: string;
  register: string;
  batchDate: string;
  approvedCount: number;
  disapprovedCount: number;
  invalidCount: number;
  totalAmount: number;
  status: string;
  opsApprovedBy: string;
  opsApprovedAt: string;
}

export interface PendingApprovalParams {
  register?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface IPOSubscriber {
  subscriberName: string;
  accountNumber: string;
  chn: string;
  units: number;
  amount: number;
  bank?: string;
  broker?: string;
  remark?: string;
}
