// Domain types for the Dividend Reversals flow — single-record (no batching)
// reversal requests requiring HOP approval. See the reversal spec (§4–§6).

// Type A — reverse a dividend already marked Paid that failed/was returned.
// Type B — exclude a mandated-but-unprocessed dividend from processing.
export type ReversalType = "TYPE_A" | "TYPE_B";

export type ReversalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ReversalDecision = "APPROVED" | "REJECTED";

export interface ReversalRequest {
  id: string; // e.g. REV-2026/0007
  holderName: string;
  registerSymbol: string;
  accountNumber: string;
  dividendNumber: string;
  amount: number;
  reversalType: ReversalType;
  reason: string;
  supportingDocName?: string;
  requestedBy: string;
  dateRequested: string;
  status: ReversalStatus;
  // Decision fields — populated once HOP acts (record then lives in History).
  decidedBy?: string;
  decisionDate?: string;
  decisionComment?: string;
  // Trace back to the originating dividend record in the Enquiry module (§7.5).
  sourceHolderId?: string;
  sourceAccountNumber?: string;
}
