"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useListRightsReturns,
  useListRightsReturnBatches,
  useDeleteRightsReturn,
  useForwardRightsBatchToHod,
} from "@/hooks/useRights";

interface Row {
  id: number;
  holderName?: string | null;
  chn?: string | null;
  batchId?: number | null;
  batchReference?: string | null;
  agentName?: string | null;
  txType?: string | null;
  category?: string | null;
  status?: string | null;
  additionalSharesApplied?: number | null;
  totalAmountPaid?: number | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  ACCEPTED: "bg-green-100 text-green-800",
  ADDITIONAL: "bg-blue-100 text-blue-800",
  TRADED: "bg-purple-100 text-purple-800",
  UNMATCHED: "bg-red-100 text-red-700",
};

export function RightsPreviewReal({ declarationId }: { declarationId?: string }) {
  const { currentUser } = useStore();
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListRightsReturns(declarationId, { size: 1000 });
  const { data: batches } = useListRightsReturnBatches(declarationId);
  const del = useDeleteRightsReturn();
  const forward = useForwardRightsBatchToHod();

  const rows = useMemo(() => {
    const allRows: Row[] = data?.data?.content ?? [];
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (batchFilter !== "ALL" && String(r.batchId ?? "") !== batchFilter) return false;
      if (!q) return true;
      return (
        (r.holderName ?? "").toLowerCase().includes(q) ||
        (r.chn ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, batchFilter, search]);

  const selectedBatch = (batches ?? []).find((b) => String(b.id) === batchFilter);
  const canForward = !!selectedBatch && selectedBatch.status === "OPEN";

  function handleDelete(returnId: number) {
    if (!declarationId) return;
    del.mutate(
      { id: declarationId, returnId },
      { onSuccess: () => toast.success("Return deleted."), onError: (e) => toast.error((e as Error).message) },
    );
  }

  function handleForward() {
    if (!declarationId || !selectedBatch) return;
    forward.mutate(
      { id: declarationId, batchId: selectedBatch.id, submittedBy: currentUser?.email },
      {
        onSuccess: () => toast.success(`${selectedBatch.batchReference} forwarded to HoD.`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to preview captured rights.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5 w-64">
          <label className="mrpsl-label">Filter by Batch</label>
          <Select value={batchFilter} onValueChange={(v) => setBatchFilter(v ?? "ALL")}>
            <SelectTrigger className="mrpsl-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All batches</SelectItem>
              {(batches ?? []).map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.batchReference} — {b.receivingAgentName ?? ""} ({b.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-52">
          <label className="mrpsl-label">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="mrpsl-input pl-9" placeholder="Holder name or CHN" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <Button className="gap-2" disabled={!canForward || forward.isPending} onClick={handleForward}>
          {forward.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Forward to HoD
        </Button>
      </div>
      {selectedBatch && !canForward && (
        <p className="text-xs text-muted-foreground">
          Batch {selectedBatch.batchReference} is {selectedBatch.status.toLowerCase()} — only OPEN batches can be forwarded.
        </p>
      )}

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">#</th>
                <th className="text-left px-4 py-2.5 font-medium">HOLDER</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">BATCH</th>
                <th className="text-left px-4 py-2.5 font-medium">TYPE</th>
                <th className="text-right px-4 py-2.5 font-medium">ADD. SHARES</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT (₦)</th>
                <th className="text-left px-4 py-2.5 font-medium">CATEGORY</th>
                <th className="text-right px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No captured rights match.</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5">{r.holderName ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.chn ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.batchReference ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.txType ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.additionalSharesApplied != null ? Number(r.additionalSharesApplied).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.totalAmountPaid != null ? Number(r.totalAmountPaid).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5">
                      {r.category ? (
                        <Badge className={`border-0 text-[11px] ${CATEGORY_COLORS[r.category] ?? "bg-gray-100 text-gray-700"}`}>{r.category}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{r.status ?? "PENDING"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={del.isPending}
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete return"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
