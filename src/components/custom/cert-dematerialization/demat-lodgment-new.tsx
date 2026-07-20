"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle2, FileText, Send } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import type { DematRequest } from "./demat-types";
import { toast } from "sonner";

interface Props {
  requests: DematRequest[];
  onLodge: (id: string) => void;
}

export function DematLodgment({ requests, onLodge }: Props) {
  const approved = requests.filter((r) => r.status === "APPROVED");
  const visible = requests.filter(
    (r) => r.status === "APPROVED" || r.status === "LODGED",
  );

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

  function handleDownloadCsv(req: DematRequest) {
    triggerDownload(req);
    onLodge(req.id);
    toast.success(`CSV downloaded for ${req.id}`);
  }

  function handleMarkLodged(id: string) {
    onLodge(id);
    toast.success(`Request ${id} marked as lodged`);
  }

  function handleDownloadAll() {
    approved.forEach((req) => {
      triggerDownload(req);
      toast.success(`CSV downloaded for ${req.id}`);
      onLodge(req.id);
    });
  }

  return (
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
                          <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                            Lodged
                          </span>
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
  );
}
