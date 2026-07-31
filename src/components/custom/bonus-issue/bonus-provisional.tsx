"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Send, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useComputeBonus, useBonusEntitlements, useSubmitBonusForApproval } from "@/hooks/useBonus";
import { DOWNLOAD_BONUS_PRELIST } from "@/actions/bonusIssuesAction";

interface Row {
  accountNumber: string;
  name: string;
  unitsAtQualDate: number;
  bonusDue: number;
  fractionalRemainder: number;
}

export function BonusProvisional({
  declarationId,
  offerName,
  ratioLabel,
}: {
  declarationId?: string;
  offerName?: string;
  ratioLabel?: string;
}) {
  const [computed, setComputed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const compute = useComputeBonus();
  const submit = useSubmitBonusForApproval();
  const { data: ent, isFetching, refetch } = useBonusEntitlements(
    declarationId,
    { page: 1, pageSize: 2000 },
    computed,
  );

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a bonus issue above to compute the provisional allotment.
      </Card>
    );
  }

  const payload = ent?.data ?? {};
  const rows: Row[] = payload?.entitlements?.content ?? [];
  const totalShareholders = payload?.totalShareholders ?? rows.length;
  const totalBonus = payload?.totalBonusShares ?? 0;
  const totalFractional = payload?.totalFractionalRemainder ?? 0;

  function handleCompute() {
    compute.mutate(
      { declarationId: declarationId! },
      {
        onSuccess: () => { setComputed(true); refetch(); toast.success("Bonus allotment computed from the shareholder register."); },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  async function handlePrelist() {
    setDownloading(true);
    try {
      const blob = await DOWNLOAD_BONUS_PRELIST(declarationId!);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url; a.download = `bonus_prelist_${declarationId}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error((e as Error).message); } finally { setDownloading(false); }
  }

  function handleSubmit() {
    submit.mutate(
      { declarationId: declarationId! },
      {
        onSuccess: () => toast.success("Sent to Declarations Approval."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  if (!computed) {
    return (
      <Card className="mrpsl-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="mrpsl-label">Bonus Issue</p><p className="font-medium mt-0.5">{offerName ?? "—"}</p></div>
          <div><p className="mrpsl-label">Ratio</p><p className="font-medium mt-0.5">{ratioLabel ?? "—"}</p></div>
        </div>
        <div className="border-t border-border pt-4 flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            Computes each qualifying shareholder&apos;s bonus from the holder register using the offer&apos;s ratio and rounding rule.
          </p>
          <Button onClick={handleCompute} disabled={compute.isPending} className="gap-2 shrink-0 ml-4">
            {compute.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Compute Bonus Allotment
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-green-100 text-green-800 border-0">Bonus Computed</Badge>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="gap-1.5" disabled={downloading} onClick={handlePrelist}>
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download Pre-list (CSV)
        </Button>
        <Button size="sm" className="gap-1.5" disabled={submit.isPending} onClick={handleSubmit}>
          {submit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send to Declarations Approval
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="mrpsl-card p-3"><p className="mrpsl-label">Qualifying Shareholders</p><p className="font-mono font-semibold text-lg mt-1">{Number(totalShareholders).toLocaleString()}</p></Card>
        <Card className="mrpsl-card p-3"><p className="mrpsl-label">Total Bonus Shares</p><p className="font-mono font-semibold text-lg mt-1 text-primary">{Number(totalBonus).toLocaleString()}</p></Card>
        <Card className="mrpsl-card p-3"><p className="mrpsl-label">Fractional Remainder</p><p className="font-mono font-semibold text-lg mt-1">{Number(totalFractional).toLocaleString()}</p></Card>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="mrpsl-section-title">Provisional Bonus Schedule ({rows.length})</p>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground sticky top-0">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">#</th>
                <th className="text-left px-4 py-2.5 font-medium">ACCOUNT</th>
                <th className="text-left px-4 py-2.5 font-medium">HOLDER</th>
                <th className="text-right px-4 py-2.5 font-medium">UNITS HELD</th>
                <th className="text-right px-4 py-2.5 font-medium">BONUS DUE</th>
                <th className="text-right px-4 py-2.5 font-medium">FRACTION</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">{isFetching ? "Loading…" : "No qualifying shareholders."}</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.accountNumber ?? i} className="border-t border-border">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.accountNumber}</td>
                    <td className="px-4 py-2.5">{r.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(r.unitsAtQualDate ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">{Number(r.bonusDue ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{Number(r.fractionalRemainder ?? 0).toFixed(2)}</td>
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
