"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useListRightsReturnBatches,
  useHodActionRightsBatch,
} from "@/hooks/useRights";
import { downloadRightsBatchExport } from "@/actions/rightsActions";

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

export function RightsHodApproval({ declarationId }: { declarationId?: string }) {
  const { currentUser } = useStore();
  const { data: batches, isLoading } = useListRightsReturnBatches(declarationId);
  const action = useHodActionRightsBatch();

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to review batches awaiting HoD approval.
      </Card>
    );
  }

  const submitted = (batches ?? []).filter((b) => b.status === "SUBMITTED");
  const decided = (batches ?? []).filter((b) => b.status === "APPROVED" || b.status === "REJECTED");

  function decide(batchId: number, approve: boolean) {
    if (!declarationId) return;
    action.mutate(
      { id: declarationId, batchId, approve, actor: currentUser?.email },
      {
        onSuccess: () => toast.success(approve ? "Batch approved." : "Batch rejected."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  async function download(batchId: number, ref: string) {
    if (!declarationId) return;
    try {
      const blob = await downloadRightsBatchExport(declarationId, batchId);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ref}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">HoD Approval</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Review the returns batches forwarded for approval, download the detail, and approve or reject.
        </p>
      </div>

      {isLoading ? (
        <Card className="mrpsl-card p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></Card>
      ) : submitted.length === 0 ? (
        <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">No batches awaiting approval.</Card>
      ) : (
        submitted.map((b) => (
          <Card key={b.id} className="mrpsl-card p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm flex-1">
                <div>
                  <p className="mrpsl-label">Batch</p>
                  <p className="font-mono font-semibold mt-0.5">{b.batchReference}</p>
                </div>
                <div>
                  <p className="mrpsl-label">Receiving Agent</p>
                  <p className="font-medium mt-0.5">{b.receivingAgentName ?? "—"}</p>
                </div>
                <div>
                  <p className="mrpsl-label">Batch Date</p>
                  <p className="mt-0.5">{fmtDate(b.batchDate)}</p>
                </div>
                <div>
                  <p className="mrpsl-label">Returns</p>
                  <p className="font-mono font-semibold mt-0.5">{b.returnCount}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => download(b.id, b.batchReference)}>
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                disabled={action.isPending} onClick={() => decide(b.id, false)}>
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button size="sm" className="gap-1.5" disabled={action.isPending} onClick={() => decide(b.id, true)}>
                {action.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
              </Button>
            </div>
          </Card>
        ))
      )}

      {decided.length > 0 && (
        <Card className="mrpsl-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><p className="mrpsl-section-title">Decided Batches</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">BATCH</th>
                  <th className="text-left px-4 py-2.5 font-medium">AGENT</th>
                  <th className="text-right px-4 py-2.5 font-medium">RETURNS</th>
                  <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-2.5 font-mono text-xs">{b.batchReference}</td>
                    <td className="px-4 py-2.5">{b.receivingAgentName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{b.returnCount}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`border-0 text-[11px] ${b.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
