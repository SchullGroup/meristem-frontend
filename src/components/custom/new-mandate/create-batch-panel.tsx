"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Loader2,
  Users,
  Layers,
  Ban,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type {
  MandateShareholder,
  MandateSource,
} from "@/types/mandate-payment-flow";
import { MOCK_REGISTERS } from "./seed-data";
import {
  useCreateBatch,
  usePreviewEligibleBatch,
} from "@/hooks/useMandatePaymentFlow";
import { SOURCE_SHORT, formatNaira, sourceBadgeClass } from "./helpers";
import { ShareholderTable } from "./shareholder-table";
import { AddShareholderDialog } from "./add-shareholder-dialog";
import { BatchEditHint } from "./batch-edit-hint";

// Create New Mandate Batch — in-place two-pane sub-screen. Left: searchable
// register scope. Right: the eligible newly-mandated shareholders (NIBSS / CSCS
// / KYC / Manual Push) with outstanding dividends, previewed before creating.
export function CreateBatchPanel({ onBack }: { onBack: () => void }) {
  const { currentUser } = useStore();
  const previewMutation = usePreviewEligibleBatch();
  const createMutation = useCreateBatch();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<MandateShareholder[] | null>(null);

  // Editing the previewed (not-yet-created) shareholder list.
  const [shSearch, setShSearch] = useState("");
  const [shSelected, setShSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  const filteredRegisters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_REGISTERS;
    return MOCK_REGISTERS.filter(
      (r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.registerName.toLowerCase().includes(q),
    );
  }, [search]);

  // Any scope change invalidates a stale preview.
  function toggle(symbol: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
    setPreview(null);
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredRegisters.forEach((r) => next.add(r.symbol));
      return next;
    });
    setPreview(null);
  }

  function clearAll() {
    setSelected(new Set());
    setPreview(null);
  }

  const summary = useMemo(() => {
    if (!preview) return null;
    const total = preview.reduce((s, r) => s + r.amount, 0);
    const bySource = preview.reduce<Partial<Record<MandateSource, number>>>(
      (acc, r) => {
        acc[r.source] = (acc[r.source] ?? 0) + 1;
        return acc;
      },
      {},
    );
    const registers = new Set(preview.map((r) => r.registerSymbol)).size;
    return { count: preview.length, total, bySource, registers };
  }, [preview]);

  const filteredPreview = useMemo(() => {
    const list = preview ?? [];
    const q = shSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.oldAccountNumber.toLowerCase().includes(q) ||
        s.newAccountNumber.includes(q) ||
        s.bank.toLowerCase().includes(q) ||
        s.bvn.includes(q),
    );
  }, [preview, shSearch]);

  function shToggle(id: string) {
    setShSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function shToggleAll() {
    const allShown = filteredPreview.every((s) => shSelected.has(s.id));
    setShSelected((prev) => {
      const next = new Set(prev);
      if (allShown) filteredPreview.forEach((s) => next.delete(s.id));
      else filteredPreview.forEach((s) => next.add(s.id));
      return next;
    });
  }

  // Exclude before creating — just drop from the preview; nothing is persisted,
  // so the dividend simply stays outstanding.
  function handleExcludeLocal() {
    if (shSelected.size === 0) return;
    const n = shSelected.size;
    setPreview((prev) => (prev ?? []).filter((s) => !shSelected.has(s.id)));
    setShSelected(new Set());
    toast.success(
      `${n} shareholder(s) removed — their dividends remain outstanding.`,
    );
  }

  function handleAddLocal(rows: MandateShareholder[]) {
    setPreview((prev) => {
      const existing = prev ?? [];
      const ids = new Set(existing.map((s) => s.id));
      return [...existing, ...rows.filter((r) => !ids.has(r.id))];
    });
    setAddOpen(false);
    toast.success(`${rows.length} shareholder(s) added.`);
  }

  function handleFind() {
    if (selected.size === 0) {
      toast.error("Select at least one register to draw shareholders from.");
      return;
    }
    previewMutation.mutate(
      { registerSymbols: Array.from(selected) },
      {
        onSuccess: (rows) => {
          setPreview(rows);
          setShSelected(new Set());
          setShSearch("");
        },
        onError: (err) =>
          toast.error(err?.message || "Failed to load eligible shareholders."),
      },
    );
  }

  function handleCreate() {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (!preview || preview.length === 0) return;
    createMutation.mutate(
      { shareholders: preview, initiatedBy: currentUser.email },
      {
        onSuccess: (batch) => {
          toast.success(
            `Batch ${batch.batchRef} created with ${preview.length} shareholders.`,
          );
          onBack();
        },
        onError: (err) =>
          toast.error(err?.message || "Failed to create batch."),
      },
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Review Queue
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Create New Mandate Batch
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Scope by register (batches are cross-register). The system pools
            newly-mandated shareholders — approved via NIBSS, CSCS, KYC or
            Manual Push — with outstanding dividends. Preview before creating.
          </p>
        </div>
        <Button
          className="gap-1.5 shrink-0"
          onClick={handleCreate}
          disabled={createMutation.isPending || !summary || summary.count === 0}
        >
          {createMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Create Batch
          {summary && summary.count > 0 ? ` (${summary.count})` : ""}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* ── Left: register scope ── */}
        <Card className="mrpsl-card p-0 overflow-hidden lg:col-span-1 flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/20">
            <span className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
              Registers
            </span>
            {selected.size > 0 && (
              <span className="text-[12px] font-semibold text-primary">
                {selected.size} selected
              </span>
            )}
          </div>

          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search registers…"
                className="pl-8 h-9 text-[13px]"
              />
            </div>
            <div className="flex items-center gap-3 mt-2 text-[12px]">
              <button
                className="text-primary hover:underline"
                onClick={selectAllFiltered}
              >
                Select all{search ? " (filtered)" : ""}
              </button>
              <button
                className="text-muted-foreground hover:underline"
                onClick={clearAll}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Find sits above the list so it stays reachable when the list is long */}
          <div className="p-3 border-b bg-muted/10">
            <Button
              className="w-full gap-1.5"
              onClick={handleFind}
              disabled={previewMutation.isPending || selected.size === 0}
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Find Eligible Shareholders
            </Button>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y">
            {filteredRegisters.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-muted-foreground">
                No registers match “{search}”.
              </div>
            ) : (
              filteredRegisters.map((r) => (
                <button
                  key={r.symbol}
                  type="button"
                  onClick={() => toggle(r.symbol)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selected.has(r.symbol)
                      ? "bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <Checkbox checked={selected.has(r.symbol)} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold">{r.symbol}</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {r.registerName}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* ── Right: eligible shareholders ── */}
        <div className="lg:col-span-3">
          {previewMutation.isPending ? (
            <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Checking eligibility…</p>
            </Card>
          ) : !summary ? (
            <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center gap-3">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground max-w-xs">
                Select one or more registers on the left, then{" "}
                <span className="font-medium text-foreground">
                  Find Eligible Shareholders
                </span>{" "}
                to preview who will be in this batch.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {summary && summary.count > 0 && (
                <Card className="mrpsl-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Users className="h-4 w-4 text-primary" />
                      {summary.count.toLocaleString()} shareholder
                      {summary.count !== 1 ? "s" : ""} · {summary.registers}{" "}
                      register{summary.registers !== 1 ? "s" : ""}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Total outstanding{" "}
                      </span>
                      <span className="font-bold tabular-nums text-green-700">
                        {formatNaira(summary.total)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                    {(Object.keys(summary.bySource) as MandateSource[]).map(
                      (src) => (
                        <Badge
                          key={src}
                          className={`border-0 text-[12px] ${sourceBadgeClass(src)}`}
                        >
                          {SOURCE_SHORT[src]} {summary.bySource[src]}
                        </Badge>
                      ),
                    )}
                  </div>
                </Card>
              )}

              {/* Search the previewed list + manually add more shareholders */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={shSearch}
                    onChange={(e) => setShSearch(e.target.value)}
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

              <BatchEditHint />

              {shSelected.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-medium text-primary">
                    {shSelected.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={handleExcludeLocal}
                  >
                    <Ban className="h-4 w-4" /> Exclude Selected
                  </Button>
                </div>
              )}

              <ShareholderTable
                shareholders={filteredPreview}
                showSource
                selectable
                selectedIds={shSelected}
                onToggle={shToggle}
                onToggleAll={shToggleAll}
                maxHeight="max-h-[440px]"
                emptyLabel={
                  shSearch
                    ? "No shareholders match your search."
                    : "No shareholders yet — add some, or adjust the register scope and Find again."
                }
              />
            </div>
          )}
        </div>
      </div>

      <AddShareholderDialog
        existingIds={(preview ?? []).map((s) => s.id)}
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAddLocal}
      />
    </div>
  );
}
