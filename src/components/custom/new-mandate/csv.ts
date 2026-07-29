import { downloadCsvData } from "@/lib/utils/csv-template";
import type { MandateBatch, MandateShareholder } from "@/types/mandate-payment-flow";
import {
  batchRegisters,
  batchSourceLabel,
  batchTotalAmount,
  formatBatchStatus,
} from "./helpers";

// Download the batch list shown on a stage tab (§9 — every table is exportable).
export function downloadBatchListCsv(batches: MandateBatch[], fileName: string) {
  downloadCsvData(
    [
      "Date",
      "Batch Ref",
      "Shareholders",
      "Total Amount (NGN)",
      "Status",
      "Initiated By",
      "Source",
      "Registers",
    ],
    batches.map((b) => [
      b.createdAt,
      b.batchRef,
      String(b.shareholders.length),
      batchTotalAmount(b).toFixed(2),
      formatBatchStatus(b.status, b.rejectedAt),
      b.initiatedBy,
      batchSourceLabel(b),
      String(batchRegisters(b).length),
    ]),
    fileName,
  );
}

// Download the shareholder detail table inside a batch (§8 columns).
export function downloadShareholdersCsv(
  shareholders: MandateShareholder[],
  fileName: string,
) {
  downloadCsvData(
    [
      "Name",
      "Register",
      "New Account Number",
      "Bank",
      "BVN",
      "Address",
      "Dividend Number",
      "Amount (NGN)",
      "Source",
    ],
    shareholders.map((s) => [
      s.name,
      s.registerSymbol,
      s.newAccountNumber,
      s.bank,
      s.bvn,
      s.address,
      s.dividendNumber,
      s.amount.toFixed(2),
      s.source,
    ]),
    fileName,
  );
}
