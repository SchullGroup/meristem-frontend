"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { formatNumber } from "@/lib/utils/format";
import { ResolutionDesk } from "./resolution-desk";
import { useReconFlagged } from "@/hooks/useReconciliation";
import type { ReconFlaggedItem } from "@/actions/reconciliationActions";

function fmtDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : format(d, "dd MMM yyyy");
}

interface UpdateReconciliationProps {
  batchRef?: string;
}

export default function UpdateReconciliation({ batchRef }: UpdateReconciliationProps) {
  // Pull a wide page of flagged shortfalls and group by batch client-side.
  const { data, isLoading, isError, error } = useReconFlagged({ pageSize: 500 });
  const items = useMemo(() => data?.data ?? [], [data]);

  const [view, setView] = useState<"batches" | "transactions">(batchRef ? "transactions" : "batches");
  const [activeBatchRef, setActiveBatchRef] = useState<string | null>(batchRef ?? null);
  const [selected, setSelected] = useState<ReconFlaggedItem | null>(null);

  const [search, setSearch] = useState("");
  const [register, setRegister] = useState("");
  const [status, setStatus] = useState<"" | "PENDING" | "RESOLVED">("");

  const batches = useMemo(() => {
    const map = new Map<string, { batchRef: string; date: string | null; registers: string[]; items: ReconFlaggedItem[] }>();
    for (const it of items) {
      if (!map.has(it.batchRef)) map.set(it.batchRef, { batchRef: it.batchRef, date: it.transactionDate, registers: [], items: [] });
      const b = map.get(it.batchRef)!;
      b.items.push(it);
      if (it.registerSymbol && !b.registers.includes(it.registerSymbol)) b.registers.push(it.registerSymbol);
    }
    return Array.from(map.values());
  }, [items]);

  const registerOptions = useMemo(
    () => Array.from(new Set(items.filter((i) => i.batchRef === activeBatchRef).map((i) => i.registerSymbol))),
    [items, activeBatchRef],
  );

  // ── Resolution desk ──
  if (selected) {
    return (
      <ResolutionDesk
        chn={selected.chn}
        register={selected.registerSymbol}
        holderName={selected.holderName ?? selected.chn}
        backLabel="Back to Pending List"
        onBack={() => setSelected(null)}
        onSaved={() => setSelected(null)}
        context={{
          flaggedItemId: selected.id,
          attemptedSell: selected.attemptedSell,
          holdingsAtFlag: selected.holdingsAtFlag,
          shortfall: selected.shortfall,
          transactionDate: selected.transactionDate,
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading flagged transactions…
      </div>
    );
  }
  if (isError) {
    return <div className="py-16 text-center text-red-600 text-sm">{(error as Error)?.message ?? "Failed to load flagged transactions."}</div>;
  }

  // ── Batch list ──
  if (view === "batches") {
    return (
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CSCS Reconciliation Batches</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3 text-left font-medium">BATCH REF</th>
                <th className="px-4 py-3 text-left font-medium">DATE</th>
                <th className="px-4 py-3 text-left font-medium">REGISTERS</th>
                <th className="px-4 py-3 text-right font-medium">FLAGGED TXNS</th>
                <th className="px-4 py-3 text-left font-medium">RESOLUTION STATUS</th>
                <th className="px-4 py-3 text-right font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {batches.map((batch) => {
                const allResolved = batch.items.every((i) => i.status === "RESOLVED");
                const pendingCount = batch.items.filter((i) => i.status === "PENDING").length;
                return (
                  <tr key={batch.batchRef} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{batch.batchRef}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{fmtDate(batch.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {batch.registers.map((r) => (
                          <Badge key={r} className="border-0 text-[11px] bg-gray-100 text-gray-800">{r}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{batch.items.length}</td>
                    <td className="px-4 py-3">
                      {allResolved ? (
                        <Badge className="border-0 text-[11px] bg-green-100 text-green-800">Resolved</Badge>
                      ) : (
                        <Badge className="border-0 text-[11px] bg-amber-100 text-amber-800">{pendingCount} Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => { setActiveBatchRef(batch.batchRef); setView("transactions"); setSearch(""); setRegister(""); setStatus(""); }}>
                        Open Batch <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {batches.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">No flagged transactions. Oversell shortfalls from processed CSCS batches will appear here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // ── Transaction list (batch opened) ──
  const batchItems = items.filter((i) => i.batchRef === activeBatchRef);
  const filtered = batchItems.filter((r) => {
    if (register && r.registerSymbol !== register) return false;
    if (status && r.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.chn.toLowerCase().includes(q) && !(r.holderName ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const pendingInBatch = batchItems.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => { setView("batches"); setActiveBatchRef(null); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Batches
        </Button>
        <div className="h-4 w-px bg-border" />
        <p className="text-sm font-mono font-medium text-muted-foreground">{activeBatchRef}</p>
      </div>

      {pendingInBatch > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800"><strong>{pendingInBatch}</strong> flagged transaction{pendingInBatch !== 1 ? "s" : ""} awaiting resolution</span>
        </div>
      )}

      <div className="grid grid-cols-[2fr_1fr_1fr] w-2/3 gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search CHN or holder name…" className="mrpsl-input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={register} onValueChange={(v) => setRegister(v === "__all" ? "" : (v ?? ""))}>
          <SelectTrigger className="w-40 mrpsl-input"><SelectValue placeholder="All Registers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Registers</SelectItem>
            {registerOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(((v as string) === "__all" ? "" : v) as "" | "PENDING" | "RESOLVED")}>
          <SelectTrigger className="w-36 mrpsl-input"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">HOLDER NAME</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">TRANSACTION DATE</th>
                <th className="px-4 py-3 text-right">ATTEMPTED SELL</th>
                <th className="px-4 py-3 text-right">HOLDINGS AT FLAG</th>
                <th className="px-4 py-3 text-right">SHORTFALL</th>
                <th className="px-4 py-3">RESOLUTION STATUS</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((row) => (
                <tr key={row.id} className="mrpsl-table-row">
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{row.chn}</td>
                  <td className="px-4 py-3 font-medium text-sm">{row.holderName ?? "—"}</td>
                  <td className="px-4 py-3"><Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">{row.registerSymbol}</Badge></td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{fmtDate(row.transactionDate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600 font-semibold">{formatNumber(row.attemptedSell ?? 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">{formatNumber(row.holdingsAtFlag ?? 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-amber-600 font-semibold">{formatNumber(row.shortfall ?? 0)}</td>
                  <td className="px-4 py-3">
                    {row.status === "PENDING" ? (
                      <Badge className="border-0 text-[12px] bg-amber-100 text-amber-800">Pending</Badge>
                    ) : (
                      <Badge className="border-0 text-[12px] bg-green-100 text-green-800">Resolved</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant={row.status === "PENDING" ? "default" : "outline"} onClick={() => setSelected(row)}>
                      {row.status === "PENDING" ? "Resolve" : "View"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">No transactions match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
