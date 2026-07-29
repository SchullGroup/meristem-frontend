"use client";

import { useState } from "react";
import { Search, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MandateShareholder } from "@/types/mandate-payment-flow";
import { useSearchOutstandingShareholders } from "@/hooks/useMandatePaymentFlow";
import { SOURCE_SHORT, formatNaira, sourceBadgeClass } from "./helpers";

// Search outstanding-dividend shareholders and hand the chosen rows back via
// onAdd — the caller decides whether to append them to a persisted batch or a
// not-yet-created preview list.
export function AddShareholderDialog({
  existingIds,
  open,
  onOpenChange,
  onAdd,
  isAdding = false,
}: {
  existingIds: string[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (rows: MandateShareholder[]) => void;
  isAdding?: boolean;
}) {
  const searchMutation = useSearchOutstandingShareholders();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MandateShareholder[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset when opened.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setQuery("");
    setResults(null);
    setSelected(new Set());
  }
  if (!open && wasOpen) setWasOpen(false);

  function runSearch() {
    searchMutation.mutate(
      { query, excludeIds: existingIds },
      {
        onSuccess: (rows) => {
          setResults(rows);
          setSelected(new Set());
        },
        onError: (err) => toast.error(err?.message || "Search failed."),
      },
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd() {
    if (selected.size === 0) return;
    const chosen = (results ?? []).filter((r) => selected.has(r.id));
    onAdd(chosen);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Add Shareholders to Batch
          </DialogTitle>
          <DialogDescription>
            Search shareholders with outstanding dividends who aren&apos;t
            already in this batch, then add them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Search name, share account no, bank account no or BVN…"
                className="pl-8 h-9 text-[13px]"
              />
            </div>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={runSearch}
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {results === null ? (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-[13px] text-muted-foreground">
              Search to find outstanding-dividend shareholders to add.
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-border/60 p-8 text-center text-[13px] text-muted-foreground">
              No matching outstanding shareholders found.
            </div>
          ) : (
            <div className="border border-border/60 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header sticky top-0 z-10 bg-muted">
                  <tr>
                    <th className="px-3 py-2 w-10" />
                    <th className="px-3 py-2">NAME</th>
                    <th className="px-3 py-2">REGISTER</th>
                    <th className="px-3 py-2">SHARE ACCT NO</th>
                    <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
                    <th className="px-3 py-2 text-center">SOURCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {results.map((r) => (
                    <tr
                      key={r.id}
                      className={selected.has(r.id) ? "bg-primary/5" : ""}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggle(r.id)}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 font-semibold">
                        {r.registerSymbol}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {r.oldAccountNumber}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {formatNaira(r.amount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          className={`border-0 text-[11px] ${sourceBadgeClass(r.source)}`}
                        >
                          {SOURCE_SHORT[r.source]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center gap-3 pt-2 border-t border-border/60">
            <span className="text-[13px] text-muted-foreground">
              {selected.size > 0
                ? `${selected.size} selected`
                : "Select shareholders to add"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="gap-1.5"
                onClick={handleAdd}
                disabled={selected.size === 0 || isAdding}
              >
                {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
                <UserPlus className="h-4 w-4" /> Add
                {selected.size > 0 ? ` ${selected.size}` : ""}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
