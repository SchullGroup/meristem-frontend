"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  DollarSign,
  MessageSquareWarning,
  FileInput,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadStagingCard, UploadResult } from "@/components/custom/offer-administration/upload-staging-card";
import { toast } from "sonner";

type TxType = "acceptance" | "renunciation";
type ReviewStatus = "PENDING" | "VERIFIED" | "QUERIED";

interface ForwardedRecord {
  id: string;
  txType: TxType;
  holderName: string;
  chn: string;
  cscsNumber: string;
  registrarAccountNo: string;
  agentName: string;
  agentType: string;
  units: number;
  amountPaid: number;
  bankName: string;
  accountNumber: string;
  bvn: string;
  tin: string;
  submittedAt: string;
  reviewStatus: ReviewStatus;
}

interface BankReconciliation {
  bankName: string;
  expectedAmount: number;
  receivedAmount: number;
  variance: number;
}

// Mirrors SEED_SUBMISSIONS from rights-trading.tsx — records forwarded via "Forward to Returns Capture"
const FORWARDED_SEED: ForwardedRecord[] = [
  {
    id: "s1",
    txType: "acceptance",
    holderName: "NGOZI CHIDINMA OKAFOR",
    chn: "C0023456BK",
    cscsNumber: "CSCS-000234561",
    registrarAccountNo: "REG-00123456",
    agentName: "Meristem Stockbrokers Ltd",
    agentType: "Stockbroker",
    units: 5000,
    amountPaid: 92500,
    bankName: "First Bank of Nigeria",
    accountNumber: "3012345678",
    bvn: "22098765432",
    tin: "1234567890",
    submittedAt: "07 Jul 2026",
    reviewStatus: "PENDING",
  },
  {
    id: "s2",
    txType: "renunciation",
    holderName: "FATIMA ABUBAKAR MUSA",
    chn: "C0045678DK",
    cscsNumber: "CSCS-000456782",
    registrarAccountNo: "REG-00456789",
    agentName: "Access Bank PLC",
    agentType: "Bank",
    units: 8000,
    amountPaid: 74000,
    bankName: "Access Bank PLC",
    accountNumber: "0123456789",
    bvn: "22012345678",
    tin: "0987654321",
    submittedAt: "08 Jul 2026",
    reviewStatus: "PENDING",
  },
  {
    id: "s3",
    txType: "acceptance",
    holderName: "AMAKA NGOZI OKONKWO",
    chn: "C0067890FK",
    cscsNumber: "CSCS-000678903",
    registrarAccountNo: "REG-00678901",
    agentName: "Coronation Registrars",
    agentType: "Collecting Agent",
    units: 12000,
    amountPaid: 222000,
    bankName: "Zenith Bank PLC",
    accountNumber: "2012345678",
    bvn: "22056789012",
    tin: "5678901234",
    submittedAt: "09 Jul 2026",
    reviewStatus: "PENDING",
  },
];

const BANK_RECONCILIATIONS: BankReconciliation[] = [
  { bankName: "First Bank of Nigeria", expectedAmount: 92500, receivedAmount: 92500, variance: 0 },
  { bankName: "Access Bank PLC", expectedAmount: 74000, receivedAmount: 74000, variance: 0 },
  { bankName: "Zenith Bank PLC", expectedAmount: 222000, receivedAmount: 220000, variance: -2000 },
];

const REVIEW_BADGE: Record<ReviewStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-0",
  VERIFIED: "bg-green-100 text-green-800 border-0",
  QUERIED: "bg-red-100 text-red-800 border-0",
};

const REVIEW_LABEL: Record<ReviewStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  QUERIED: "Queried",
};

export function ReturnsCapture() {
  const [records, setRecords] = useState<ForwardedRecord[]>(FORWARDED_SEED);
  const [processed, setProcessed] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconciled, setReconciled] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const setReviewStatus = (id: string, status: ReviewStatus) =>
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reviewStatus: status } : r)),
    );

  const verifyAll = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, reviewStatus: "VERIFIED" })));
    toast.success("All submissions marked as verified.");
  };

  const handleBulkUpload = async (_file: File): Promise<UploadResult> => {
    toast.success("Additional records imported from bulk file.");
    return { totalRows: 8 };
  };

  const handleProcess = () => {
    const unverified = records.filter((r) => r.reviewStatus === "PENDING").length;
    if (unverified > 0) {
      toast.warning(`${unverified} record${unverified > 1 ? "s" : ""} still pending review. Verify or query them before processing.`);
      return;
    }
    const queried = records.filter((r) => r.reviewStatus === "QUERIED").length;
    if (queried > 0) {
      toast.warning(`${queried} queried record${queried > 1 ? "s" : ""} will be excluded from processing.`);
    }
    setProcessed(true);
    toast.success("Returns processed and categorised.");
  };

  const handleReconcile = async () => {
    setReconciling(true);
    await new Promise((r) => setTimeout(r, 1200));
    setReconciling(false);
    setReconciled(true);
    toast.success("Fund matching complete. 1 variance flagged for review.");
  };

  const pending = records.filter((r) => r.reviewStatus === "PENDING").length;
  const verified = records.filter((r) => r.reviewStatus === "VERIFIED").length;
  const queried = records.filter((r) => r.reviewStatus === "QUERIED").length;

  const verifiedRecords = records.filter((r) => r.reviewStatus === "VERIFIED");
  const acceptanceVerified = verifiedRecords.filter((r) => r.txType === "acceptance");
  const renunciationVerified = verifiedRecords.filter((r) => r.txType === "renunciation");
  const totalAmountVerified = verifiedRecords.reduce((s, r) => s + r.amountPaid, 0);

  const totalFundsExpected = BANK_RECONCILIATIONS.reduce((s, b) => s + b.expectedAmount, 0);
  const totalFundsReceived = BANK_RECONCILIATIONS.reduce((s, b) => s + b.receivedAmount, 0);
  const netVariance = totalFundsReceived - totalFundsExpected;
  const varianceCount = BANK_RECONCILIATIONS.filter((b) => b.variance !== 0).length;

  return (
    <div className="space-y-5">
      {/* ── Forwarded submissions ────────────────────────────────────── */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileInput className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Forwarded from Rights Trading / Renunciation
            </p>
            {pending > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">
                {pending} Pending Review
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pending > 0 && (
              <Button size="sm" variant="outline" onClick={verifyAll}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Verify All
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkUpload((v) => !v)}
            >
              Add via Bulk Upload
            </Button>
          </div>
        </div>

        {showBulkUpload && (
          <div className="px-4 py-4 border-b border-border">
            <UploadStagingCard
              label="Upload Additional Returns"
              description="Upload a CSV file of additional agent-submitted returns to append to this batch."
              accept=".csv,.xlsx"
              onUpload={handleBulkUpload}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">HOLDER</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN / CSCS</th>
                <th className="text-left px-4 py-2.5 font-medium">AGENT</th>
                <th className="text-left px-4 py-2.5 font-medium">TYPE</th>
                <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT (₦)</th>
                <th className="text-left px-4 py-2.5 font-medium">BANK / ACCT</th>
                <th className="text-left px-4 py-2.5 font-medium">BVN / TIN</th>
                <th className="text-left px-4 py-2.5 font-medium">DATE</th>
                <th className="text-center px-4 py-2.5 font-medium">STATUS</th>
                <th className="text-right px-4 py-2.5 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-sm">{r.holderName}</p>
                    <p className="text-xs text-muted-foreground">
                      Reg: {r.registrarAccountNo}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-mono text-xs">{r.chn}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.cscsNumber}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-sm">{r.agentName}</p>
                    <p className="text-xs text-muted-foreground">{r.agentType}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      className={`border-0 text-[11px] ${
                        r.txType === "acceptance"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.txType === "acceptance" ? "Acceptance" : "Renunciation"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {r.units.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">
                    {r.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-sm">{r.bankName}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.accountNumber}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-mono text-xs">{r.bvn}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.tin}</p>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                    {r.submittedAt}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className={`${REVIEW_BADGE[r.reviewStatus]} text-[11px]`}>
                      {REVIEW_LABEL[r.reviewStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.reviewStatus === "PENDING" && (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => setReviewStatus(r.id, "VERIFIED")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => setReviewStatus(r.id, "QUERIED")}
                        >
                          <MessageSquareWarning className="h-3.5 w-3.5" />
                          Query
                        </Button>
                      </div>
                    )}
                    {r.reviewStatus === "VERIFIED" && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setReviewStatus(r.id, "PENDING")}
                      >
                        Undo
                      </button>
                    )}
                    {r.reviewStatus === "QUERIED" && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setReviewStatus(r.id, "PENDING")}
                      >
                        Undo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Review summary + process button */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-3 bg-muted/20">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Verified:</span>
              <span className="font-semibold">{verified}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Pending:</span>
              <span className="font-semibold">{pending}</span>
            </span>
            {queried > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Queried:</span>
                <span className="font-semibold">{queried}</span>
              </span>
            )}
          </div>
          {!processed && (
            <Button size="sm" onClick={handleProcess} disabled={records.length === 0}>
              Process Verified Records →
            </Button>
          )}
          {processed && (
            <Badge className="bg-green-100 text-green-800 border-0">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Processed
            </Badge>
          )}
        </div>
      </Card>

      {/* ── Categorised summary (after processing) ───────────────────── */}
      {processed && (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Returns Summary
            </p>
            <div className="grid grid-cols-3 gap-4">
              {/* Total verified */}
              <Card className="mrpsl-card p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">All Verified</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Total submissions accepted for processing.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Records</p>
                    <p className="font-mono font-semibold mt-0.5">{verifiedRecords.length}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Total Units</p>
                    <p className="font-mono font-semibold mt-0.5">
                      {verifiedRecords.reduce((s, r) => s + r.units, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-mono font-bold">₦{totalAmountVerified.toLocaleString()}</span>
                </div>
              </Card>

              {/* Full Acceptance */}
              <Card className="mrpsl-card p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Full Acceptance / Additional</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shareholders exercising and applying for additional shares.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Records</p>
                    <p className="font-mono font-semibold mt-0.5">{acceptanceVerified.length}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Total Units</p>
                    <p className="font-mono font-semibold mt-0.5">
                      {acceptanceVerified.reduce((s, r) => s + r.units, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-mono font-bold">
                    ₦{acceptanceVerified.reduce((s, r) => s + r.amountPaid, 0).toLocaleString()}
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-0">Subject to Banding</Badge>
              </Card>

              {/* Renunciation */}
              <Card className="mrpsl-card p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Renunciation</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shareholders partially or fully renouncing their rights entitlement.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Records</p>
                    <p className="font-mono font-semibold mt-0.5">{renunciationVerified.length}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-muted-foreground">Units Accepted</p>
                    <p className="font-mono font-semibold mt-0.5">
                      {renunciationVerified.reduce((s, r) => s + r.units, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">Amount Payable</span>
                  <span className="font-mono font-bold">
                    ₦{renunciationVerified.reduce((s, r) => s + r.amountPaid, 0).toLocaleString()}
                  </span>
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-0">Partial Exercise</Badge>
              </Card>
            </div>
          </div>

          {/* ── Bank Fund Matching ─────────────────────────────────────── */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Fund Matching & Bank Reconciliation
                </p>
              </div>
              <div className="flex items-center gap-2">
                {reconciled && (
                  varianceCount > 0 ? (
                    <Badge className="bg-amber-100 text-amber-800 border-0">
                      {varianceCount} variance{varianceCount > 1 ? "s" : ""} flagged
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 border-0">
                      Fully reconciled
                    </Badge>
                  )
                )}
                <Button
                  size="sm"
                  variant={reconciled ? "outline" : "default"}
                  disabled={reconciling || reconciled}
                  onClick={handleReconcile}
                >
                  {reconciling ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-1.5" />
                      Reconciling…
                    </>
                  ) : reconciled ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Reconciled
                    </>
                  ) : (
                    "Run Fund Matching"
                  )}
                </Button>
              </div>
            </div>

            {!reconciled && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Run fund matching to reconcile received bank credits against expected subscription amounts.
              </div>
            )}

            {reconciled && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="mrpsl-table-header">
                        <th className="text-left px-4 py-2.5 font-medium">Receiving Bank</th>
                        <th className="text-right px-4 py-2.5 font-medium">Expected (₦)</th>
                        <th className="text-right px-4 py-2.5 font-medium">Received (₦)</th>
                        <th className="text-right px-4 py-2.5 font-medium">Variance (₦)</th>
                        <th className="text-center px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BANK_RECONCILIATIONS.map((b) => (
                        <tr key={b.bankName} className="mrpsl-table-row">
                          <td className="px-4 py-2.5 font-medium">{b.bankName}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            ₦{b.expectedAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            ₦{b.receivedAmount.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-mono font-semibold tabular-nums ${
                              b.variance === 0
                                ? "text-muted-foreground"
                                : b.variance > 0
                                ? "text-amber-700"
                                : "text-destructive"
                            }`}
                          >
                            {b.variance === 0
                              ? "—"
                              : `${b.variance > 0 ? "+" : ""}₦${Math.abs(b.variance).toLocaleString()}`}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {b.variance === 0 ? (
                              <Badge className="bg-green-100 text-green-800 border-0">Matched</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-0">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Review
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-muted/20">
                      <tr>
                        <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground">
                          TOTAL
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                          ₦{totalFundsExpected.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                          ₦{totalFundsReceived.toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-mono font-bold tabular-nums ${
                            netVariance === 0
                              ? "text-muted-foreground"
                              : netVariance > 0
                              ? "text-amber-700"
                              : "text-destructive"
                          }`}
                        >
                          {netVariance === 0
                            ? "—"
                            : `${netVariance > 0 ? "+" : ""}₦${Math.abs(netVariance).toLocaleString()}`}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Export coming soon.")}
                  >
                    Export Reconciliation Report
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      toast.success(
                        "Returns data forwarded to Allotment Rules Engine. Proceed to Tab 4 to configure banding.",
                      )
                    }
                  >
                    Forward to Allotment Engine
                  </Button>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
