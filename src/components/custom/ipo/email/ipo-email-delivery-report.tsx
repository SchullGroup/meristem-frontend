"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIpoEmailLogs, useIpoEmailSummary } from "@/hooks/useIPO";
import type { IpoEmailLog } from "@/types/ipo";

const POLL_MS = 5000;

type Filter = "ALL" | "QUEUED" | "SENT" | "FAILED";
const FILTERS: Filter[] = ["ALL", "QUEUED", "SENT", "FAILED"];

function fmt(ts: string | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function StatusBadge({ status }: { status: IpoEmailLog["status"] }) {
  const map: Record<IpoEmailLog["status"], string> = {
    QUEUED: "bg-amber-100 text-amber-800",
    SENT: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-700",
  };
  return <Badge className={cn("border-0 text-[11px]", map[status])}>{status}</Badge>;
}

export default function IpoEmailDeliveryReport({ batchRef }: { batchRef: string }) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const { data: summary, refetch: refetchSummary, isFetching: summaryFetching } =
    useIpoEmailSummary(batchRef, POLL_MS);
  const { data: logs, refetch: refetchLogs, isLoading } = useIpoEmailLogs(
    batchRef,
    { status: filter === "ALL" ? undefined : filter },
    POLL_MS,
  );

  const rows = logs ?? [];

  const cards = [
    { label: "Total", value: summary?.total ?? 0, color: "text-foreground" },
    { label: "In Queue", value: summary?.queued ?? 0, color: "text-amber-600" },
    { label: "Sent", value: summary?.sent ?? 0, color: "text-green-700" },
    { label: "Failed / Not Sent", value: summary?.failed ?? 0, color: "text-red-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="mrpsl-card p-4">
            <div className="mrpsl-section-title">{c.label}</div>
            <div className={cn("text-2xl font-bold tabular mt-1", c.color)}>{c.value}</div>
          </Card>
        ))}
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-border flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => {
              refetchSummary();
              refetchLogs();
            }}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", summaryFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">RECIPIENT</th>
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
                <th className="text-left px-4 py-2.5 font-medium">QUEUED</th>
                <th className="text-left px-4 py-2.5 font-medium">SENT</th>
                <th className="text-left px-4 py-2.5 font-medium">ERROR</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No emails {filter === "ALL" ? "sent yet" : `in "${filter.toLowerCase()}"`} for this batch.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-[12px]">{r.recipientEmail}</td>
                    <td className="px-4 py-2.5">{r.recipientName ?? "—"}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{fmt(r.sentAt)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-red-600 max-w-xs truncate" title={r.errorMessage ?? ""}>
                      {r.errorMessage ?? "—"}
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
