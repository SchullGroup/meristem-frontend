import { downloadCsvData } from "@/lib/utils/csv-template";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import { REVERSAL_TYPE_SHORT } from "./helpers";

export function downloadReversalsCsv(
  rows: ReversalRequest[],
  fileName: string,
  includeDecision = false,
) {
  const headers = [
    "Request Ref",
    "Holder Name",
    "Register",
    "Account Number",
    "Dividend Number",
    "Reversal Type",
    "Amount (NGN)",
    "Requested By",
    "Date Requested",
    "Status",
    ...(includeDecision
      ? ["Decided By", "Decision Date", "Decision Comment"]
      : []),
  ];
  downloadCsvData(
    headers,
    rows.map((r) => [
      r.id,
      r.holderName,
      r.registerSymbol,
      r.accountNumber,
      r.dividendNumber,
      REVERSAL_TYPE_SHORT[r.reversalType],
      r.amount.toFixed(2),
      r.requestedBy,
      r.dateRequested,
      r.status,
      ...(includeDecision
        ? [r.decidedBy ?? "-", r.decisionDate ?? "-", r.decisionComment ?? "-"]
        : []),
    ]),
    fileName,
  );
}
