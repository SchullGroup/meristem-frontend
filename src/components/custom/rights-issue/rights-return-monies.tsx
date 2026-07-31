"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useRightsRefundSubscribers, useQueueRightsRefunds } from "@/hooks/useRights";
import { downloadRightsRefunds } from "@/actions/rightsActions";
import type { RightsRefundRecord } from "@/actions/rightsActions";

const STATUS_COLORS: Record<string, string> = {
  RETURN_MONIES_QUEUE: "bg-amber-100 text-amber-800",
  QUEUED: "bg-blue-100 text-blue-800",
  NO_REFUND_DUE: "bg-gray-100 text-gray-600",
};

export function RightsReturnMonies({ declarationId }: { declarationId?: string }) {
  const { currentUser } = useStore();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useRightsRefundSubscribers(declarationId, { size: 500 });
  const queue = useQueueRightsRefunds();

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to review return monies.
      </Card>
    );
  }

  const rows: RightsRefundRecord[] = data?.data?.content ?? [];
  const queueable = rows.filter((r) => r.status === "RETURN_MONIES_QUEUE");
  const totalRefund = rows.reduce((s, r) => s + (r.refundAmount ?? 0), 0);

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  function handleQueue() {
    const ids = selected.size > 0 ? [...selected] : queueable.map((r) => r.id);
    if (ids.length === 0) { toast.error("No eligible refunds to queue."); return; }
    queue.mutate(
      { id: declarationId!, subscriberIds: ids, queuedBy: currentUser?.email },
      {
        onSuccess: () => { toast.success(`${ids.length} refund(s) sent for return-money processing.`); setSelected(new Set()); },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadRightsRefunds(declarationId!);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rights_return_monies_${declarationId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold">Return Monies</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Additional rights taken up but not allotted — sent for return-money processing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={downloading} onClick={handleDownload}>
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download CSV
          </Button>
          <Button size="sm" className="gap-1.5" disabled={queue.isPending || queueable.length === 0} onClick={handleQueue}>
            {queue.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send {selected.size > 0 ? `${selected.size} Selected` : "All Eligible"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="mrpsl-card p-3"><p className="mrpsl-label">Refund Records</p><p className="font-mono font-semibold text-lg mt-1">{rows.length}</p></Card>
        <Card className="mrpsl-card p-3"><p className="mrpsl-label">Eligible to Queue</p><p className="font-mono font-semibold text-lg mt-1 text-amber-600">{queueable.length}</p></Card>
        <Card className="mrpsl-card p-3"><p className="mrpsl-label">Total Refund (₦)</p><p className="font-mono font-semibold text-lg mt-1 text-primary">₦{totalRefund.toLocaleString()}</p></Card>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground sticky top-0">
              <tr>
                <th className="px-4 py-2.5 w-8"></th>
                <th className="text-left px-4 py-2.5 font-medium">ACCOUNT</th>
                <th className="text-left px-4 py-2.5 font-medium">HOLDER</th>
                <th className="text-right px-4 py-2.5 font-medium">APPLIED (₦)</th>
                <th className="text-right px-4 py-2.5 font-medium">ALLOTTED (₦)</th>
                <th className="text-right px-4 py-2.5 font-medium">REFUND (₦)</th>
                <th className="text-left px-4 py-2.5 font-medium">REASON</th>
                <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No return monies — nothing over-applied or reversed.</td></tr>
              ) : (
                rows.map((r) => {
                  const eligible = r.status === "RETURN_MONIES_QUEUE";
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <input type="checkbox" disabled={!eligible} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo ?? "—"}</td>
                      <td className="px-4 py-2.5">{r.holderName ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{Number(r.amountApplied ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{Number(r.amountAllotted ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">{Number(r.refundAmount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.reason ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={`border-0 text-[11px] ${STATUS_COLORS[r.status ?? ""] ?? "bg-gray-100 text-gray-700"}`}>
                          {(r.status ?? "").replace(/_/g, " ") || "—"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
