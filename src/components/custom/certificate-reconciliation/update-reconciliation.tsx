"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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

// ── Seeded flagged transactions — aligned with Step 4 FLAGGED rows ─────────
// These are the 4 rows that didn't balance in BATCH-CSCS-20260707_143022.
// - attemptedSell  = totalSells from the batch
// - holdingsAtFlag = originalUnits + totalBuys (what the app showed)
// - shortfall      = abs(balanceAfter) when negative

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
];

const REGISTERS = ["DANGCEM", "MTNN", "SEPLAT", "UBA"];

interface UpdateReconciliationProps {
  batchRef?: string;
}

export default function UpdateReconciliation({
  batchRef,
}: UpdateReconciliationProps) {
  const [items, setItems] = useState<FlaggedItem[]>(SEED_FLAGGED);
  const [search, setSearch] = useState(batchRef ?? "");
  const [register, setRegister] = useState("");
  const [status, setStatus] = useState<"" | "PENDING" | "RESOLVED">("");
  const [selected, setSelected] = useState<FlaggedItem | null>(null);

  const filtered = items.filter((r) => {
    if (register && r.register !== register) return false;
    if (status && r.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.chn.toLowerCase().includes(q) &&
        !r.holderName.toLowerCase().includes(q) &&
        !r.batchRef.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const pendingCount = items.filter((i) => i.status === "PENDING").length;

  const handleResolved = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "RESOLVED" } : i)),
    );
    setSelected(null);
  };

  // ── Resolution workspace ──────────────────────────────────────────────────
  if (selected) {
    return (
      <ResolutionWorkspace
        item={selected}
        onBack={() => setSelected(null)}
        onResolved={() => handleResolved(selected.id)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-sm font-medium text-amber-800">
          <strong>{pendingCount}</strong> flagged transaction
          {pendingCount !== 1 ? "s" : ""} awaiting resolution
        </span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-[2fr_1fr_1fr] w-2/3 gap-2 items-center">
        <div className="relative w-full">
          <Input
            placeholder="Search CHN, holder, batch ref…"
            className="pl-9 mrpsl-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                <th className="px-4 py-3">BATCH REF</th>
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
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                    {row.batchRef}
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
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground text-sm"
                  >
                    No flagged transactions match your filters.
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
