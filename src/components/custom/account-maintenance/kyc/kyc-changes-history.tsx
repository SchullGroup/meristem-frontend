"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, FileText, History, Eye } from "lucide-react";
import { useGetKycChanges } from "@/hooks/useAccountMaintenance";
import { KycChange } from "@/types/account-maintenance";
import { PaginationBar } from "@/components/custom/pagination-bar";
import StatusBadge from "@/components/custom/status-badge";
import RegisterSelect from "@/components/custom/register-select";
import { formatDate } from "@/lib/utils/format";
import { EntitlementTableSkeleton } from "@/components/custom/rights-issue/loaders";
import { DataErrorState } from "@/components/custom/ipo/loaders";
import {
  DocumentViewer,
  parseDocumentUrls,
} from "@/components/custom/document-viewer";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_OPTIONS = ["All", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

// ── Dummy reason / evidence fallback ────────────────────────────────────────
// GET /accounts/kyc-changes doesn't populate `reason` or `supportingDocuments`
// yet, even though every real KYC change is submitted with both. Stand in
// with plausible placeholders grounded in the row's own fields, clearly
// labeled as preview data, until the backend returns the real values.
// Documents point at a real static image asset (recognized by DocumentViewer
// as an "image" type) so opening the preview renders something in-app,
// rather than a broken/unknown-type fallback.

function buildDummyReason(row: KycChange): string {
  if (row.changeType === "BULK") {
    return "Submitted via bulk KYC upload batch — shareholder-provided change, reviewed against uploaded evidence.";
  }
  const field = row.fieldChanged || "this record";
  return `Shareholder requested an update to ${field}${
    row.oldValue ? ` (previously "${row.oldValue}")` : ""
  }, submitted with supporting evidence for registrar review.`;
}

const MOCK_DOC_ASSET = "/logow.png";

function buildDummyDocuments(row: KycChange): { name: string; url: string }[] {
  const withAsset = (names: string[]) =>
    names.map((name) => ({ name, url: MOCK_DOC_ASSET }));

  if (row.changeType === "BANK") {
    return withAsset(["Bank Statement", "Signature Specimen"]);
  }
  if (row.changeType === "BULK") {
    return withAsset(["Bulk Upload Evidence"]);
  }
  return withAsset(["Means of Identification", "Utility Bill"]);
}

export function KycChangesHistory() {
  // ── Filters ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [registerFilter, setRegisterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // ── Detail / document viewer ─────────────────────────────────────────────
  const [detailRow, setDetailRow] = useState<KycChange | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerDocs, setDocViewerDocs] = useState<
    ReturnType<typeof parseDocumentUrls>
  >([]);
  const [docViewerUploader, setDocViewerUploader] = useState("");
  const [docViewerDate, setDocViewerDate] = useState("");

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useGetKycChanges({
    q: debouncedSearch.trim() || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    registerId: registerFilter || undefined,
    page,
    pageSize,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function openDetail(row: KycChange) {
    setDetailRow(row);
    setDetailOpen(true);
  }

  function openDocViewer(row: KycChange) {
    setDocViewerDocs(row.supportingDocuments);
    setDocViewerUploader(row.initiatorName || "");
    setDocViewerDate(row.createdAt || "");
    setDocViewerOpen(true);
  }

  function openDummyDocViewer(row: KycChange) {
    setDocViewerDocs(buildDummyDocuments(row));
    setDocViewerUploader(row.initiatorName || "");
    setDocViewerDate(row.createdAt || "");
    setDocViewerOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <label className="mrpsl-label">Search</label>
            <Search className="absolute left-3 top-1/2 translate-y-[3px] h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="mrpsl-input pl-9"
              placeholder="Account no, name, BVN, NIN or CHN…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <RegisterSelect
            label="Register"
            value={registerFilter}
            onChange={(v) => {
              setRegisterFilter(v);
              setPage(0);
            }}
          />

          <div>
            <label htmlFor="status-filter" className="mrpsl-label">
              Status
            </label>
            <Select
              name="status-filter"
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v || "All");
                setPage(0);
              }}
            >
              <SelectTrigger className="mrpsl-input w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "All" ? "All Statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      {isLoading ? (
        <EntitlementTableSkeleton />
      ) : isError ? (
        <DataErrorState
          message="Failed to load KYC change history."
          onRetry={refetch}
        />
      ) : (
        <>
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">SHAREHOLDER</th>
                    <th className="p-3">CHANGE TYPE</th>
                    <th className="p-3">CHANGE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">WORKFLOW</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center text-muted-foreground"
                      >
                        <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No KYC changes found</p>
                        <p className="text-xs mt-1">
                          No records match your filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="mrpsl-table-row align-top">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {row.holderName || "—"}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {row.accountNumber}
                            {row.registerSymbol
                              ? ` · ${row.registerSymbol}`
                              : ""}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">
                            {row.changeType}
                          </Badge>
                        </td>
                        <td className="p-3 max-w-64">
                          <div className="font-medium text-[12px] mb-1">
                            {row.fieldChanged}
                          </div>
                          <div
                            className="text-[11px] text-muted-foreground font-mono truncate"
                            title={row.oldValue}
                          >
                            Old: {row.oldValue || "—"}
                          </div>
                          <div
                            className="text-[11px] text-primary font-mono font-semibold truncate"
                            title={row.newValue}
                          >
                            New: {row.newValue || "—"}
                          </div>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="p-3 text-[12px] whitespace-nowrap">
                          <div className="text-muted-foreground">
                            Submitted:{" "}
                            <span className="font-medium text-foreground">
                              {row.initiatorName || "—"}
                            </span>
                            {row.createdAt && ` (${formatDate(row.createdAt)})`}
                          </div>
                          {row.authorisedBy && (
                            <div className="text-muted-foreground mt-0.5">
                              Decided:{" "}
                              <span className="font-medium text-foreground">
                                {row.authorisedBy}
                              </span>
                              {row.decidedAt &&
                                ` (${formatDate(row.decidedAt)})`}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => openDetail(row)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <PaginationBar
            page={page}
            total={total}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(0);
            }}
          />
        </>
      )}

      {/* ── Read-only detail dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg overflow-y-auto max-h-125">
          <DialogHeader>
            <DialogTitle>KYC Change Detail</DialogTitle>
          </DialogHeader>
          {detailRow && (
            <div className="space-y-4 p-4 text-sm">
              <div className="bg-muted/30 border rounded-xl p-4 space-y-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="mrpsl-section-title">Account Number</div>
                  <div className="font-mono mt-0.5">
                    {detailRow.accountNumber}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Shareholder</div>
                  <div className="font-medium mt-0.5">
                    {detailRow.holderName}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Register</div>
                  <div className="font-mono mt-0.5">
                    {detailRow.registerSymbol || "—"}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Change</div>
                  <div className="mt-0.5">
                    <span className="font-semibold">
                      {detailRow.fieldChanged}
                    </span>
                    {" — "}
                    <span className="line-through text-muted-foreground font-mono">
                      {detailRow.oldValue || "N/A"}
                    </span>
                    {" → "}
                    <span className="text-primary font-mono font-semibold">
                      {detailRow.newValue}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Submission Reason</div>
                  <div className="mt-0.5 text-muted-foreground italic">
                    {detailRow.reason || buildDummyReason(detailRow)}
                  </div>
                  {!detailRow.reason && (
                    <div className="text-[10px] text-amber-600 mt-1">
                      Preview data — pending backend integration
                    </div>
                  )}
                </div>
                {detailRow.status === "REJECTED" &&
                  detailRow.rejectionComment && (
                    <div>
                      <div className="mrpsl-section-title">
                        Rejection Reason
                      </div>
                      <div className="mt-0.5 text-destructive">
                        {detailRow.rejectionComment}
                      </div>
                    </div>
                  )}
              </div>

              <div className="border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={detailRow.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted by</span>
                  <span className="font-medium">
                    {detailRow.initiatorName || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted at</span>
                  <span className="font-mono text-[12px]">
                    {formatDate(detailRow.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Decided by</span>
                  <span className="font-medium">
                    {detailRow.authorisedBy || "—"}
                  </span>
                </div>
                {detailRow.decidedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Decided at</span>
                    <span className="font-mono text-[12px]">
                      {formatDate(detailRow.decidedAt)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="mrpsl-section-title mb-1.5">
                  Supporting Documents
                </div>
                {detailRow.supportingDocuments?.length > 0 ? (
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => openDocViewer(detailRow)}
                  >
                    <FileText className="h-4 w-4" />
                    View {detailRow.supportingDocuments.length} Document
                    {detailRow.supportingDocuments.length !== 1 ? "s" : ""}
                  </Button>
                ) : (
                  <div className="space-y-1.5">
                    <Button
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => openDummyDocViewer(detailRow)}
                    >
                      <FileText className="h-4 w-4" />
                      View {buildDummyDocuments(detailRow).length} Document
                      {buildDummyDocuments(detailRow).length !== 1 ? "s" : ""}
                    </Button>
                    <div className="text-[10px] text-amber-600">
                      Preview data — pending backend integration
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Document Viewer ── */}
      <DocumentViewer
        open={docViewerOpen}
        onOpenChange={setDocViewerOpen}
        documents={docViewerDocs}
        uploaderName={docViewerUploader}
        uploadedAt={docViewerDate}
      />
    </div>
  );
}
