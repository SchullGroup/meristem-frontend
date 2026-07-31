"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Download, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useBonusDeclarations, useIcuApproveBonusDeclaration, useReturnBonusToOps } from "@/hooks/useBonus";
import { DOWNLOAD_BONUS_PRELIST } from "@/actions/bonusIssuesAction";

interface Decl {
  id: number | string;
  issueRef?: string;
  bonusName?: string;
  ratio?: string;
  totalShareholders?: number;
  totalBonusShares?: number;
}

export function BonusIcuReview() {
  const { data, isLoading } = useBonusDeclarations({ status: "PENDING_ICU", pageSize: 200 });
  const approve = useIcuApproveBonusDeclaration();
  const returnToOps = useReturnBonusToOps();
  const [returning, setReturning] = useState<Decl | null>(null);
  const [comment, setComment] = useState("");

  const rows: Decl[] = data?.data?.content ?? [];

  async function download(id: number | string, ref?: string) {
    try {
      const blob = await DOWNLOAD_BONUS_PRELIST(id);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${ref ?? "bonus"}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error((e as Error).message); }
  }

  function doApprove(id: number | string) {
    approve.mutate(
      { declarationId: id, payload: { decision: "APPROVED", comment: "" } },
      {
        onSuccess: () => toast.success("ICU approved — shares allotted and certificates created against shareholder records."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function doReturn() {
    if (!returning) return;
    if (!comment.trim()) { toast.error("Add a reason to return to Ops."); return; }
    returnToOps.mutate(
      { declarationId: returning.id, payload: { decision: "REJECTED", comment } },
      {
        onSuccess: () => { toast.success("Returned to Ops."); setReturning(null); setComment(""); },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">ICU Review</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Declarations approved by Ops, awaiting ICU. On ICU approval the bonus is allotted and certificates are created against the shareholders.
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
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No declarations awaiting ICU review.</td></tr>
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
                        <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setReturning(d)}>
                          <RotateCcw className="h-3.5 w-3.5" /> Return
                        </Button>
                        <Button size="sm" className="gap-1.5" disabled={approve.isPending} onClick={() => doApprove(d.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> ICU Approve
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

      <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return {returning?.issueRef} to Ops</DialogTitle></DialogHeader>
          <Textarea className="mrpsl-input" placeholder="Reason" value={comment} onChange={(e) => setComment(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>Cancel</Button>
            <Button className="gap-2" disabled={returnToOps.isPending} onClick={doReturn}>
              {returnToOps.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
