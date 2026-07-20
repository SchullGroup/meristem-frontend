"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadStagingCard, UploadResult } from "@/components/custom/offer-administration/upload-staging-card";
import { toast } from "sonner";

interface MatchedRecord {
  id: string;
  holderName: string;
  accountNo: string;
  bankName: string;
  nuban: string;
  refundAmount: number;
  reference: string;
  bankReference: string;
  result: "Confirmed" | "Failed";
  failReason?: string;
}

const MOCK_MATCHED: MatchedRecord[] = [
  { id: "r01", holderName: "Adebayo Oluwaseun", accountNo: "ACC-00123456", bankName: "Access Bank PLC", nuban: "0123456789", refundAmount: 157_500, reference: "REFUND-R01-2024", bankReference: "ACC2024090100001", result: "Confirmed" },
  { id: "r03", holderName: "Emeka Nwachukwu", accountNo: "ACC-00345678", bankName: "Fidelity Bank PLC", nuban: "0234567891", refundAmount: 92_500, reference: "REFUND-R03-2024", bankReference: "FID2024090200001", result: "Confirmed" },
  { id: "r06", holderName: "Ngozi Eze", accountNo: "ACC-00678901", bankName: "Guaranty Trust Bank", nuban: "0345678901", refundAmount: 185_000, reference: "REFUND-R06-2024", bankReference: "", result: "Failed", failReason: "Account number not found" },
  { id: "r10", holderName: "Halima Mohammed", accountNo: "ACC-01012345", bankName: "Zenith Bank PLC", nuban: "0456789012", refundAmount: 36_513, reference: "REFUND-R10-2024", bankReference: "ZEN2024090200001", result: "Confirmed" },
  { id: "r11", holderName: "Chukwuemeka Obasi", accountNo: "ACC-01123456", bankName: "Access Bank PLC", nuban: "0567890123", refundAmount: 150_000, reference: "REFUND-R11-2024", bankReference: "", result: "Failed", failReason: "Account name mismatch" },
];

export function RefundReconciliation() {
  const [uploaded, setUploaded] = useState(false);
  const [requeued, setRequeued] = useState<Set<string>>(new Set());

  const handleUpload = async (_file: File): Promise<UploadResult> => {
    const result: UploadResult = { totalRows: MOCK_MATCHED.length };
    setUploaded(true);
    toast.success(`Bank confirmation file processed — ${MOCK_MATCHED.length} records matched.`);
    return result;
  };

  const handleRequeue = (id: string) => {
    setRequeued((prev) => new Set([...prev, id]));
    const record = MOCK_MATCHED.find((r) => r.id === id);
    toast.success(`${record?.holderName} re-queued for the next batch.`);
  };

  const handleRequeuAll = () => {
    const failedIds = MOCK_MATCHED.filter((r) => r.result === "Failed").map((r) => r.id);
    setRequeued((prev) => new Set([...prev, ...failedIds]));
    toast.success(`${failedIds.length} failed records re-queued for the next batch.`);
  };

  const confirmed = MOCK_MATCHED.filter((r) => r.result === "Confirmed");
  const failed = MOCK_MATCHED.filter((r) => r.result === "Failed");
  const totalConfirmed = confirmed.reduce((s, r) => s + r.refundAmount, 0);
  const totalFailed = failed.reduce((s, r) => s + r.refundAmount, 0);
  const unresolvedFailed = failed.filter((r) => !requeued.has(r.id));

  return (
    <div className="space-y-5">
      {/* Upload zone */}
      <UploadStagingCard
        label="Upload Bank Confirmation File"
        description="Upload the Receiving Bank's disbursement confirmation file (.csv or .txt). The system will match confirmed disbursements against dispatched records and flag any discrepancies."
        accept=".csv,.txt"
        onUpload={handleUpload}
      />

      {uploaded && (
        <>
          {/* Reconciliation summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="mrpsl-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="mrpsl-label">Confirmed</p>
                  <p className="font-mono font-bold text-lg text-green-700">{confirmed.length}</p>
                  <p className="font-mono text-xs text-muted-foreground">₦{totalConfirmed.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="mrpsl-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="mrpsl-label">Failed / Unmatched</p>
                  <p className="font-mono font-bold text-lg text-destructive">{failed.length}</p>
                  <p className="font-mono text-xs text-muted-foreground">₦{totalFailed.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            <Card className="mrpsl-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <RefreshCcw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="mrpsl-label">Total Reconciled</p>
                  <p className="font-mono font-bold text-lg">₦{((totalConfirmed + totalFailed) / 1e6).toFixed(2)}M</p>
                  <p className="text-xs text-muted-foreground">{MOCK_MATCHED.length} records total</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Confirmed records */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Confirmed Disbursements ({confirmed.length})
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="mrpsl-table-header">
                    <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                    <th className="text-left px-4 py-2.5 font-medium">Account No.</th>
                    <th className="text-left px-4 py-2.5 font-medium">Bank</th>
                    <th className="text-right px-4 py-2.5 font-medium">Amount (₦)</th>
                    <th className="text-left px-4 py-2.5 font-medium">Our Reference</th>
                    <th className="text-left px-4 py-2.5 font-medium">Bank Reference</th>
                    <th className="text-center px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map((r) => (
                    <tr key={r.id} className="mrpsl-table-row">
                      <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                      <td className="px-4 py-2.5 text-xs">{r.bankName}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">₦{r.refundAmount.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.reference}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-green-700">{r.bankReference}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge className="bg-green-100 text-green-800 border-0">Confirmed</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Failed / discrepancy list */}
          {failed.length > 0 && (
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Discrepancy List — Failed / Unmatched ({failed.length})
                  </p>
                </div>
                {unresolvedFailed.length > 0 && (
                  <Button size="sm" variant="outline" onClick={handleRequeuAll}>
                    <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                    Re-queue All Failed
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="mrpsl-table-header">
                      <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                      <th className="text-left px-4 py-2.5 font-medium">Account No.</th>
                      <th className="text-left px-4 py-2.5 font-medium">Bank</th>
                      <th className="text-right px-4 py-2.5 font-medium">Amount (₦)</th>
                      <th className="text-left px-4 py-2.5 font-medium">Our Reference</th>
                      <th className="text-left px-4 py-2.5 font-medium">Fail Reason</th>
                      <th className="text-center px-4 py-2.5 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failed.map((r) => (
                      <tr key={r.id} className="mrpsl-table-row">
                        <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                        <td className="px-4 py-2.5 text-xs">{r.bankName}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-destructive">₦{r.refundAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.reference}</td>
                        <td className="px-4 py-2.5 text-xs text-destructive">{r.failReason}</td>
                        <td className="px-4 py-2.5 text-center">
                          {requeued.has(r.id) ? (
                            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700">
                              <RefreshCcw className="h-3.5 w-3.5" />
                              Re-queued
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleRequeue(r.id)}
                            >
                              Re-queue for Next Batch
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
