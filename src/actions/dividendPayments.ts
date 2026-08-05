// The in-app dividend payment-run / repush / mandate-queue flow was retired; its request
// functions and the payment-run/repush DTOs had no remaining callers and were removed.
// Only these two types survive because they are shared across the app (Approval is referenced
// widely; DividendDeclaration is used by the store and the declarations enquiry).

export interface Approval {
  role: string;
  approverName: string;
  approverId: string;
  decision: string; // e.g., 'APPROVED' | 'REJECTED' if you want to use strict literal types
  comment: string;
  decidedAt: string; // ISO Date-time string
}

export interface DividendDeclaration {
  id: number;
  registerId: string;
  registerName: string;
  registerSymbol: string;
  paymentNumber: string;
  dividendType: string;
  rate: number;
  currency: string;
  qualificationDate: string; // ISO Date string (YYYY-MM-DD)
  closureDate?: string;      // nullable post-mrpsl2 migration
  paymentDate: string;       // ISO Date string (YYYY-MM-DD)
  grossLiability: number;
  whtAmount: number;
  netLiability: number;
  tier: number;
  status: string;
  initiatorId: string;
  initiatorName: string;
  narrative: string;
  approvals: Approval[];
  createdAt: string; // ISO Date-time string
}
