"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useBonusDeclarations, useApproveBonusDeclaration, useRejectBonusDeclaration } from "@/hooks/useBonus";
import { DOWNLOAD_BONUS_PRELIST } from "@/actions/bonusIssuesAction";

interface Decl {
  id: number | string;
  issueRef?: string;
  bonusName?: string;
  ratio?: string;
  totalShareholders?: number;
  totalBonusShares?: number;
  status?: string;
}

export function BonusDeclarationApproval() {
  const { data, isLoading } = useBonusDeclarations({ status: "PENDING_AUTH", pageSize: 200 });
  const approve = useApproveBonusDeclaration();
  const reject = useRejectBonusDeclaration();
  const [rejecting, setRejecting] = useState<Decl | null>(null);
  const [comment, setComment] = useState("");

  const rows: Decl[] = data?.data?.content ?? [];

  async function download(id: number | string, ref?: string) {
    try {
      const blob = await DOWNLOAD_BONUS_PRELIST(id);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${ref ?? "bonus_declaration"}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error((e as Error).message); }
  }

  function doApprove(id: number | string) {
    approve.mutate(
      { declarationId: id, payload: { decision: "APPROVED", comment: "" } },
      {
        onSuccess: () => toast.success("Declaration approved — forwarded to ICU."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function doReject() {
    if (!rejecting) return;
    if (!comment.trim()) { toast.error("Add a reason for rejection."); return; }
    reject.mutate(
      { declarationId: rejecting.id, payload: { decision: "REJECTED", comment } },
      {
        onSuccess: () => { toast.success("Declaration rejected."); setRejecting(null); setComment(""); },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Declarations Approval</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Computed bonus declarations awaiting approval. Review, download the pre-list, then approve to forward to ICU.
        </p>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">REF</th>
                <th className="text-left px-4 py-2.5 font-medium">BONUS ISSUE</th>
                <th className="text-left px-4 py-2.5 font-medium">RATIO</th>
                <th className="text-right px-4 py-2.5 font-medium">ELIGIBLE</th>
                <th className="text-right px-4 py-2.5 font-medium">BONUS SHARES</th>
                <th className="text-right px-4 py-2.5 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No declarations awaiting approval.</td></tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs">{d.issueRef ?? d.id}</td>
                    <td className="px-4 py-2.5">{d.bonusName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{d.ratio ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(d.totalShareholders ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(d.totalBonusShares ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => download(d.id, d.issueRef)}>
                          <Download className="h-3.5 w-3.5" /> CSV
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejecting(d)}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button size="sm" className="gap-1.5" disabled={approve.isPending} onClick={() => doApprove(d.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject {rejecting?.issueRef}</DialogTitle></DialogHeader>
          <Textarea className="mrpsl-input" placeholder="Reason for rejection" value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button className="gap-2" disabled={reject.isPending} onClick={doReject}>
              {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
