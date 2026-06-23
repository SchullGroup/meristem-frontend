"use client";

import { useState } from "react";
import { Loader2, AlertCircle, ArrowUpRight, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useReturnRecords,
  useProcessReturn,
} from "@/hooks/useDividendReturnMoney";
import { formatNaira } from "@/lib/utils/format";
import { toast } from "sonner";
import type { DividendReturnRecord, ReturnStatus } from "@/types/dividend-return-money";

const STATUS_META: Record<
  ReturnStatus,
  { label: string; className: string }
> = {
  PENDING_RETURN: {
    label: "Pending Return",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  PARTIALLY_CLAIMED: {
    label: "Partially Claimed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  EXHAUSTED: {
    label: "Withheld Exhausted",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function UnclaimedOverviewTab() {
  const [registerFilter, setRegisterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "">("");
  const [confirmRecord, setConfirmRecord] =
    useState<DividendReturnRecord | null>(null);
  const [narration, setNarration] = useState("");

  const { data: registersData } = useGetRegisters({ size: 100, status: "ACTIVE" });

  const { data, isLoading } = useReturnRecords({
    registerSymbol: registerFilter || undefined,
    returnStatus: statusFilter || undefined,
    size: 50,
  });

  const processReturn = useProcessReturn();

  const records = data?.content ?? [];

  const totalUnclaimed = records.reduce((s, r) => s + r.totalUnclaimed, 0);
  const totalReturned = records.reduce(
    (s, r) =>
      r.returnStatus !== "PENDING_RETURN" ? s + r.returnAmount : s,
    0,
  );
  const totalWithheld = records.reduce((s, r) => s + r.withheldAmount, 0);

  function handleProcessReturn() {
    if (!confirmRecord) return;
    processReturn.mutate(
      {
        returnRecordId: confirmRecord.id,
        returnPercentage: 90,
        narration: narration.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            `Return processed for ${confirmRecord.paymentNumber}. ${formatNaira(confirmRecord.returnAmount)} sent to company.`,
          );
          setConfirmRecord(null);
          setNarration("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title mb-1">Total Unclaimed</div>
          <div className="text-2xl font-bold font-mono">
            {formatNaira(totalUnclaimed)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across all declarations
          </div>
        </Card>
        <Card className="mrpsl-card p-4 border-l-4 border-l-green-500">
          <div className="mrpsl-section-title mb-1 text-green-700">
            90% Returned to Company
          </div>
          <div className="text-2xl font-bold font-mono text-green-600">
            {formatNaira(totalReturned)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Processed returns
          </div>
        </Card>
        <Card className="mrpsl-card p-4 border-l-4 border-l-amber-500">
          <div className="mrpsl-section-title mb-1 text-amber-700">
            10% Withheld
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {formatNaira(totalWithheld)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Reserved for shareholder claims
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div className="space-y-1.5">
          <label className="mrpsl-label">Register</label>
          <Select
            value={registerFilter || "all"}
            onValueChange={(v) => setRegisterFilter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="mrpsl-input w-48">
              <SelectValue placeholder="All Registers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Registers</SelectItem>
              {registersData?.content?.map((r) => (
                <SelectItem key={r.registerId} value={r.symbol}>
                  <span className="font-bold">{r.registerName}</span>{" "}
                  <span className="text-sm">{r.symbol}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="mrpsl-label">Status</label>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) =>
              setStatusFilter(v === "all" ? "" : (v as ReturnStatus))
            }
          >
            <SelectTrigger className="mrpsl-input w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING_RETURN">Pending Return</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
              <SelectItem value="PARTIALLY_CLAIMED">Partially Claimed</SelectItem>
              <SelectItem value="EXHAUSTED">Withheld Exhausted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3">DECLARATION NO</th>
                <th className="p-3">REGISTER</th>
                <th className="p-3 text-right">SHAREHOLDERS</th>
                <th className="p-3 text-right">TOTAL UNCLAIMED</th>
                <th className="p-3 text-right">90% RETURN</th>
                <th className="p-3 text-right">10% WITHHELD</th>
                <th className="p-3 text-right">PAID FROM 10%</th>
                <th className="p-3 text-right">REMAINING</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-[13px]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="p-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-12 text-center text-muted-foreground font-sans"
                  >
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No unclaimed dividend records found.
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const statusMeta = STATUS_META[rec.returnStatus];
                  const canProcess = rec.returnStatus === "PENDING_RETURN";
                  return (
                    <tr key={rec.id} className="hover:bg-accent/5">
                      <td className="p-3 font-bold text-primary">
                        {rec.paymentNumber}
                      </td>
                      <td className="p-3 font-sans font-medium">
                        {rec.registerSymbol}
                      </td>
                      <td className="p-3 text-right">
                        {rec.shareholderCount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {formatNaira(rec.totalUnclaimed)}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {formatNaira(rec.returnAmount)}
                        <div className="text-[11px] text-muted-foreground">
                          {rec.returnPercentage}%
                        </div>
                      </td>
                      <td className="p-3 text-right text-amber-600">
                        {formatNaira(rec.withheldAmount)}
                        <div className="text-[11px] text-muted-foreground">
                          {rec.withheldPercentage}%
                        </div>
                      </td>
                      <td className="p-3 text-right text-blue-600">
                        {formatNaira(rec.totalPaidToShareholders)}
                      </td>
                      <td
                        className={`p-3 text-right font-bold ${
                          rec.remainingBalance <= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatNaira(rec.remainingBalance)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {canProcess && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                            onClick={() => setConfirmRecord(rec)}
                          >
                            <Building2 className="h-3 w-3" />
                            Process Return
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Process Return Confirmation Dialog */}
      <Dialog
        open={!!confirmRecord}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRecord(null);
            setNarration("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Process Return — {confirmRecord?.paymentNumber}
            </DialogTitle>
            <DialogDescription>
              This will record the 90% portion as returned to the company and
              retain 10% in the withheld pool for shareholder claims.
            </DialogDescription>
          </DialogHeader>

          {confirmRecord && (
            <div className="space-y-4 px-8 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase">
                    Total Unclaimed
                  </div>
                  <div className="font-mono font-bold text-base">
                    {formatNaira(confirmRecord.totalUnclaimed)}
                  </div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase">
                    Shareholders
                  </div>
                  <div className="font-mono font-bold text-base">
                    {confirmRecord.shareholderCount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border divide-y">
                <div className="flex justify-between items-center p-3">
                  <div>
                    <div className="font-medium text-sm">
                      90% — Returned to Company
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Paid out immediately
                    </div>
                  </div>
                  <div className="font-mono font-bold text-green-600">
                    {formatNaira(confirmRecord.returnAmount)}
                  </div>
                </div>
                <div className="flex justify-between items-center p-3">
                  <div>
                    <div className="font-medium text-sm">
                      10% — Withheld by MRPSL
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reserved for shareholder claims
                    </div>
                  </div>
                  <div className="font-mono font-bold text-amber-600">
                    {formatNaira(confirmRecord.withheldAmount)}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">Narration (optional)</label>
                <Textarea
                  className="mrpsl-input resize-none"
                  rows={2}
                  placeholder="Add a note for audit purposes..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmRecord(null);
                setNarration("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessReturn}
              disabled={processReturn.isPending}
            >
              {processReturn.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
