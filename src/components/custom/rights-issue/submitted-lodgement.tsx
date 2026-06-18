"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useGetTradedRights } from "@/hooks/useRights";
import { RightsIssue } from "@/types/rights";
import { PaginationBar } from "../pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { DataErrorState } from "../ipo/loaders";

interface SubmittedLodgementProps {
  selectedIssue: RightsIssue;
}

export function SubmittedLodgement({ selectedIssue }: SubmittedLodgementProps) {
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);

  // Submitted history for the selected issue
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useGetTradedRights({
    id: selectedIssue.id,
    page: historyPage,
    pageSize: historyPageSize,
  });

  const totalVolume =
    (historyData?.content &&
      historyData?.content.reduce((a, e) => a + e.volume, 0)) ||
    0;

  return (
    <div className="space-y-6">
      {/* Lodged metadata */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Lodged By
          </p>
          <p className="font-medium text-sm">
            {selectedIssue.processedBy || "N/A"}
          </p>
        </Card>
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Lodged At
          </p>
          <p className="font-medium text-sm">
            {selectedIssue.lodgedAt
              ? format(new Date(selectedIssue.lodgedAt), "MMM dd, yyyy HH:mm")
              : "N/A"}
          </p>
        </Card>
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Total Volume
          </p>
          <p className="font-medium text-sm font-mono">
            {formatNumber(totalVolume)}
          </p>
        </Card>
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Total Entries
          </p>
          <p className="font-medium text-sm font-mono">
            {historyData?.pagination?.total || 0}
          </p>
        </Card>
        <Card className="mrpsl-card p-4 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            CSCS Push Status
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <p className="font-medium text-sm text-amber-700">Pending</p>
          </div>
        </Card>
      </div>

      {/* Lodged notes (if any) */}
      {selectedIssue.notes && (
        <Card className="mrpsl-card p-4 bg-muted/10 border border-muted">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Lodgment Notes
          </p>
          <p className="text-sm text-muted-foreground italic">
            &quot;{selectedIssue.notes}&quot;
          </p>
        </Card>
      )}

      {/* Submitted history section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest">
            Submitted Lodgments
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Pushed to CSCS API.")}
          >
            <CloudUpload className="mr-2 h-4 w-4" /> Push via CSCS API
          </Button>
        </div>

        <Card className="mrpsl-card overflow-hidden">
          {historyLoading ? (
            <div className="p-10 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading lodgment history...
              </p>
            </div>
          ) : historyError ? (
            <DataErrorState
              message="Failed to load lodgment history"
              onRetry={refetchHistory}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
                      <th className="px-3 py-2.5">REG AC NO</th>
                      <th className="px-3 py-2.5">CHN</th>
                      <th className="px-3 py-2.5 text-right">VOLUME</th>
                      <th className="px-3 py-2.5">MCODE</th>
                      <th className="px-3 py-2.5 text-muted-foreground">
                        LODGED AT
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyData?.content?.map((entry, i) => (
                      <tr key={entry.id} className="mrpsl-table-row">
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {(historyPage - 1) * historyPageSize + i + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          {entry.shareholderName}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {entry.registrarsAccount}
                        </td>
                        <td className="px-3 py-2.5 font-mono">{entry.chn}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold">
                          {formatNumber(entry.volume)}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {entry.memberCode}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {entry.lodgedAt
                            ? format(new Date(entry.lodgedAt), "MMM dd, yyyy")
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                    {(!historyData?.content ||
                      historyData.content.length === 0) && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-muted-foreground italic"
                          >
                            No lodgments submitted yet for this declaration.
                          </td>
                        </tr>
                      )}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-2.5 text-right text-muted-foreground"
                      >
                        BATCH TOTAL
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {formatNumber(totalVolume)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
              {historyData?.pagination && (
                <PaginationBar
                  page={historyPage}
                  total={historyData.pagination.total}
                  pageSize={historyPageSize}
                  onPageSizeChange={setHistoryPageSize}
                  onPageChange={setHistoryPage}
                  pageBase={1}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
