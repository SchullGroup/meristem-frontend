"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Download, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useGetAllotment,
  useRightsAllotmentSummary,
  useIcuApprove,
  useIcuReject,
} from "@/hooks/useRights";
import { exportAllotmentExcel } from "@/actions/rightsActions";

export function RightsIcuApproval({ declarationId }: { declarationId?: string }) {
  const { currentUser } = useStore();
  const [comment, setComment] = useState("");
  const [downloading, setDownloading] = useState(false);

  const { data: summary } = useRightsAllotmentSummary(declarationId);
  const { data: allotment, isLoading } = useGetAllotment(
    { id: declarationId, page: 0, pageSize: 500 },
    { enabled: !!declarationId },
  );
  const approve = useIcuApprove();
  const reject = useIcuReject();

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to review the ICU allotment.
      </Card>
    );
  }

  const rows = allotment?.content ?? [];

  function doApprove() {
    approve.mutate(
      { id: declarationId!, decision: "APPROVED", comment, createdBy: currentUser?.email ?? "" },
      {
        onSuccess: () => toast.success("ICU approved — shares marked allotted and certificates created against shareholder records."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  function doReject() {
    if (!comment.trim()) { toast.error("Add a comment before returning to Ops."); return; }
    reject.mutate(
      { id: declarationId!, decision: "REJECTED", comment, createdBy: currentUser?.email ?? "" },
      {
        onSuccess: () => toast.success("Returned to Ops."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  async function download() {
    setDownloading(true);
    try {
      const blob = await exportAllotmentExcel(declarationId!);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rights_allotment_${declarationId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  const cards = [
    { label: "Rights Due", value: summary?.totalUnitsOffered ?? 0 },
    { label: "Total Applied", value: summary?.totalUnitsApplied ?? 0 },
    { label: "Total Allotted", value: summary?.totalUnitsAllotted ?? 0, highlight: true },
    { label: "Refund Value (₦)", value: summary?.totalRefundValue ?? 0, money: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold">ICU Approval</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Final approval. On approve, shares are marked allotted and certificates are created against the shareholder records.
          </p>
        </div>
        {summary && (
          <Badge className={`border-0 text-[11px] ${summary.executed ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
            {summary.executed ? "Allotment executed" : "Allotment not yet executed"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="mrpsl-card p-3">
            <p className="mrpsl-label">{c.label}</p>
            <p className={`font-mono font-semibold text-lg mt-1 ${c.highlight ? "text-primary" : ""}`}>
              {c.money ? `₦${Number(c.value).toLocaleString()}` : Number(c.value).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="mrpsl-section-title">Allotment Schedule ({rows.length})</p>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={downloading} onClick={download}>
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download CSV
          </Button>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground sticky top-0">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">HOLDER</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">ACCOUNT</th>
                <th className="text-right px-4 py-2.5 font-medium">RIGHTS DUE</th>
                <th className="text-right px-4 py-2.5 font-medium">REFUND (₦)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No allotment rows. Run the allotment engine first.</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={`${r.chn}-${i}`} className="border-t border-border">
                    <td className="px-4 py-2.5">{r.shareholderName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(r.rightsDue ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(r.amountToReturn ?? 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mrpsl-card p-5 space-y-3">
        <label className="mrpsl-label">ICU Comment</label>
        <Textarea className="mrpsl-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional for approval; required to return to Ops." />
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" disabled={reject.isPending} onClick={doReject}>
            <RotateCcw className="h-4 w-4" /> Return to Ops
          </Button>
          <Button className="gap-1.5" disabled={approve.isPending} onClick={doApprove}>
            {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve &amp; Create Certificates
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Note: the declaration must be at the ICU stage (Ops-authorised) for approval to succeed — the maker-checker rule blocks self-approval.
        </p>
      </Card>
    </div>
  );
}
