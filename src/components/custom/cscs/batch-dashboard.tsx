"use client";

import { useState } from "react";
import {
  FolderOpen,
  Loader2,
  Plus,
  RefreshCw,
  UploadCloud,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { WorkspaceBatch } from "./batch-workspace";
import { formatNumber } from "@/lib/utils/format";

// ── Types ──────────────────────────────────────────────────────────────────
type BatchStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "PROCESSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

interface MockBatch {
  batchRef: string;
  uploadedBy: string;
  uploadedAt: string;
  processedBy: string | null;
  processedAt: string | null;
  status: BatchStatus;
  registers: string[];
  totalRecords: number;
  totalTransactions: number;
}

// ── Seeded mock batches ────────────────────────────────────────────────────
const SEED_BATCHES: MockBatch[] = [
  {
    batchRef: "BATCH-CSCS-20260707_143022",
    uploadedBy: "Abiola Kolawole",
    uploadedAt: "07 Jul 2026, 14:30",
    processedBy: "Abiola Kolawole",
    processedAt: "07 Jul 2026, 14:35",
    status: "COMPLETED",
    registers: ["DANGCEM", "MTNN", "SEPLAT", "UBA"],
    totalRecords: 1279,
    totalTransactions: 10088,
  },
  {
    batchRef: "BATCH-CSCS-20260706_091545",
    uploadedBy: "Abiola Kolawole",
    uploadedAt: "06 Jul 2026, 09:15",
    processedBy: "Abiola Kolawole",
    processedAt: "06 Jul 2026, 09:22",
    status: "PROCESSED",
    registers: ["DANGCEM", "MTNN", "SEPLAT", "UBA"],
    totalRecords: 1314,
    totalTransactions: 9741,
  },
  {
    batchRef: "BATCH-CSCS-20260705_161200",
    uploadedBy: "Chidi Nwachukwu",
    uploadedAt: "05 Jul 2026, 16:12",
    processedBy: null,
    processedAt: null,
    status: "PROCESSING",
    registers: ["DANGCEM", "MTNN"],
    totalRecords: 0,
    totalTransactions: 0,
  },
  {
    batchRef: "BATCH-CSCS-20260704_110033",
    uploadedBy: "Chidi Nwachukwu",
    uploadedAt: "04 Jul 2026, 11:00",
    processedBy: null,
    processedAt: null,
    status: "UPLOADED",
    registers: [],
    totalRecords: 0,
    totalTransactions: 0,
  },
  {
    batchRef: "BATCH-CSCS-20260703_082145",
    uploadedBy: "Abiola Kolawole",
    uploadedAt: "03 Jul 2026, 08:21",
    processedBy: "Abiola Kolawole",
    processedAt: "03 Jul 2026, 08:29",
    status: "IN_PROGRESS",
    registers: ["DANGCEM", "MTNN", "SEPLAT", "UBA"],
    totalRecords: 1122,
    totalTransactions: 8830,
  },
  {
    batchRef: "BATCH-CSCS-20260702_094500",
    uploadedBy: "Chidi Nwachukwu",
    uploadedAt: "02 Jul 2026, 09:45",
    processedBy: null,
    processedAt: null,
    status: "FAILED",
    registers: [],
    totalRecords: 0,
    totalTransactions: 0,
  },
  {
    batchRef: "BATCH-CSCS-20260701_155155",
    uploadedBy: "Abiola Kolawole",
    uploadedAt: "01 Jul 2026, 15:51",
    processedBy: "Abiola Kolawole",
    processedAt: "01 Jul 2026, 16:00",
    status: "COMPLETED",
    registers: ["DANGCEM", "MTNN", "SEPLAT", "UBA"],
    totalRecords: 1340,
    totalTransactions: 10221,
  },
];

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_CHIPS: { label: string; value: BatchStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Uploaded", value: "UPLOADED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Processed", value: "PROCESSED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

function statusBadge(status: BatchStatus) {
  const map: Record<BatchStatus, string> = {
    UPLOADED: "bg-blue-100   text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    PROCESSED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100  text-green-800",
    FAILED: "bg-red-100    text-red-800",
  };
  const label: Record<BatchStatus, string> = {
    UPLOADED: "Uploaded",
    PROCESSING: "Processing",
    PROCESSED: "Processed",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };
  return (
    <Badge className={`border-0 text-[12px] ${map[status]}`}>
      {label[status]}
    </Badge>
  );
}

// ── Upload modal (mock) ────────────────────────────────────────────────────
function UploadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      onClose();
    }, 1800);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold leading-tight">
            Upload New Batch
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1">
            Upload a ZIP file containing all register files for this batch.
          </p>
        </div>

        {/* Body */}
        {uploading ? (
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
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile();
              }}
            >
              <input
                id="zip-upload"
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFile}
              />
              <UploadCloud
                className={`h-12 w-12 mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground/30"}`}
              />
              <p className="font-semibold text-base">
                Upload Master Data ZIP (All Registers)
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Drag &amp; drop or click —{" "}
                <span className="font-mono text-[13px]">.zip</span> only
              </p>
              <p className="text-[13px] text-muted-foreground/50 mt-2">
                Contains master file + transaction file for all active registers
              </p>
            </label>
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-800">
                Uploading <strong>stores the ZIP only</strong> — no extraction
                or parsing occurs until you click <strong>Process Batch</strong>{" "}
                on the dashboard.
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
  const [statusFilter, setStatusFilter] = useState<BatchStatus | "">("");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [batches, setBatches] = useState<MockBatch[]>(SEED_BATCHES);

  const filtered = batches.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (search && !b.batchRef.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleProcess = (batch: MockBatch) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.batchRef === batch.batchRef
          ? { ...b, status: "PROCESSING" as BatchStatus }
          : b,
      ),
    );
    setTimeout(() => {
      setBatches((prev) =>
        prev.map((b) =>
          b.batchRef === batch.batchRef
            ? {
                ...b,
                status: "PROCESSED" as BatchStatus,
                processedBy: "Abiola Kolawole",
                processedAt: "07 Jul 2026",
                registers: ["DANGCEM", "MTNN", "SEPLAT", "UBA"],
                totalRecords: 1279,
                totalTransactions: 10088,
              }
            : b,
        ),
      );
    }, 2500);
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
                onClick={() => { setStatusFilter(chip.value as BatchStatus | ""); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border cursor-pointer
                  ${
                    statusFilter === chip.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                  }`}
              >
                {chip.label}
                {chip.value && (
                  <span className="ml-1.5 text-[11px] opacity-70">
                    {batches.filter((b) => b.status === chip.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-75">
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
                  <th className="px-4 py-3">REGISTERS</th>
                  <th className="px-4 py-3 text-right">RECORDS</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginated.map((batch) => (
                  <tr key={batch.batchRef} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold">
                      {batch.batchRef}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {batch.uploadedBy}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {batch.uploadedAt}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {batch.processedBy ?? (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {batch.processedAt ?? (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {batch.registers.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {batch.registers.map((r) => (
                            <Badge
                              key={r}
                              className="border-0 text-[11px] bg-gray-100 text-gray-700"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-[13px]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-[13px]">
                      {batch.totalRecords > 0 ? (
                        formatNumber(batch.totalRecords)
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(batch.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {batch.status === "UPLOADED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcess(batch)}
                        >
                          Process Batch
                        </Button>
                      )}
                      {batch.status === "PROCESSING" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="gap-1.5"
                        >
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Processing…
                        </Button>
                      )}
                      {(batch.status === "PROCESSED" ||
                        batch.status === "IN_PROGRESS" ||
                        batch.status === "COMPLETED") && (
                        <Button
                          size="sm"
                          onClick={() =>
                            onOpenBatch({
                              batchRef: batch.batchRef,
                              status: batch.status,
                            })
                          }
                        >
                          <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                          Open Batch
                        </Button>
                      )}
                      {batch.status === "FAILED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleProcess(batch)}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-muted-foreground text-sm"
                    >
                      No batches match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={currentPage - 1}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p + 1)}
            onPageSizeChange={(s) => setPageSize(s)}
            pageBase={0}
          />
        </Card>
      </div>
    </>
  );
}
