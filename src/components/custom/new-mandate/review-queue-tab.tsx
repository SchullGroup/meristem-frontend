"use client";

import { useMemo, useState } from "react";
import { Plus, Download, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type {
  MandateBatch,
  MandateShareholder,
} from "@/types/mandate-payment-flow";
import {
  useMandateBatches,
  useRejectedShareholders,
  useSendBatchForApproval,
} from "@/hooks/useMandatePaymentFlow";
import { MOCK_REGISTERS } from "./seed-data";
import { batchDividendNumbers, batchRegisters } from "./helpers";
import { BatchListTable } from "./batch-list-table";
import { BatchDetailPanel } from "./batch-detail-panel";
import { CreateBatchDialog } from "./create-batch-dialog";
import { downloadBatchListCsv } from "./csv";

export function ReviewQueueTab() {
  const { currentUser } = useStore();
  const { data: batches = [], isLoading } = useMandateBatches();
  const { data: rejected = [], isLoading: rejectedLoading } =
    useRejectedShareholders();
  const sendMutation = useSendBatchForApproval();

  const [view, setView] = useState<"active" | "rejected">("active");
  const [register, setRegister] = useState("");
  const [dividend, setDividend] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dividendOptions = useMemo(
    () =>
      Array.from(
        new Set(batches.flatMap((b) => batchDividendNumbers(b))),
      ).sort(),
    [batches],
  );

  const filtered = useMemo(
    () =>
      batches.filter((b) => {
        if (register && !batchRegisters(b).includes(register)) return false;
        if (dividend && !batchDividendNumbers(b).includes(dividend))
          return false;
        return true;
      }),
    [batches, register, dividend],
  );

  const selected: MandateBatch | null =
    batches.find((b) => b.id === selectedId) ?? null;

  function handleSend() {
    if (!selected) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    sendMutation.mutate(
      { id: selected.id, actor: currentUser.email },
      {
        onSuccess: () => {
          toast.success(`Batch ${selected.batchRef} sent for approval.`);
          setSelectedId(null);
        },
        onError: (err) => toast.error(err?.message || "Failed to send batch."),
      },
    );
  }

  // In-place batch detail sub-screen.
  if (selected) {
    return (
      <BatchDetailPanel
        batch={selected}
        title="Batch Detail"
        onBack={() => setSelectedId(null)}
        actions={
          selected.status === "QUEUED" ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              <Send className="h-4 w-4" /> Send Batch for Approval
              {sendMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
          ) : (
            <span className="text-[13px] text-muted-foreground">
              Read-only — already sent for approval
            </span>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* View toggle + create */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
          <button
            onClick={() => setView("active")}
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              view === "active"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Batches
          </button>
          <button
            onClick={() => setView("rejected")}
            className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              view === "rejected"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Rejected{" "}
            {rejected.length > 0 && (
              <Badge className="ml-1 bg-red-100 text-red-700 border-0 text-[11px]">
                {rejected.length}
              </Badge>
            )}
          </button>
        </div>

        {view === "active" && (
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create New Batch
          </Button>
        )}
      </div>

      {view === "active" ? (
        <>
          <div className="flex gap-3 items-end flex-wrap justify-between">
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex flex-col">
                <label className="mrpsl-label">Register</label>
                <Select
                  value={register || "ALL"}
                  onValueChange={(v) => setRegister(!v || v === "ALL" ? "" : v)}
                >
                  <SelectTrigger className="w-48 mrpsl-input">
                    <SelectValue placeholder="All Registers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Registers</SelectItem>
                    {MOCK_REGISTERS.map((r) => (
                      <SelectItem key={r.symbol} value={r.symbol}>
                        <span className="font-bold">{r.registerName}</span> —{" "}
                        <span className="text-xs">{r.symbol}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="mrpsl-label">Dividend Number</label>
                <Select
                  value={dividend || "ALL"}
                  onValueChange={(v) => setDividend(!v || v === "ALL" ? "" : v)}
                >
                  <SelectTrigger className="w-56 mrpsl-input">
                    <SelectValue placeholder="All Dividend Numbers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Dividend Numbers</SelectItem>
                    {dividendOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                downloadBatchListCsv(filtered, "mandate_review_queue.csv");
                toast.success("Batch list exported as CSV.");
              }}
            >
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </div>

          <BatchListTable
            batches={filtered}
            isLoading={isLoading}
            actionLabel="View Batch"
            actionVariant="outline"
            onAction={(b) => setSelectedId(b.id)}
            emptyLabel="No batches yet. Create a new batch to get started."
          />
        </>
      ) : (
        <RejectedView rejected={rejected} isLoading={rejectedLoading} />
      )}

      <CreateBatchDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function RejectedView({
  rejected,
  isLoading,
}: {
  rejected: MandateShareholder[];
  isLoading: boolean;
}) {
  const rows = rejected ?? [];
  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="px-4 py-3 bg-red-50 border-b border-red-200 text-[13px] font-bold uppercase tracking-wide text-red-700">
        Excluded / Rejected Shareholders ({rows.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="px-4 py-3">NAME</th>
              <th className="px-4 py-3">REGISTER</th>
              <th className="px-4 py-3">DIVIDEND NO</th>
              <th className="px-4 py-3 text-right">AMOUNT (₦)</th>
              <th className="px-4 py-3">EXCLUDED FROM</th>
              <th className="px-4 py-3">REASON</th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No excluded or rejected shareholders.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="mrpsl-table-row">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 font-semibold">{s.registerSymbol}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {s.dividendNumber}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    {s.amount.toLocaleString()}.00
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {s.excludedFromBatchRef ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-red-700">
                    {s.excludedReason ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
