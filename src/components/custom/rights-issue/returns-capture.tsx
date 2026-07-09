"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, DollarSign, TrendingUp, ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadStagingCard, UploadResult } from "@/components/custom/offer-administration/upload-staging-card";
import { toast } from "sonner";

interface ReturnBucket {
  key: "accepted" | "additional" | "traded";
  label: string;
  description: string;
  count: number;
  totalUnits: number;
  totalAmount: number;
  icon: ReactNode;
  color: string;
  badgeStyle: string;
}

interface BankReconciliation {
  bankName: string;
  expectedAmount: number;
  receivedAmount: number;
  variance: number;
}

const PRICE_PER_SHARE = 9.25;

const BANK_RECONCILIATIONS: BankReconciliation[] = [
  { bankName: "Access Bank PLC", expectedAmount: 412_500_000, receivedAmount: 412_500_000, variance: 0 },
  { bankName: "Fidelity Bank PLC", expectedAmount: 187_250_000, receivedAmount: 187_250_000, variance: 0 },
  { bankName: "Guaranty Trust Bank", expectedAmount: 320_000_000, receivedAmount: 319_875_000, variance: -125_000 },
  { bankName: "Zenith Bank PLC", expectedAmount: 534_000_000, receivedAmount: 534_000_000, variance: 0 },
  { bankName: "United Bank for Africa", expectedAmount: 98_750_000, receivedAmount: 99_000_000, variance: 250_000 },
];

export function ReturnsCapture() {
  const [uploaded, setUploaded] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconciled, setReconciled] = useState(false);

  const handleUpload = async (_file: File): Promise<UploadResult> => {
    const result: UploadResult = { totalRows: 78956 };
    setUploaded(true);
    toast.success("Returns file processed — 78,956 subscription records categorised into 3 buckets.");
    return result;
  };

  const handleReconcile = async () => {
    setReconciling(true);
    await new Promise((r) => setTimeout(r, 1200));
    setReconciling(false);
    setReconciled(true);
    toast.success("Fund matching complete. 1 variance flagged for review.");
  };

  const buckets: ReturnBucket[] = [
    {
      key: "accepted",
      label: "Accepted Rights",
      description: "Shareholders who exercised their full provisional entitlement exactly (guaranteed allocation).",
      count: 52_430,
      totalUnits: 524_300_000,
      totalAmount: 524_300_000 * PRICE_PER_SHARE,
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      color: "bg-green-100",
      badgeStyle: "bg-green-100 text-green-800 border-0",
    },
    {
      key: "additional",
      label: "Additional Shares Applied",
      description: "Shareholders who applied for shares beyond their provisional entitlement (subject to banding).",
      count: 18_970,
      totalUnits: 189_700_000,
      totalAmount: 189_700_000 * PRICE_PER_SHARE,
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      color: "bg-blue-100",
      badgeStyle: "bg-blue-100 text-blue-800 border-0",
    },
    {
      key: "traded",
      label: "Traded / Bought Rights",
      description: "Non-original shareholders who purchased rights during the trading window and are now exercising them.",
      count: 7_556,
      totalUnits: 75_560_000,
      totalAmount: 75_560_000 * PRICE_PER_SHARE,
      icon: <ArrowRightLeft className="h-5 w-5 text-purple-600" />,
      color: "bg-purple-100",
      badgeStyle: "bg-purple-100 text-purple-800 border-0",
    },
  ];

  const totalFundsExpected = BANK_RECONCILIATIONS.reduce((s, b) => s + b.expectedAmount, 0);
  const totalFundsReceived = BANK_RECONCILIATIONS.reduce((s, b) => s + b.receivedAmount, 0);
  const netVariance = totalFundsReceived - totalFundsExpected;
  const varianceCount = BANK_RECONCILIATIONS.filter((b) => b.variance !== 0).length;

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <UploadStagingCard
        label="Upload Subscription Returns File"
        description="Upload the consolidated returns data from all Receiving Banks (.csv). The system will auto-categorise each application into one of three subscription buckets."
        accept=".csv,.xlsx"
        onUpload={handleUpload}
      />

      {uploaded && (
        <>
          {/* Categorised buckets */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Auto-Categorisation — Subscription Buckets
            </p>
            <div className="grid grid-cols-3 gap-4">
              {buckets.map((bucket) => (
                <Card key={bucket.key} className="mrpsl-card p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl ${bucket.color} flex items-center justify-center shrink-0`}>
                      {bucket.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{bucket.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {bucket.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/40 rounded-lg p-2.5">
                      <p className="text-muted-foreground">Applicants</p>
                      <p className="font-mono font-semibold mt-0.5">{bucket.count.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2.5">
                      <p className="text-muted-foreground">Units Applied</p>
                      <p className="font-mono font-semibold mt-0.5">
                        {(bucket.totalUnits / 1e6).toFixed(1)}M
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">Total Subscription Value</span>
                    <span className="font-mono font-bold">
                      ₦{(bucket.totalAmount / 1e9).toFixed(2)}B
                    </span>
                  </div>

                  <Badge className={bucket.badgeStyle}>
                    {bucket.key === "accepted" ? "Guaranteed Allotment" : "Subject to Banding"}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>

          {/* Fund Matching / Reconciliation */}
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
                  <>
                    {varianceCount > 0 ? (
                      <Badge className="bg-amber-100 text-amber-800 border-0">
                        {varianceCount} variance{varianceCount > 1 ? "s" : ""} flagged
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border-0">
                        Fully reconciled
                      </Badge>
                    )}
                  </>
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
                          <td className="px-4 py-2.5 text-right font-mono">
                            ₦{(b.expectedAmount / 1e6).toFixed(2)}M
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            ₦{(b.receivedAmount / 1e6).toFixed(2)}M
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-mono font-semibold ${
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
                        <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground">TOTAL</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">
                          ₦{(totalFundsExpected / 1e9).toFixed(2)}B
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">
                          ₦{(totalFundsReceived / 1e9).toFixed(2)}B
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-mono font-bold ${
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
                  <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
                    Export Reconciliation Report
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      toast.success(
                        "Returns data forwarded to Allotment Rules Engine. Proceed to Tab 4 to configure banding."
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
