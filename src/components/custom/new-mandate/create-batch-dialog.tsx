"use client";

import { useMemo, useState } from "react";
import { Loader2, Layers, Search, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatNaira } from "./helpers";

const SOURCE_SHORT: Record<MandateSource, string> = {
  NIBSS: "NIBSS",
  CSCS: "CSCS",
  KYC: "KYC",
  MANUAL_PUSH: "Manual",
};

// Assembles a new cross-register batch (§4, §6.1). The admin scopes by register
// (and optionally dividend number); the system returns the eligible
// newly-mandated shareholders with outstanding dividends to preview before
// creating. Mock eligibility — see usePreviewEligibleBatch.
export function CreateBatchDialog({
  open,
  onOpenChange,
  dividendOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dividendOptions: string[];
}) {
  const { currentUser } = useStore();
  const previewMutation = usePreviewEligibleBatch();
  const createMutation = useCreateBatch();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dividend, setDividend] = useState("");
  const [preview, setPreview] = useState<MandateShareholder[] | null>(null);

  function reset() {
    setSelected(new Set());
    setDividend("");
    setPreview(null);
  }

  // Any change to the scope invalidates a stale preview.
  function toggle(symbol: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
    setPreview(null);
  }

  const summary = useMemo(() => {
    if (!preview) return null;
    const total = preview.reduce((s, r) => s + r.amount, 0);
    const bySource = preview.reduce<Record<string, number>>((acc, r) => {
      acc[r.source] = (acc[r.source] ?? 0) + 1;
      return acc;
    }, {});
    const registers = new Set(preview.map((r) => r.registerSymbol)).size;
    return { count: preview.length, total, bySource, registers };
  }, [preview]);

  function handleFind() {
    if (selected.size === 0) {
      toast.error("Select at least one register to draw shareholders from.");
      return;
    }
    previewMutation.mutate(
      {
        registerSymbols: Array.from(selected),
        dividendNumber: dividend || undefined,
      },
      {
        onSuccess: (rows) => setPreview(rows),
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
          reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to create batch."),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Create New Mandate Batch
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Scope by register (batches are cross-register by design). The system
            pools newly-mandated shareholders — approved via NIBSS, CSCS, KYC or
            Manual Push — who have outstanding dividends. Preview the eligible set
            before creating.
          </p>

          {/* Registers */}
          <div className="space-y-2">
            <label className="mrpsl-label">Registers</label>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_REGISTERS.map((r) => (
                <button
                  key={r.symbol}
                  type="button"
                  onClick={() => toggle(r.symbol)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors ${
                    selected.has(r.symbol)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <Checkbox checked={selected.has(r.symbol)} />
                  <span className="font-semibold">{r.symbol}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dividend number (optional scope) */}
          <div className="space-y-2">
            <label className="mrpsl-label">
              Dividend Number{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Select
              value={dividend || "ALL"}
              onValueChange={(v) => {
                setDividend(!v || v === "ALL" ? "" : v);
                setPreview(null);
              }}
            >
              <SelectTrigger className="w-full mrpsl-input">
                <SelectValue placeholder="All Dividend Numbers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Dividend Numbers</SelectItem>
                {dividendOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Find eligible */}
          <Button
            variant="outline"
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

          {/* Preview */}
          {summary &&
            (summary.count === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800">
                No eligible shareholders found in the selected register(s)
                {dividend ? ` for ${dividend}` : ""}. Adjust the scope and try
                again.
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  {summary.count.toLocaleString()} eligible shareholder
                  {summary.count !== 1 ? "s" : ""} · {summary.registers} register
                  {summary.registers !== 1 ? "s" : ""}
                </div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Total outstanding</span>
                  <span className="font-bold tabular-nums text-green-700">
                    {formatNaira(summary.total)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
                  {(Object.keys(summary.bySource) as MandateSource[]).map(
                    (src) => (
                      <span
                        key={src}
                        className="text-[12px] rounded-md bg-background border px-2 py-0.5"
                      >
                        {SOURCE_SHORT[src]}{" "}
                        <span className="font-semibold">
                          {summary.bySource[src]}
                        </span>
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))}

          <div className="flex gap-3 pt-2 border-t border-border/60">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !summary ||
                summary.count === 0
              }
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Confirm &amp; Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
