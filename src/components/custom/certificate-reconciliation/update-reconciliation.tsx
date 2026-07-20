"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/utils/format";
import { ResolutionWorkspace } from "./reconciliation-review";

export interface FlaggedItem {
  id: string;
  batchRef: string;
  chn: string;
  holderName: string;
  register: string;
  transactionDate: string;
  attemptedSell: number;
  holdingsAtFlag: number;
  shortfall: number;
  status: "PENDING" | "RESOLVED";
}

export const SEED_FLAGGED: FlaggedItem[] = [
  {
    id: "1",
    batchRef: "BATCH-CSCS-20260707_143022",
    chn: "C0023456BK",
    holderName: "NGOZI CHIDINMA OKAFOR",
    register: "DANGCEM",
    transactionDate: "07 Jul 2026",
    attemptedSell: 13500,
    holdingsAtFlag: 12500,
    shortfall: 1000,
    status: "PENDING",
  },
  {
    id: "2",
    batchRef: "BATCH-CSCS-20260707_143022",
    chn: "C0045678DK",
    holderName: "FATIMA ABUBAKAR MUSA",
    register: "MTNN",
    transactionDate: "07 Jul 2026",
    attemptedSell: 9500,
    holdingsAtFlag: 8000,
    shortfall: 1500,
    status: "PENDING",
  },
  {
    id: "3",
    batchRef: "BATCH-CSCS-20260707_143022",
    chn: "C0067890FK",
    holderName: "AMAKA NGOZI OKONKWO",
    register: "SEPLAT",
    transactionDate: "07 Jul 2026",
    attemptedSell: 36000,
    holdingsAtFlag: 35700,
    shortfall: 300,
    status: "PENDING",
  },
  {
    id: "4",
    batchRef: "BATCH-CSCS-20260707_143022",
    chn: "C0089012HK",
    holderName: "BLESSING CHISOM NWOSU",
    register: "UBA",
    transactionDate: "07 Jul 2026",
    attemptedSell: 48000,
    holdingsAtFlag: 45000,
    shortfall: 3000,
    status: "PENDING",
  },
  {
    id: "5",
    batchRef: "BATCH-CSCS-20260710_091045",
    chn: "C0011223AK",
    holderName: "TUNDE ADEWALE BAKARE",
    register: "DANGCEM",
    transactionDate: "10 Jul 2026",
    attemptedSell: 7500,
    holdingsAtFlag: 6000,
    shortfall: 1500,
    status: "RESOLVED",
  },
  {
    id: "6",
    batchRef: "BATCH-CSCS-20260710_091045",
    chn: "C0033445CK",
    holderName: "HALIMA MOHAMMED BELLO",
    register: "MTNN",
    transactionDate: "10 Jul 2026",
    attemptedSell: 22000,
    holdingsAtFlag: 20000,
    shortfall: 2000,
    status: "PENDING",
  },
];

const REGISTERS = ["DANGCEM", "MTNN", "SEPLAT", "UBA"];

interface BatchSummary {
  batchRef: string;
  date: string;
  registers: string[];
  items: FlaggedItem[];
}

function deriveBatches(items: FlaggedItem[]): BatchSummary[] {
  const map = new Map<string, BatchSummary>();
  for (const item of items) {
    if (!map.has(item.batchRef)) {
      map.set(item.batchRef, {
        batchRef: item.batchRef,
        date: item.transactionDate,
        registers: [],
        items: [],
      });
    }
    const batch = map.get(item.batchRef)!;
    batch.items.push(item);
    if (!batch.registers.includes(item.register)) {
      batch.registers.push(item.register);
    }
  }
  return Array.from(map.values());
}

interface UpdateReconciliationProps {
  batchRef?: string;
}

export default function UpdateReconciliation({ batchRef }: UpdateReconciliationProps) {
  const [items, setItems] = useState<FlaggedItem[]>(SEED_FLAGGED);
  const [view, setView] = useState<"batches" | "transactions">(
    batchRef ? "transactions" : "batches",
  );
  const [activeBatchRef, setActiveBatchRef] = useState<string | null>(
    batchRef ?? null,
  );
  const [selected, setSelected] = useState<FlaggedItem | null>(null);
  const [historyLoadedIds, setHistoryLoadedIds] = useState<Set<string>>(
    new Set(),
  );

  // Transaction list filters
  const [search, setSearch] = useState("");
  const [register, setRegister] = useState("");
  const [status, setStatus] = useState<"" | "PENDING" | "RESOLVED">("");

  const batches = deriveBatches(items);

  const handleOpenBatch = (bRef: string) => {
    setActiveBatchRef(bRef);
    setView("transactions");
    setSearch("");
    setRegister("");
    setStatus("");
  };

  const handleBackToBatches = () => {
    setView("batches");
    setActiveBatchRef(null);
    setSelected(null);
  };

  const handleResolved = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "RESOLVED" } : i)),
    );
    setSelected(null);
  };

  const handleHistoryLoaded = (id: string) => {
    setHistoryLoadedIds((prev) => new Set([...prev, id]));
  };

  // ── Resolution workspace ──────────────────────────────────────────────────
  if (selected) {
    return (
      <ResolutionWorkspace
        item={selected}
        onBack={() => setSelected(null)}
        onResolved={() => handleResolved(selected.id)}
        skipPullHistory={historyLoadedIds.has(selected.id)}
        onHistoryLoaded={handleHistoryLoaded}
      />
    );
  }

  // ── Batch list ────────────────────────────────────────────────────────────
  if (view === "batches") {
    return (
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            CSCS Reconciliation Batches
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3 text-left font-medium">BATCH REF</th>
                <th className="px-4 py-3 text-left font-medium">DATE</th>
                <th className="px-4 py-3 text-left font-medium">REGISTERS</th>
                <th className="px-4 py-3 text-right font-medium">TRANSACTIONS</th>
                <th className="px-4 py-3 text-left font-medium">RESOLUTION STATUS</th>
                <th className="px-4 py-3 text-right font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {batches.map((batch) => {
                const allResolved = batch.items.every(
                  (i) => i.status === "RESOLVED",
                );
                const pendingCount = batch.items.filter(
                  (i) => i.status === "PENDING",
                ).length;
                return (
                  <tr key={batch.batchRef} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                      {batch.batchRef}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {batch.date}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {batch.registers.map((r) => (
                          <Badge
                            key={r}
                            className="border-0 text-[11px] bg-gray-100 text-gray-800"
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {batch.items.length}
                    </td>
                    <td className="px-4 py-3">
                      {allResolved ? (
                        <Badge className="border-0 text-[11px] bg-green-100 text-green-800">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge className="border-0 text-[11px] bg-amber-100 text-amber-800">
                          {pendingCount} Pending
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleOpenBatch(batch.batchRef)}
                      >
                        Open Batch
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // ── Transaction list ──────────────────────────────────────────────────────
  const batchItems = items.filter((i) => i.batchRef === activeBatchRef);
  const filtered = batchItems.filter((r) => {
    if (register && r.register !== register) return false;
    if (status && r.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.chn.toLowerCase().includes(q) &&
        !r.holderName.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
  const pendingInBatch = batchItems.filter((i) => i.status === "PENDING").length;

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToBatches}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Batches
        </Button>
        <div className="h-4 w-px bg-border" />
        <p className="text-sm font-mono font-medium text-muted-foreground">
          {activeBatchRef}
        </p>
      </div>

      {/* Banner */}
      {pendingInBatch > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800">
            <strong>{pendingInBatch}</strong> flagged transaction
            {pendingInBatch !== 1 ? "s" : ""} awaiting resolution
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-[2fr_1fr_1fr] w-2/3 gap-2 items-center">
        <Input
          placeholder="Search CHN or holder name…"
          className="mrpsl-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={register} onValueChange={(v) => setRegister(v ?? "")}>
          <SelectTrigger className="w-40 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Registers</SelectItem>
            {REGISTERS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as "" | "PENDING" | "RESOLVED")}
        >
          <SelectTrigger className="w-36 mrpsl-input">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                    {row.chn}
                  </td>
                  <td className="px-4 py-3 font-medium text-sm">
                    {row.holderName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">
                      {row.register}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {row.transactionDate}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-red-600 font-semibold">
                    {formatNumber(row.attemptedSell)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">
                    {formatNumber(row.holdingsAtFlag)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-amber-600 font-semibold">
                    {formatNumber(row.shortfall)}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === "PENDING" ? (
                      <Badge className="border-0 text-[12px] bg-amber-100 text-amber-800">
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="border-0 text-[12px] bg-green-100 text-green-800">
                        Resolved
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "PENDING" ? (
                      <Button size="sm" onClick={() => setSelected(row)}>
                        Resolve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(row)}
                      >
                        View
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-muted-foreground text-sm"
                  >
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
