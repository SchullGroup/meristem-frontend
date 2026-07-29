"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import { useReversalRequests } from "@/hooks/useDividendReversalFlow";
import { MOCK_REGISTERS } from "./seed-data";
import {
  REVERSAL_TYPE_SHORT,
  formatDate,
  formatNaira,
  reversalStatusBadgeClass,
  reversalTypeBadgeClass,
} from "./helpers";
import { ReversalDetailModal } from "./reversal-detail-modal";
import { downloadReversalsCsv } from "./csv";

export function HistoryTab() {
  const { data: rows = [], isLoading } = useReversalRequests({
    status: ["APPROVED", "REJECTED"],
  });

  const [type, setType] = useState("");
  const [decision, setDecision] = useState("");
  const [register, setRegister] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selected, setSelected] = useState<ReversalRequest | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (type && r.reversalType !== type) return false;
        if (decision && r.status !== decision) return false;
        if (register && r.registerSymbol !== register) return false;
        if (dateRange?.from) {
          const d = new Date(r.dateRequested);
          if (d < dateRange.from) return false;
          if (dateRange.to && d > dateRange.to) return false;
        }
        return true;
      }),
    [rows, type, decision, register, dateRange],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap justify-between">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex flex-col">
            <label className="mrpsl-label">Reversal Type</label>
            <Select
              value={type || "ALL"}
              onValueChange={(v) => setType(!v || v === "ALL" ? "" : v)}
            >
              <SelectTrigger className="w-40 mrpsl-input">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="TYPE_A">Type A</SelectItem>
                <SelectItem value="TYPE_B">Type B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="mrpsl-label">Decision</label>
            <Select
              value={decision || "ALL"}
              onValueChange={(v) => setDecision(!v || v === "ALL" ? "" : v)}
            >
              <SelectTrigger className="w-40 mrpsl-input">
                <SelectValue placeholder="All Decisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Decisions</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="mrpsl-label">Register</label>
            <Select
              value={register || "ALL"}
              onValueChange={(v) => setRegister(!v || v === "ALL" ? "" : v)}
            >
              <SelectTrigger className="w-44 mrpsl-input">
                <SelectValue placeholder="All Registers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Registers</SelectItem>
                {MOCK_REGISTERS.map((r) => (
                  <SelectItem key={r.symbol} value={r.symbol}>
                    {r.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="mrpsl-label">Date Range</label>
            <DateRangePicker
              className="mt-0"
              date={dateRange}
              setDate={setDateRange}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            downloadReversalsCsv(filtered, "dividend_reversals_history.csv", true);
            toast.success("Reversal history exported as CSV.");
          }}
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">HOLDER NAME</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">ACCOUNT NO</th>
                <th className="px-4 py-3">DIVIDEND NO</th>
                <th className="px-4 py-3 text-center">TYPE</th>
                <th className="px-4 py-3 text-right">AMOUNT (₦)</th>
                <th className="px-4 py-3">REQUESTED BY</th>
                <th className="px-4 py-3 text-center">DECISION</th>
                <th className="px-4 py-3">DECIDED BY</th>
                <th className="px-4 py-3">DECISION DATE</th>
                <th className="px-4 py-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No reversal history matches your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-medium">{r.holderName}</td>
                    <td className="px-4 py-3 font-semibold">
                      {r.registerSymbol}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px]">
                      {r.accountNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                      {r.dividendNumber}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={`border-0 text-[12px] ${reversalTypeBadgeClass(r.reversalType)}`}
                      >
                        {REVERSAL_TYPE_SHORT[r.reversalType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatNaira(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {r.requestedBy}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={`border-0 text-[12px] ${reversalStatusBadgeClass(r.status)}`}
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {r.decidedBy ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(r.decisionDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(r);
                          setOpen(true);
                        }}
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

      <ReversalDetailModal
        request={selected}
        open={open}
        onOpenChange={setOpen}
        title="Reversal (History)"
      />
    </div>
  );
}
