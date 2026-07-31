"use client";

import { useMemo, useState } from "react";
import {
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  UploadCloud,
  AlertCircle,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { WorkspaceBatch } from "./batch-workspace";
import { formatNumber } from "@/lib/utils/format";
import {
  useCscsBatches,
  useUploadCscsBatch,
  useProcessCscsBatch,
} from "@/hooks/useCscsPipeline";
import type { CscsBatchStatus, CscsBatchListItem } from "@/actions/cscsPipelineActions";

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_CHIPS: { label: string; value: CscsBatchStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Uploaded", value: "UPLOADED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Processed", value: "PROCESSED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

function statusBadge(status: CscsBatchStatus) {
  const map: Record<CscsBatchStatus, string> = {
    UPLOADED: "bg-blue-100   text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    PROCESSED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100  text-green-800",
    FAILED: "bg-red-100    text-red-800",
  };
  const label: Record<CscsBatchStatus, string> = {
    UPLOADED: "Uploaded",
    PROCESSING: "Processing",
    PROCESSED: "Processed",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };
  return <Badge className={`border-0 text-[12px] ${map[status]}`}>{label[status]}</Badge>;
}

function fmtDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : format(d, "dd MMM yyyy, HH:mm");
}

// ── Upload modal (real) ──────────────────────────────────────────────────
function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const upload = useUploadCscsBatch();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Please upload a .zip archive.");
      return;
    }
    upload.mutate(
      { file },
      {
        onSuccess: (res) => {
          toast.success(`Batch ${res.batchRef} uploaded — click "Process Batch" to extract & parse.`);
          onClose();
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold leading-tight">Upload New Batch</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1">
            Upload a ZIP file containing all register files for this batch.
          </p>
        </div>

        {upload.isPending ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading ZIP file…</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <label
              htmlFor="zip-upload"
              className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-12 cursor-pointer transition-colors
                ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
            >
              <input
                id="zip-upload"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <UploadCloud className={`h-12 w-12 mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground/30"}`} />
              <p className="font-semibold text-base">Upload Master Data ZIP (All Registers)</p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Drag &amp; drop or click — <span className="font-mono text-[13px]">.zip</span> only
              </p>
              <p className="text-[13px] text-muted-foreground/50 mt-2">
                Contains master file + transaction file for all active registers
              </p>
            </label>
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-800">
                Uploading <strong>stores the ZIP only</strong> — no extraction or parsing occurs until
                you click <strong>Process Batch</strong> on the dashboard.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface BatchDashboardProps {
  onOpenBatch: (batch: WorkspaceBatch) => void;
}

export function BatchDashboard({ onOpenBatch }: BatchDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<CscsBatchStatus | "">("");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, error } = useCscsBatches(
    {
      status: statusFilter || undefined,
      q: search || undefined,
      page,
      pageSize,
    },
    // Poll while any batch is mid-processing so status flips land automatically.
    (query) => {
      const items = query.state.data?.data ?? [];
      return items.some((b) => b.status === "PROCESSING") ? 4000 : false;
    },
  );

  const batches = useMemo(() => data?.data ?? [], [data]);
  const total = data?.meta?.total ?? 0;

  const process = useProcessCscsBatch();
  const handleProcess = (batch: CscsBatchListItem) => {
    process.mutate(
      { batchRef: batch.batchRef },
      {
        onSuccess: () => toast.success(`Processing started for ${batch.batchRef}.`),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <div className="space-y-5">
        {/* Filter chips + upload button */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => { setStatusFilter(chip.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border cursor-pointer
                  ${statusFilter === chip.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"}`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-75">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batch ref…"
                className="pl-9 w-full mrpsl-input"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button size="xl" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Upload New Batch
            </Button>
          </div>
        </div>

        {/* Batch table */}
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">BATCH REF</th>
                  <th className="px-4 py-3">UPLOADED BY</th>
                  <th className="px-4 py-3">DATE UPLOADED</th>
                  <th className="px-4 py-3">PROCESSED BY</th>
                  <th className="px-4 py-3">DATE PROCESSED</th>
                  <th className="px-4 py-3 text-right">REGISTERS</th>
                  <th className="px-4 py-3 text-right">RECORDS</th>
                  <th className="px-4 py-3 text-right">FLAGGED</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading batches…
                    </td>
                  </tr>
                )}
                {isError && !isLoading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-red-600 text-sm">
                      {(error as Error)?.message ?? "Failed to load batches."}
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && batches.map((batch) => (
                  <tr key={batch.batchRef} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold">{batch.batchRef}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{batch.uploadedBy ?? "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {fmtDate(batch.uploadedAt) ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {batch.processedBy ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {fmtDate(batch.processedAt) ?? <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-[13px]">
                      {batch.registerCount > 0 ? batch.registerCount : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-[13px]">
                      {batch.totalKyc > 0 ? formatNumber(batch.totalKyc) : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-[13px]">
                      <span className={batch.flaggedCount > 0 ? "text-red-600 font-semibold" : "text-muted-foreground/40"}>
                        {batch.flaggedCount > 0 ? formatNumber(batch.flaggedCount) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(batch.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {(batch.status === "UPLOADED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={process.isPending}
                          onClick={() => handleProcess(batch)}
                        >
                          Process Batch
                        </Button>
                      )}
                      {batch.status === "PROCESSING" && (
                        <Button size="sm" variant="ghost" disabled className="gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Processing…
                        </Button>
                      )}
                      {(batch.status === "PROCESSED" ||
                        batch.status === "IN_PROGRESS" ||
                        batch.status === "COMPLETED") && (
                        <Button size="sm" onClick={() => onOpenBatch({ batchRef: batch.batchRef, status: batch.status })}>
                          <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                          Open Batch
                        </Button>
                      )}
                      {batch.status === "FAILED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={process.isPending}
                          onClick={() => handleProcess(batch)}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && !isError && batches.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      No batches match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={page - 1}
            total={total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p + 1)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            pageBase={0}
          />
        </Card>
      </div>
    </>
  );
}
