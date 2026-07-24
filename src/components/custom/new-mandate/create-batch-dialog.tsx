"use client";

import { useState } from "react";
import { Loader2, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { MOCK_REGISTERS } from "./seed-data";
import { useCreateBatch } from "@/hooks/useMandatePaymentFlow";

// Assembles a new cross-register batch of mandate-eligible shareholders (§4, §6.1).
export function CreateBatchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentUser } = useStore();
  const createMutation = useCreateBatch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [count, setCount] = useState("20");

  function toggle(symbol: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  function reset() {
    setSelected(new Set());
    setCount("20");
  }

  function handleCreate() {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one register to draw shareholders from.");
      return;
    }
    const n = Number(count);
    if (!n || n < 1) {
      toast.error("Enter a valid number of shareholders.");
      return;
    }
    createMutation.mutate(
      {
        registerSymbols: Array.from(selected),
        count: n,
        initiatedBy: currentUser.email,
      },
      {
        onSuccess: (batch) => {
          toast.success(`Batch ${batch.batchRef} created with ${n} shareholders.`);
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
            Batches are cross-register by design — pick every register whose
            mandate-eligible shareholders should be pooled into this batch.
          </p>

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

          <div className="space-y-2">
            <label className="mrpsl-label">
              Eligible Shareholders to Pool
            </label>
            <Input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-40"
            />
            <p className="text-[12px] text-muted-foreground">
              In production this count is driven by the automatic
              outstanding-dividend check across the selected registers.
            </p>
          </div>

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
              disabled={createMutation.isPending}
            >
              Create Batch
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
