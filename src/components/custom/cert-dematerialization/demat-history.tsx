"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, FileText, X } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { DematRequest, DematStatus } from "./demat-types";

const STATUS_LABEL: Record<DematStatus, string> = {
  PENDING_HOD: "Pending HOD",
  PENDING_COO: "Pending COO/CEO",
  PENDING_ICU: "Pending ICU",
  APPROVED:    "Approved",
  LODGED:      "Lodged",
  REJECTED:    "Rejected",
  DELODGED:    "Delodged",
};

const STATUS_CLASS: Record<DematStatus, string> = {
  PENDING_HOD: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  PENDING_COO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  PENDING_ICU: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  APPROVED:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  LODGED:      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  REJECTED:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DELODGED:    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const STATUS_OPTIONS: Array<{ value: DematStatus | "ALL"; label: string }> = [
  { value: "ALL",         label: "All Statuses" },
  { value: "PENDING_HOD", label: "Pending HOD" },
  { value: "PENDING_COO", label: "Pending COO/CEO" },
  { value: "PENDING_ICU", label: "Pending ICU" },
  { value: "APPROVED",    label: "Approved" },
  { value: "LODGED",      label: "Lodged" },
  { value: "REJECTED",    label: "Rejected" },
  { value: "DELODGED",    label: "Delodged" },
];

export function DematHistory({ requests }: { requests: DematRequest[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DematStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<DematRequest | null>(null);

  const filtered = requests.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.holderName.toLowerCase().includes(q) ||
      r.holderChn.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.certificateNos.some((c) => c.toLowerCase().includes(q)) ||
      r.registerSymbol.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <>
      <Card className="mrpsl-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="Search by holder, CHN, cert no, register…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v as DematStatus | "ALL") || "ALL")}
          >
            <SelectTrigger className="h-9 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground shrink-0">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="px-4 py-2.5 text-left font-medium">Req. ID</th>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-left font-medium">Holder</th>
                <th className="px-4 py-2.5 text-left font-medium">Register</th>
                <th className="px-4 py-2.5 text-left font-medium">Certificate(s)</th>
                <th className="px-4 py-2.5 text-right font-medium">Units</th>
                <th className="px-4 py-2.5 text-left font-medium">Stockbroker</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No records match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="mrpsl-table-row align-middle">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{r.id}</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{r.createdAt}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium leading-tight">{r.holderName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{r.holderChn}</p>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.registerSymbol}</td>
                    <td className="px-4 py-2.5">
                      {r.certificateNos.map((c) => (
                        <p key={c} className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                          {c}
                        </p>
                      ))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {formatNumber(r.totalUnits)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.stockbrokerName}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`text-[11px] border-0 ${STATUS_CLASS[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => setSelected(r)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg" showCloseButton={false}>
          <DialogTitle className="sr-only">Request Detail</DialogTitle>
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-lg font-bold font-mono">{selected?.id}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {selected && (
                    <Badge className={`text-xs border-0 ${STATUS_CLASS[selected.status]}`}>
                      {STATUS_LABEL[selected.status]}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{selected?.createdAt}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 -mt-1 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selected && (
            <div className="px-8 pb-6 space-y-5">
              {/* Holder */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="mrpsl-label mb-1">Holder</p>
                  <p className="text-sm font-medium">{selected.holderName}</p>
                </div>
                <div>
                  <p className="mrpsl-label mb-1">CHN</p>
                  <p className="text-sm font-mono">{selected.holderChn}</p>
                </div>
                <div>
                  <p className="mrpsl-label mb-1">Register</p>
                  <p className="text-sm font-mono font-medium">{selected.registerSymbol}</p>
                </div>
                <div>
                  <p className="mrpsl-label mb-1">Total Units</p>
                  <p className="text-sm font-semibold tabular-nums">{formatNumber(selected.totalUnits)}</p>
                </div>
                <div className="col-span-2">
                  <p className="mrpsl-label mb-1">Stockbroker</p>
                  <p className="text-sm">{selected.stockbrokerName}</p>
                </div>
              </div>

              {/* Certificates */}
              <div>
                <p className="mrpsl-label mb-2">Certificate(s)</p>
                <ul className="space-y-1">
                  {selected.certificateNos.map((c) => (
                    <li key={c} className="font-mono text-xs bg-muted/40 rounded-md px-3 py-2">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rejection note */}
              {selected.status === "REJECTED" && selected.rejectionComment && (
                <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300">
                  <p className="font-medium mb-0.5">Rejection Reason</p>
                  <p>{selected.rejectionComment}</p>
                </div>
              )}

              {/* Documents */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Demat Forms", files: selected.documents.dematForms },
                  { label: "Scanned Certs", files: selected.documents.scannedCerts },
                ].map(({ label, files }) => (
                  <div key={label}>
                    <p className="mrpsl-label mb-1.5">{label}</p>
                    <ul className="space-y-1">
                      {files.map((f) => (
                        <li key={f.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
