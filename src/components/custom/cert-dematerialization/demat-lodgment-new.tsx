"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Download, CheckCircle2, FileText, CalendarIcon, AlertTriangle, X } from "lucide-react";
import { format } from "date-fns";
import { formatNumber } from "@/lib/utils/format";
import type { DematRequest } from "./demat-types";
import { toast } from "sonner";

interface Props {
  requests: DematRequest[];
  onLodge: (id: string, date: string) => void;
  onDelodge: (id: string) => void;
}

export function DematLodgment({ requests, onLodge, onDelodge }: Props) {
  const approved = requests.filter((r) => r.status === "APPROVED");
  const visible = requests.filter(
    (r) => r.status === "APPROVED" || r.status === "LODGED",
  );

  // per-row date state for APPROVED entries; defaults to today
  const [lodgmentDates, setLodgmentDates] = useState<Record<string, Date>>(
    () => Object.fromEntries(approved.map((r) => [r.id, new Date()])),
  );

  // detail dialog state
  const [detailReq, setDetailReq] = useState<DematRequest | null>(null);
  const [confirming, setConfirming] = useState(false);

  function openDetail(req: DematRequest) {
    setDetailReq(req);
    setConfirming(false);
  }

  function closeDetail() {
    setDetailReq(null);
    setConfirming(false);
  }

  function handleConfirmDelodge() {
    if (!detailReq) return;
    onDelodge(detailReq.id);
    toast.success(`Certificate ${detailReq.id} has been delodged.`);
    closeDetail();
  }

  function buildTextContent(req: DematRequest): string {
    return [
      `DEMAT REQUEST: ${req.id}`,
      `Holder: ${req.holderName}`,
      `CHN: ${req.holderChn}`,
      `Register: ${req.registerSymbol}`,
      `Certificates: ${req.certificateNos.join(", ")}`,
      `Units: ${req.totalUnits}`,
      `Date: ${req.createdAt}`,
      "",
    ].join("\n");
  }

  function triggerDownload(req: DematRequest) {
    const content = buildTextContent(req);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `demat_${req.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function formatLodgmentDate(d: Date): string {
    return format(d, "dd MMM yyyy");
  }

  function handleDownloadCsv(req: DematRequest) {
    triggerDownload(req);
    const d = lodgmentDates[req.id] ?? new Date();
    onLodge(req.id, formatLodgmentDate(d));
    toast.success(`CSV downloaded for ${req.id}`);
  }

  function handleMarkLodged(id: string) {
    const d = lodgmentDates[id] ?? new Date();
    onLodge(id, formatLodgmentDate(d));
    toast.success(`Request ${id} marked as lodged`);
  }

  function handleDownloadAll() {
    approved.forEach((req) => {
      triggerDownload(req);
      toast.success(`CSV downloaded for ${req.id}`);
      onLodge(req.id, formatLodgmentDate(lodgmentDates[req.id] ?? new Date()));
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">CSCS Lodgment</h2>
              {approved.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {approved.length} Approved
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Download CSV files for submission to CSCS.
            </p>
          </div>
          {approved.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={handleDownloadAll}
            >
              <Download className="h-3.5 w-3.5" />
              Download All (CSV)
            </Button>
          )}
        </div>

        {/* Table or empty state */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">No requests ready for lodgment.</p>
          </div>
        ) : (
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3">REQUEST ID</th>
                    <th className="px-4 py-3">HOLDER</th>
                    <th className="px-4 py-3">CHN</th>
                    <th className="px-4 py-3">REGISTER</th>
                    <th className="px-4 py-3">CERT NO(S)</th>
                    <th className="px-4 py-3 text-right">UNITS</th>
                    <th className="px-4 py-3 text-right">VALUE (&#8358;)</th>
                    <th className="px-4 py-3">LODGMENT DATE</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {visible.map((req) => {
                    const value = req.totalUnits * req.unitPrice;
                    const isApproved = req.status === "APPROVED";

                    return (
                      <tr key={req.id} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-xs">{req.id}</td>
                        <td className="px-4 py-3 font-medium">{req.holderName}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground text-xs">
                          {req.holderChn}
                        </td>
                        <td className="px-4 py-3">{req.registerSymbol}</td>
                        <td
                          className="px-4 py-3 font-mono truncate max-w-48 text-xs"
                          title={req.certificateNos.join(", ")}
                        >
                          {req.certificateNos.join(", ")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {formatNumber(req.totalUnits)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(value)}
                        </td>
                        <td className="px-4 py-3">
                          {isApproved ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-40 justify-start text-xs font-normal cursor-pointer"
                                >
                                  <CalendarIcon className="h-3 w-3 mr-1.5 opacity-50 shrink-0" />
                                  {lodgmentDates[req.id]
                                    ? format(lodgmentDates[req.id], "dd MMM yyyy")
                                    : "Pick date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  captionLayout="dropdown"
                                  selected={lodgmentDates[req.id]}
                                  onSelect={(d) =>
                                    d && setLodgmentDates((prev) => ({ ...prev, [req.id]: d }))
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {req.lodgmentDate ?? "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isApproved ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-xs">
                              Ready
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-xs">
                              Lodged
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isApproved ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[12px] gap-1"
                                onClick={() => handleDownloadCsv(req)}
                              >
                                <Download className="h-3 w-3" />
                                Download CSV
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-[12px] gap-1"
                                onClick={() => handleMarkLodged(req.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Mark as Lodged
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2.5 text-xs cursor-pointer"
                              onClick={() => openDetail(req)}
                            >
                              View Details
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ── Lodged certificate detail dialog ───────────────────────────── */}
      <Dialog open={!!detailReq} onOpenChange={(v) => !v && closeDetail()}>
        <DialogContent className="max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">Certificate Detail</DialogTitle>

          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-lg font-bold font-mono">{detailReq?.id}</p>
                <p className="text-sm text-muted-foreground">{detailReq?.holderName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 -mt-1 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={closeDetail}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {detailReq && (
            <div className="px-8 pb-2 space-y-5">
              {/* Status metadata banners */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-800 dark:text-green-300">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">Lodgement Status:</span>
                  <span>LODGED</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">Original Lodgement Date:</span>
                  <span>{detailReq.lodgmentDate ?? "—"}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <div>
                  <p className="mrpsl-label mb-0.5">Holder Name</p>
                  <p className="font-medium">{detailReq.holderName}</p>
                </div>
                <div>
                  <p className="mrpsl-label mb-0.5">CHN</p>
                  <p className="font-mono">{detailReq.holderChn}</p>
                </div>
                <div>
                  <p className="mrpsl-label mb-0.5">Register</p>
                  <p className="font-mono font-medium">{detailReq.registerSymbol}</p>
                </div>
                <div>
                  <p className="mrpsl-label mb-0.5">Total Units</p>
                  <p className="font-semibold tabular-nums">{formatNumber(detailReq.totalUnits)}</p>
                </div>
                <div className="col-span-2">
                  <p className="mrpsl-label mb-0.5">Certificate(s)</p>
                  <div className="flex flex-wrap gap-1">
                    {detailReq.certificateNos.map((c) => (
                      <span key={c} className="font-mono text-xs bg-muted rounded px-2 py-0.5">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mrpsl-label mb-0.5">Stockbroker</p>
                  <p>{detailReq.stockbrokerName}</p>
                </div>
                <div>
                  <p className="mrpsl-label mb-0.5">Captured On</p>
                  <p className="text-muted-foreground">{detailReq.createdAt}</p>
                </div>
              </div>

              {/* Confirmation warning */}
              {confirming && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>This will reverse the CSCS lodgement for this certificate. This action cannot be undone.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {confirming ? (
              <>
                <Button variant="outline" onClick={() => setConfirming(false)} className="cursor-pointer">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmDelodge} className="cursor-pointer">
                  Confirm Delodgement
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={closeDetail} className="cursor-pointer">
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setConfirming(true)}
                  className="cursor-pointer"
                >
                  Delodge Certificate
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
