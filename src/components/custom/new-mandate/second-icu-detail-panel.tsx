"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  Search,
  Ban,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import {
  useDecideBatch,
  useExcludeShareholders,
} from "@/hooks/useMandatePaymentFlow";
import { BatchSummaryCards } from "./batch-summary-cards";
import { ShareholderTable } from "./shareholder-table";
import { IcuSignOffBanner } from "./icu-sign-off-banner";
import { downloadShareholdersCsv } from "./csv";

// 2nd ICU editable batch view (spec §6.6): search, bulk select/exclude, an
// Excluded Items sub-tab, and the final Reject / Send to MD decision — rendered
// in-place with a Back button (dense data, not a modal).
export function SecondIcuDetailPanel({
  batch,
  onBack,
}: {
  batch: MandateBatch;
  onBack: () => void;
}) {
  const { currentUser } = useStore();
  const excludeMutation = useExcludeShareholders();
  const decideMutation = useDecideBatch();

  const [subTab, setSubTab] = useState<"shareholders" | "excluded">(
    "shareholders",
  );
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludeReason, setExcludeReason] = useState("");
  const [comment, setComment] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return batch.shareholders;
    return batch.shareholders.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.bank.toLowerCase().includes(q) ||
        s.bvn.includes(q) ||
        s.newAccountNumber.includes(q),
    );
  }, [batch.shareholders, search]);

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
      },
      {
        onSuccess: (res) => {
          toast.success(
            `${count} shareholder(s) excluded and returned to the Review Queue.`,
          );
          setSelectedIds(new Set());
          setExcludeReason("");
          if (res.shareholders.length === 0) setSubTab("excluded");
        },
        onError: (err) => toast.error(err?.message || "Failed to exclude shareholders."),
      },
    );
  }

  function decide(decision: "APPROVE" | "REJECT") {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (decision === "REJECT" && !comment.trim()) {
      toast.error("Comment is required for rejection.");
      return;
    }
    decideMutation.mutate(
      {
        id: batch.id,
        stage: "ICU_2",
        decision,
        actor: currentUser.email,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "APPROVE"
              ? `Batch ${batch.batchRef} sent to MD for final approval.`
              : `Batch ${batch.batchRef} rejected.`,
          );
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
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
          2nd ICU Approval —{" "}
          <span className="font-mono text-base">{batch.batchRef}</span>
        </h2>
      </div>

      <IcuSignOffBanner ordinal="2nd" />
      <BatchSummaryCards batch={batch} showExcluded />

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <SubTab
          active={subTab === "shareholders"}
          onClick={() => setSubTab("shareholders")}
          label={`Shareholders (${batch.shareholders.length})`}
        />
        <SubTab
          active={subTab === "excluded"}
          onClick={() => setSubTab("excluded")}
          label={`Excluded Items (${batch.excluded.length})`}
        />
      </div>

      {subTab === "shareholders" ? (
        <>
          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, bank, BVN or account no…"
                className="pl-8 w-80 h-9 text-[13px]"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                downloadShareholdersCsv(
                  batch.shareholders,
                  `mandate_batch_${batch.batchRef.replace("/", "-")}.csv`,
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Download CSV
            </Button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-end gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl flex-wrap">
              <div className="flex-1 min-w-[220px] space-y-1.5">
                <label className="mrpsl-label mb-0">
                  {selectedIds.size} selected — reason for exclusion (optional)
                </label>
                <Input
                  value={excludeReason}
                  onChange={(e) => setExcludeReason(e.target.value)}
                  placeholder="e.g. BVN mismatch, duplicate mandate…"
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
            selectable
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            maxHeight="max-h-[520px]"
            emptyLabel={
              search
                ? "No shareholders match your search."
                : "All shareholders have been excluded from this batch."
            }
          />
        </>
      ) : (
        <ExcludedItemsTable batch={batch} />
      )}

      <div className="space-y-2">
        <label className="mrpsl-label">Comment</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Required when rejecting…"
          className="resize-none"
        />
      </div>

      <div className="flex gap-3 pt-3 border-t border-border/60">
        <Button
          variant="destructive"
          className="flex-1 gap-1.5"
          onClick={() => decide("REJECT")}
          disabled={decideMutation.isPending}
        >
          <X className="h-4 w-4" /> Reject
        </Button>
        <Button
          className="flex-1 gap-1.5"
          onClick={() => decide("APPROVE")}
          disabled={decideMutation.isPending || batch.shareholders.length === 0}
        >
          <Check className="h-4 w-4" /> Send to MD for Final Approval
          {decideMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </Button>
      </div>
    </div>
  );
}

function SubTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative h-9 px-4 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
        active
          ? "border-primary text-primary font-semibold"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ExcludedItemsTable({ batch }: { batch: MandateBatch }) {
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
      <table className="w-full text-left text-sm">
        <thead className="mrpsl-table-header sticky top-0 z-10 bg-muted">
          <tr>
            <th className="px-3 py-2">NAME</th>
            <th className="px-3 py-2">REGISTER</th>
            <th className="px-3 py-2">DIVIDEND NO</th>
            <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
            <th className="px-3 py-2">REASON</th>
          </tr>
        </thead>
        <tbody className="divide-y text-[13px]">
          {batch.excluded.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                No shareholders have been excluded from this batch.
              </td>
            </tr>
          ) : (
            batch.excluded.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2 font-semibold">{s.registerSymbol}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {s.dividendNumber}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {s.amount.toLocaleString()}.00
                </td>
                <td className="px-3 py-2 text-red-700">{s.excludedReason}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
