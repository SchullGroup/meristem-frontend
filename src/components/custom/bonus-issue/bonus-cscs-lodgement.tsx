"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useBonusDeclarations, useLodgeBonus } from "@/hooks/useBonus";
import { DOWNLOAD_BONUS_LODGEMENT } from "@/actions/bonusIssuesAction";

interface Decl {
  id: number | string;
  issueRef?: string;
  bonusName?: string;
  totalBonusShares?: number;
  status?: string;
}

type Fmt = "CSCS_STANDARD" | "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS";

export function BonusCscsLodgement() {
  const { currentUser } = useStore();
  const [format, setFormat] = useState<Fmt>("CSCS_STANDARD");
  const [busy, setBusy] = useState<string | null>(null);

  // ICU-approved (ready to lodge), plus already-lodged for reference.
  const icu = useBonusDeclarations({ status: "ICU_APPROVED", pageSize: 200 });
  const lodged = useBonusDeclarations({ status: "CSCS_LODGED", pageSize: 200 });
  const lodge = useLodgeBonus();

  const rows: Decl[] = [
    ...(icu.data?.data?.content ?? []),
    ...(lodged.data?.data?.content ?? []),
  ];

  async function download(id: number | string, ref?: string) {
    setBusy(`dl:${id}`);
    try {
      const blob = await DOWNLOAD_BONUS_LODGEMENT(id, format);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url; a.download = `bonus_lodgement_${ref ?? id}_${format.toLowerCase()}.txt`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }

  function markLodged(id: number | string) {
    setBusy(`lg:${id}`);
    lodge.mutate(
      { declarationId: id, payload: { lodgmentDate: new Date().toISOString().slice(0, 10), processedBy: currentUser?.email } },
      {
        onSuccess: () => { toast.success("Marked as lodged."); setBusy(null); },
        onError: (e) => { toast.error((e as Error).message); setBusy(null); },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold">CSCS Lodgement</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Download the ICU-approved bonus allotment in the CSCS fixed-width format (143-char records), then mark it lodged.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="mrpsl-label">Format</span>
          <Select value={format} onValueChange={(v) => setFormat((v as Fmt) ?? "CSCS_STANDARD")}>
            <SelectTrigger className="mrpsl-input h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CSCS_STANDARD">CSCS Standard</SelectItem>
              <SelectItem value="RIN_AT_CSCS">RIN at CSCS</SelectItem>
              <SelectItem value="RIN_NOT_AT_CSCS">RIN NOT at CSCS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">REF</th>
                <th className="text-left px-4 py-2.5 font-medium">BONUS ISSUE</th>
                <th className="text-right px-4 py-2.5 font-medium">BONUS SHARES</th>
                <th className="text-left px-4 py-2.5 font-medium">STATUS</th>
                <th className="text-right px-4 py-2.5 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {(icu.isLoading || lodged.isLoading) ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No ICU-approved bonus issues ready for lodgement.</td></tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs">{d.issueRef ?? d.id}</td>
                    <td className="px-4 py-2.5">{d.bonusName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{Number(d.totalBonusShares ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`border-0 text-[11px] ${d.status === "CSCS_LODGED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                        {d.status === "CSCS_LODGED" ? "Lodged" : "Ready"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={busy === `dl:${d.id}`} onClick={() => download(d.id, d.issueRef)}>
                          {busy === `dl:${d.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Lodgement File
                        </Button>
                        {d.status !== "CSCS_LODGED" && (
                          <Button size="sm" className="gap-1.5" disabled={busy === `lg:${d.id}`} onClick={() => markLodged(d.id)}>
                            {busy === `lg:${d.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Mark Lodged
                          </Button>
                        )}
                      </div>
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
