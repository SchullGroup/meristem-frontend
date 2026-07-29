"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Download, Search, Ban, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type {
  MandateBatch,
  MandateShareholder,
} from "@/types/mandate-payment-flow";
import {
  useAddShareholdersToBatch,
  useExcludeShareholders,
} from "@/hooks/useMandatePaymentFlow";
import { BatchSummaryCards } from "./batch-summary-cards";
import { ShareholderTable } from "./shareholder-table";
import { AddShareholderDialog } from "./add-shareholder-dialog";
import { BatchEditHint } from "./batch-edit-hint";
import { downloadShareholdersCsv } from "./csv";

interface BatchDetailPanelProps {
  batch: MandateBatch;
  title: string;
  onBack: () => void;
  banner?: ReactNode;
  // Primary actions rendered in the header (e.g. the "Review & Decide" button
  // that opens the decision modal). The comment box lives in that modal, never
  // below the data tables.
  actions?: ReactNode;
  // Initiator editing (Review Queue / Pending Approval) — search, exclude and
  // manually add shareholders before the batch reaches ICU.
  editable?: boolean;
  editStage?: string;
}

// In-place batch review sub-screen (replaces the tab's list content with a Back
// button) — the dense summary cards + shareholder table are shown at full width
// rather than in a modal.
export function BatchDetailPanel({
  batch,
  title,
  onBack,
  banner,
  actions,
  editable = false,
  editStage = "Batch Creation",
}: BatchDetailPanelProps) {
  const { currentUser } = useStore();
  const excludeMutation = useExcludeShareholders();
  const addMutation = useAddShareholdersToBatch();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludeReason, setExcludeReason] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!editable) return batch.shareholders;
    const q = search.trim().toLowerCase();
    if (!q) return batch.shareholders;
    return batch.shareholders.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.oldAccountNumber.toLowerCase().includes(q) ||
        s.newAccountNumber.includes(q) ||
        s.bank.toLowerCase().includes(q) ||
        s.bvn.includes(q),
    );
  }, [editable, batch.shareholders, search]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const allShown = filtered.every((s) => selectedIds.has(s.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allShown) filtered.forEach((s) => next.delete(s.id));
      else filtered.forEach((s) => next.add(s.id));
      return next;
    });
  }

  function handleDownload() {
    downloadShareholdersCsv(
      batch.shareholders,
      `mandate_batch_${batch.batchRef.replace("/", "-")}.csv`,
    );
    toast.success("Shareholder list exported as CSV.");
  }

  function handleAdd(rows: MandateShareholder[]) {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    addMutation.mutate(
      {
        id: batch.id,
        shareholders: rows,
        actor: currentUser.email,
        stage: editStage,
      },
      {
        onSuccess: () => {
          toast.success(`${rows.length} shareholder(s) added to the batch.`);
          setAddOpen(false);
        },
        onError: (err) =>
          toast.error(err?.message || "Failed to add shareholders."),
      },
    );
  }

  function handleExclude() {
    if (selectedIds.size === 0) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    const count = selectedIds.size;
    excludeMutation.mutate(
      {
        id: batch.id,
        shareholderIds: Array.from(selectedIds),
        actor: currentUser.email,
        reason: excludeReason.trim() || undefined,
        stage: editStage,
      },
      {
        onSuccess: () => {
          toast.success(
            `${count} shareholder(s) excluded — their dividends remain outstanding and can be re-batched.`,
          );
          setSelectedIds(new Set());
          setExcludeReason("");
        },
        onError: (err) =>
          toast.error(err?.message || "Failed to exclude shareholders."),
      },
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to list
      </button>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold tracking-tight">
          {title} —{" "}
          <span className="font-mono text-base">{batch.batchRef}</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" /> Download CSV
          </Button>
          {actions}
        </div>
      </div>

      {banner}

      <BatchSummaryCards batch={batch} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="text-sm font-bold">
          Shareholders with Outstanding Dividends ({batch.shareholders.length})
        </h4>
        {editable && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, account, bank, BVN…"
                className="pl-8 w-72 h-9 text-[13px]"
              />
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setAddOpen(true)}
            >
              <UserPlus className="h-4 w-4" /> Add Shareholder
            </Button>
          </div>
        )}
      </div>

      {editable && <BatchEditHint />}

      {editable && selectedIds.size > 0 && (
        <div className="flex items-end gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl flex-wrap">
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <label className="mrpsl-label mb-0">
              {selectedIds.size} selected — reason for exclusion (optional)
            </label>
            <Input
              value={excludeReason}
              onChange={(e) => setExcludeReason(e.target.value)}
              placeholder="e.g. hold this shareholder for a later batch…"
              className="h-9 text-[13px] bg-background"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
            onClick={handleExclude}
            disabled={excludeMutation.isPending}
          >
            <Ban className="h-4 w-4" /> Exclude Selected
            {excludeMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </Button>
        </div>
      )}

      <ShareholderTable
        shareholders={filtered}
        selectable={editable}
        selectedIds={editable ? selectedIds : undefined}
        onToggle={toggle}
        onToggleAll={toggleAll}
        maxHeight="max-h-[520px]"
        emptyLabel={
          editable && search
            ? "No shareholders match your search."
            : "No shareholders in this batch."
        }
      />

      {editable && batch.excluded.length > 0 && (
        <p className="text-[13px] text-muted-foreground">
          {batch.excluded.length} shareholder(s) excluded from this batch so far
          — their dividends remain outstanding.
        </p>
      )}

      {editable && (
        <AddShareholderDialog
          existingIds={batch.shareholders.map((s) => s.id)}
          open={addOpen}
          onOpenChange={setAddOpen}
          onAdd={handleAdd}
          isAdding={addMutation.isPending}
        />
      )}
    </div>
  );
}
