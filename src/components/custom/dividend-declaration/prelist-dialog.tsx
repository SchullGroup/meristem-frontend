"use client";

import { useState } from "react";
import { Download, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import { TablePagination } from "@/components/custom/table-pagination";
import { useDividendFlow, useForwardToIcu } from "@/hooks/useDividendDeclarationFlow";
import { formatNaira } from "./helpers";

const PAGE_SIZE = 10;

export function PrelistDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentUser } = useStore();
  const { data: record } = useDividendFlow(id ?? undefined);
  const forwardMutation = useForwardToIcu();
  const [page, setPage] = useState(1);

  const prelist = record?.prelist ?? [];
  const totalPages = Math.max(1, Math.ceil(prelist.length / PAGE_SIZE));
  const pageRows = prelist.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExportCsv() {
    if (!record || prelist.length === 0) {
      toast.error("No prelist data available to export.");
      return;
    }
    downloadCsvData(
      ["Account Number", "Holder Name", "Units", "Gross Dividend (NGN)", "WHT (NGN)", "Net Dividend (NGN)"],
      prelist.map((r) => [
        r.accountNumber,
        r.holderName,
        String(r.units),
        r.grossAmount.toFixed(2),
        r.whtAmount.toFixed(2),
        r.netAmount.toFixed(2),
      ]),
      `dividend_prelist_${record.paymentNumber.replace("/", "-")}.csv`,
    );
    toast.success("Prelist exported as CSV.");
  }

  function handleForward() {
    if (!record) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    forwardMutation.mutate(
      { id: record.id, actor: currentUser.email },
      {
        onSuccess: () => {
          toast.success("Forwarded to ICU for approval.");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to forward declaration."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Dividend Prelist — {record?.paymentNumber}</DialogTitle>
          <DialogDescription>
            Computed liability for all eligible shareholders on {record?.registerSymbol}.
          </DialogDescription>
        </DialogHeader>

        {record && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Total Shareholders" value={record.totalShareholders.toLocaleString()} />
              <Stat label="Gross Liability" value={formatNaira(record.grossLiability)} />
              <Stat label="WHT Amount" value={formatNaira(record.whtAmount)} tone="text-amber-600" />
              <Stat label="Net Payout" value={formatNaira(record.netLiability)} tone="text-green-700" />
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-3 py-2">ACCOUNT NO</th>
                      <th className="px-3 py-2">HOLDER NAME</th>
                      <th className="px-3 py-2 text-right">UNITS</th>
                      <th className="px-3 py-2 text-right">GROSS (₦)</th>
                      <th className="px-3 py-2 text-right">WHT (₦)</th>
                      <th className="px-3 py-2 text-right">NET (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px] font-mono">
                    {pageRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground font-sans">
                          No prelist rows.
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((r) => (
                        <tr key={r.id}>
                          <td className="px-3 py-2">{r.accountNumber}</td>
                          <td className="px-3 py-2 font-sans">{r.holderName}</td>
                          <td className="px-3 py-2 text-right">{r.units.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{r.grossAmount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{r.whtAmount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-semibold">{r.netAmount.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              totalPages={totalPages}
              from={prelist.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              to={Math.min(page * PAGE_SIZE, prelist.length)}
              total={prelist.length}
              onPageChange={setPage}
              onPageSizeChange={() => {}}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
              <Button variant="outline" className="gap-1.5" onClick={handleExportCsv}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              {record.status === "PRELIST_GENERATED" && (
                <Button
                  className="gap-1.5"
                  onClick={handleForward}
                  disabled={forwardMutation.isPending}
                >
                  <Send className="h-4 w-4" /> Forward to ICU for Approval
                  {forwardMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3 border border-border/60">
      <div className="mrpsl-section-title">{label}</div>
      <div className={`text-lg font-bold tabular mt-1 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
