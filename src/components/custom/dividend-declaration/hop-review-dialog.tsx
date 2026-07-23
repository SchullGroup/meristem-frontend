"use client";

import { useState } from "react";
import { Download, Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import { useDecideStage } from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatNaira } from "./helpers";

export function HopReviewDialog({
  record,
  open,
  onOpenChange,
}: {
  record: DividendFlowRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentUser } = useStore();
  const [comment, setComment] = useState("");
  const decideMutation = useDecideStage();

  function reset() {
    setComment("");
  }

  function handleDownload() {
    if (!record) return;
    downloadCsvData(
      ["Account Number", "Holder Name", "BVN", "NIN", "Bank Name", "Bank Account No", "Sort Code", "Net Amount (NGN)"],
      record.prelist.map((r) => [
        r.accountNumber,
        r.holderName,
        r.bvn,
        r.nin,
        r.bankName,
        r.bankAccountNumber,
        r.sortCode,
        r.netAmount.toFixed(2),
      ]),
      `dividend_hop_kyc_${record.paymentNumber.replace("/", "-")}.csv`,
    );
    toast.success("Shareholder KYC list exported as CSV.");
  }

  function decide(decision: "APPROVE" | "REJECT") {
    if (!record) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (decision === "REJECT" && !comment.trim()) {
      toast.error("Comment is required for rejection.");
      return;
    }
    decideMutation.mutate(
      {
        id: record.id,
        stage: "HOP",
        decision,
        actor: currentUser.email,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "APPROVE" ? "Declaration approved." : "Declaration rejected.",
          );
          reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>HOP Approval — {record?.paymentNumber}</DialogTitle>
        </DialogHeader>

        {record && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 rounded-xl p-4 border border-border/60">
              <Stat label="Register" value={`${record.registerName} (${record.registerSymbol})`} />
              <Stat label="Shareholders" value={record.totalShareholders.toLocaleString()} />
              <Stat label="Gross Liability" value={formatNaira(record.grossLiability)} />
              <Stat label="Net Payout" value={formatNaira(record.netLiability)} tone="text-green-700" />
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">
                Shareholder KYC &amp; Payment Details ({record.prelist.length})
              </h4>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header sticky top-0">
                  <tr>
                    <th className="px-3 py-2">ACCOUNT NO</th>
                    <th className="px-3 py-2">HOLDER NAME</th>
                    <th className="px-3 py-2">BVN</th>
                    <th className="px-3 py-2">NIN</th>
                    <th className="px-3 py-2">BANK NAME</th>
                    <th className="px-3 py-2">BANK ACCOUNT NO</th>
                    <th className="px-3 py-2">SORT CODE</th>
                    <th className="px-3 py-2 text-right">PAYMENT AMOUNT (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px] font-mono">
                  {record.prelist.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2">{r.accountNumber}</td>
                      <td className="px-3 py-2 font-sans">{r.holderName}</td>
                      <td className="px-3 py-2">{r.bvn}</td>
                      <td className="px-3 py-2">{r.nin}</td>
                      <td className="px-3 py-2 font-sans">{r.bankName}</td>
                      <td className="px-3 py-2">{r.bankAccountNumber}</td>
                      <td className="px-3 py-2">{r.sortCode}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {r.netAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <label className="mrpsl-label">Comment</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Required when rejecting..."
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/60">
              <Button
                variant="destructive"
                className="flex-1 gap-1.5"
                onClick={() => decide("REJECT")}
                disabled={decideMutation.isPending}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={() => decide("APPROVE")}
                disabled={decideMutation.isPending}
              >
                <Check className="h-4 w-4" /> Approve &amp; Forward to ICU (2nd)
                {decideMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="mrpsl-section-title">{label}</div>
      <div className={`font-bold mt-0.5 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
