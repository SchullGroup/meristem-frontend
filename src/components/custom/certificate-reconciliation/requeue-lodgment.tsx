"use client";

import { useState } from "react";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";

type LodgmentStatus = "PENDING_LODGMENT" | "LODGED";

interface RequeueItem {
  id: string;
  batchRef: string;
  chn: string;
  holderName: string;
  register: string;
  transactionDate: string;
  transferNo: string;
  units: number;
  status: LodgmentStatus;
}

const STATUS_STYLES: Record<LodgmentStatus, string> = {
  PENDING_LODGMENT: "bg-amber-100 text-amber-800 border-0",
  LODGED: "bg-green-100 text-green-800 border-0",
};

const STATUS_LABELS: Record<LodgmentStatus, string> = {
  PENDING_LODGMENT: "Pending Lodgment",
  LODGED: "Lodged",
};

const SEED_REQUEUE: RequeueItem[] = [
  {
    id: "rq1",
    batchRef: "BATCH-CSCS-20260710_091045",
    chn: "C0011223AK",
    holderName: "TUNDE ADEWALE BAKARE",
    register: "DANGCEM",
    transactionDate: "10 Jul 2026",
    transferNo: "TRF-DANGCEM-HIST-512",
    units: 1500,
    status: "PENDING_LODGMENT",
  },
  {
    id: "rq2",
    batchRef: "BATCH-CSCS-20260707_143022",
    chn: "C0023456BK",
    holderName: "NGOZI CHIDINMA OKAFOR",
    register: "DANGCEM",
    transactionDate: "07 Jul 2026",
    transferNo: "TRF-DANGCEM-HIST-220",
    units: 1000,
    status: "LODGED",
  },
];

export function RequeueLodgment() {
  const [items, setItems] = useState<RequeueItem[]>(SEED_REQUEUE);

  const pending = items.filter((i) => i.status === "PENDING_LODGMENT");

  const markLodged = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "LODGED" } : i)),
    );
    toast.success("Transaction marked as lodged.");
  };

  const generateLodgmentFile = () => {
    const headers = [
      "Batch Ref",
      "CHN",
      "Holder Name",
      "Register",
      "Transaction Date",
      "Transfer No",
      "Units",
    ];
    const rows = pending.map((i) => [
      i.batchRef,
      i.chn,
      i.holderName,
      i.register,
      i.transactionDate,
      i.transferNo,
      i.units,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cscs-requeue-lodgment.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Lodgment file generated for ${pending.length} transaction${pending.length !== 1 ? "s" : ""}.`);
  };

  return (
    <div className="space-y-4">
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Re-Queue For Lodgment
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transactions resolved via the Resolution Desk that must be
              re-submitted to CSCS for lodgment.
            </p>
          </div>
          {pending.length > 0 && (
            <Button size="sm" onClick={generateLodgmentFile}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Generate Lodgment File
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-sm">No transactions queued for lodgment</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Resolved transactions from the CSCS Update Reconciliation tab will
              appear here for re-lodgment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">CHN</th>
                  <th className="px-4 py-3 text-left font-medium">HOLDER NAME</th>
                  <th className="px-4 py-3 text-left font-medium">REGISTER</th>
                  <th className="px-4 py-3 text-left font-medium">BATCH REF</th>
                  <th className="px-4 py-3 text-left font-medium">TRANSFER NO</th>
                  <th className="px-4 py-3 text-left font-medium">DATE</th>
                  <th className="px-4 py-3 text-right font-medium">UNITS</th>
                  <th className="px-4 py-3 text-left font-medium">STATUS</th>
                  <th className="px-4 py-3 text-right font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                      {row.chn}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.holderName}</td>
                    <td className="px-4 py-3">
                      <Badge className="border-0 text-[11px] bg-gray-100 text-gray-800">
                        {row.register}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {row.batchRef}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {row.transferNo}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {row.transactionDate}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatNumber(row.units)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[11px] ${STATUS_STYLES[row.status]}`}>
                        {STATUS_LABELS[row.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "PENDING_LODGMENT" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => markLodged(row.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark as Lodged
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
