"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { KycChange, ShareholderAccount } from "@/types/account-maintenance";
import { useGetAccountKycHistory } from "@/hooks/useAccountMaintenance";
import { EntitlementTableSkeleton } from "@/components/custom/rights-issue/loaders";
import { DataErrorState } from "@/components/custom/ipo/loaders";
import { formatDate } from "@/lib/utils/format";
import StatusBadge from "../status-badge";
import { ChevronDown, ChevronRight, Download, FileText } from "lucide-react";
import {
  DocumentViewer,
  parseDocumentUrls,
} from "@/components/custom/document-viewer";
import { DateRangePicker } from "../date-range-picker";
import { DateRange } from "react-day-picker";

// ── Minimal Excel export (CSV-based) ────────────────────────────────────────
function exportToCSV(rows: KycChange[], filename: string) {
  const headers = [
    "Date",
    "Field Changed",
    "Old Value",
    "New Value",
    "Status",
    "Submitted By",
    "Authorised By",
    "ICU Approved By",
    "Decided At",
    "Reason",
    "Rejection Reason",
  ];
  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) =>
      [
        r.createdAt,
        r.fieldChanged,
        r.oldValue,
        r.newValue,
        r.status,
        r.initiatorName,
        r.authorisedBy ?? "",
        r.icuApprovedBy ?? "",
        r.decidedAt,
        r.reason ?? "",
        r.rejectionComment,
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function KYCHistory({
  tab,
  selectedShareholder,
}: {
  tab: string;
  selectedShareholder: ShareholderAccount | null;
}) {
  const [historyPage, setHistoryPage] = useState(0);
  const [historyPageSize, setHistoryPageSize] = useState(20);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  // ── Expanded rows ─────────────────────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Document viewer ───────────────────────────────────────────────────────
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerDocs, setDocViewerDocs] = useState<
    ReturnType<typeof parseDocumentUrls>
  >([]);
  const [docViewerUploader, setDocViewerUploader] = useState("");
  const [docViewerDate, setDocViewerDate] = useState("");

  function openDocs(row: KycChange) {
    const docs = Array.isArray(row.supportingDocuments)
      ? row.supportingDocuments
      : typeof row.supportingDocuments === "string"
        ? parseDocumentUrls(row.supportingDocuments, "Document")
        : [];
    setDocViewerDocs(docs);
    setDocViewerUploader(row.initiatorName ?? "");
    setDocViewerDate(row.createdAt ?? "");
    setDocViewerOpen(true);
  }

  // ── KYC history ───────────────────────────────────────────────────────────
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useGetAccountKycHistory(
    selectedShareholder?.accountNumber ?? "",
    { page: historyPage, pageSize: historyPageSize },
    { enabled: !!selectedShareholder && tab === "history" },
  );

  const allRows = historyData?.data?.data || [];
  const historyTotal = historyData?.data?.total || 0;
  const historyTotalPages = historyData?.data?.totalPages || 1;

  // Client-side filter
  const historyChanges = allRows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (dateRange?.from && new Date(r.createdAt) < new Date(dateRange.from))
      return false;
    if (dateRange?.to && new Date(r.createdAt) > new Date(dateRange.to))
      return false;
    return true;
  });

  if (isHistoryLoading) {
    return <EntitlementTableSkeleton />;
  }

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val || "");
              setHistoryPage(0);
            }}
          >
            <SelectTrigger className="mrpsl-input w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <DateRangePicker
              date={dateRange}
              setDate={(date) => {
                setDateRange(date);
              }}
            />
          </div>
        </div>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            exportToCSV(
              historyChanges,
              `kyc-history-${selectedShareholder?.accountNumber ?? "export"}.csv`,
            )
          }
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* ── Table ── */}
      <Card className="mrpsl-card overflow-hidden">
        {isHistoryError ? (
          <DataErrorState
            message="Failed to load change history."
            onRetry={refetchHistory}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3 w-6" />
                <th className="p-3">DATE</th>
                <th className="p-3">FIELD CHANGED</th>
                <th className="p-3">OLD VALUE</th>
                <th className="p-3">NEW VALUE</th>
                <th className="p-3">CHANGED BY</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">SUBMITTED BY</th>
                <th className="p-3">AUTHORISED BY</th>
                <th className="p-3">ICU APPROVED BY</th>
                <th className="p-3">DECIDED AT</th>
                <th className="p-3">REASON</th>
                <th className="p-3">REJECTION REASON</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {historyChanges.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No history found for this account
                  </td>
                </tr>
              ) : (
                historyChanges.map((row) => {
                  const isExpanded = expandedIds.has(row.id);
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        key={row.id}
                        className="mrpsl-table-row cursor-pointer"
                        onClick={() => toggleExpand(row.id)}
                      >
                        <td className="p-3 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="p-3 font-medium">{row.fieldChanged}</td>
                        <td className="p-3 text-muted-foreground font-mono text-[12px]">
                          {row.oldValue || "—"}
                        </td>
                        <td className="p-3 font-mono text-[12px] text-primary font-semibold">
                          {row.newValue}
                        </td>

                        <td className="p-3 text-muted-foreground">
                          {row.initiatorName}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {row.authorisedBy || "—"}
                        </td>

                        <td className="p-3 text-muted-foreground">
                          {row?.icuApprovedBy || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatDate(row?.decidedAt) || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-40 truncate">
                          {row.reason || "—"}
                        </td>
                        <td className="p-3 text-muted-foreground max-w-40 truncate">
                          {row.rejectionComment ? (
                            <span
                              className="text-red-600 italic"
                              title={row.rejectionComment}
                            >
                              {row.rejectionComment}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>

                      {/* ── Expanded Detail Row ── */}
                      {isExpanded && (
                        <tr
                          key={`${row.id}-expanded`}
                          className="bg-muted/10 border-b"
                        >
                          <td colSpan={10} className="px-8 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {/* Submission Reason */}
                              <div>
                                <div className="mrpsl-section-title mb-1">
                                  Reason for Change
                                </div>
                                <p className="text-muted-foreground italic">
                                  {row?.reason || "No reason recorded."}
                                </p>
                              </div>

                              {/* Supporting Documents */}
                              <div>
                                <div className="mrpsl-section-title mb-2">
                                  Supporting Documents
                                </div>
                                {row?.supportingDocuments?.length === 0 ? (
                                  <p className="text-muted-foreground text-xs">
                                    No documents attached.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {row?.supportingDocuments?.map((doc, i) => (
                                      <button
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDocs(row);
                                        }}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-background hover:bg-muted text-xs font-medium transition-colors"
                                      >
                                        <FileText className="h-3.5 w-3.5 text-primary" />
                                        {doc.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </Card>

      <PaginationBar
        page={historyPage}
        total={historyTotal}
        totalPages={historyTotalPages}
        pageSize={historyPageSize}
        onPageChange={setHistoryPage}
        onPageSizeChange={(s) => {
          setHistoryPageSize(s);
          setHistoryPage(0);
        }}
      />

      {/* ── Document Viewer ── */}
      <DocumentViewer
        open={docViewerOpen}
        onOpenChange={setDocViewerOpen}
        documents={docViewerDocs}
        uploaderName={docViewerUploader}
        uploadedAt={docViewerDate}
      />
    </>
  );
}
