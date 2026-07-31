"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Info, Loader2, Play, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useRightsAllotmentRules,
  useRightsAllotmentSummary,
  useSaveRightsAllotmentRules,
  useRunRightsAllotment,
} from "@/hooks/useRights";
import type { AllotmentBand } from "@/actions/rightsActions";

const num = (v: string) => (v === "" ? null : Number(v));

export function RightsAllotmentEngine({ declarationId }: { declarationId?: string }) {
  const { data: savedRules } = useRightsAllotmentRules(declarationId);
  const { data: summary, isLoading: summaryLoading } = useRightsAllotmentSummary(declarationId);
  const save = useSaveRightsAllotmentRules();
  const run = useRunRightsAllotment();

  // Local edits take precedence; otherwise show the saved bands from the server.
  const [edited, setEdited] = useState<AllotmentBand[] | null>(null);
  const bands = edited ?? savedRules ?? [];
  const setBands = (updater: (b: AllotmentBand[]) => AllotmentBand[]) => setEdited(updater(bands));

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to configure the allotment rule engine.
      </Card>
    );
  }

  const addBand = () => setBands((b) => [...b, { minUnits: null, maxUnits: null, flatAllotment: null, proRataPercent: null }]);
  const removeBand = (i: number) => setBands((b) => b.filter((_, idx) => idx !== i));
  const updateBand = (i: number, k: keyof AllotmentBand, v: string) =>
    setBands((b) => b.map((band, idx) => (idx === i ? { ...band, [k]: num(v) } : band)));

  function handleSave() {
    save.mutate(
      { id: declarationId!, bands },
      { onSuccess: () => toast.success("Allotment bands saved."), onError: (e) => toast.error((e as Error).message) },
    );
  }

  function handleRun() {
    run.mutate(
      { id: declarationId! },
      {
        onSuccess: () => toast.success("Allotment executed — additional shares banded and added to rights due."),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  const cards = [
    { label: "Rights Due (guaranteed)", value: summary?.totalUnitsOffered ?? 0 },
    { label: "Total Applied", value: summary?.totalUnitsApplied ?? 0 },
    { label: "Total Allotted", value: summary?.totalUnitsAllotted ?? 0, highlight: true },
    { label: "Refund Units", value: summary?.totalRefundUnits ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        Allotment bands apply <strong className="mx-1">only to the additional shares applied for</strong>.
        Guaranteed rights due are always allotted in full; the banded additional shares are added to the
        rights due to give the total allotted, which then goes to ICU approval.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="mrpsl-card p-3">
            <p className="mrpsl-label">{c.label}</p>
            <p className={`font-mono font-semibold text-lg mt-1 ${c.highlight ? "text-primary" : ""}`}>
              {summaryLoading ? "…" : c.value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="mrpsl-section-title">Allotment Bands (additional shares)</p>
          {summary && (
            <Badge className={`border-0 text-[11px] ${summary.executed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
              {summary.executed ? "Executed" : "Not executed"}
            </Badge>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Min Units</th>
                <th className="text-left px-4 py-2.5 font-medium">Max Units</th>
                <th className="text-left px-4 py-2.5 font-medium">Flat Allotment</th>
                <th className="text-left px-4 py-2.5 font-medium">Pro-rata %</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {bands.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No bands — additional shares allotted in full. Add a band to apply pro-rata / flat allotment.</td></tr>
              ) : (
                bands.map((b, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2"><Input className="mrpsl-input h-8" type="number" value={b.minUnits ?? ""} onChange={(e) => updateBand(i, "minUnits", e.target.value)} /></td>
                    <td className="px-4 py-2"><Input className="mrpsl-input h-8" type="number" value={b.maxUnits ?? ""} onChange={(e) => updateBand(i, "maxUnits", e.target.value)} /></td>
                    <td className="px-4 py-2"><Input className="mrpsl-input h-8" type="number" value={b.flatAllotment ?? ""} onChange={(e) => updateBand(i, "flatAllotment", e.target.value)} /></td>
                    <td className="px-4 py-2"><Input className="mrpsl-input h-8" type="number" value={b.proRataPercent ?? ""} onChange={(e) => updateBand(i, "proRataPercent", e.target.value)} /></td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeBand(i)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addBand}><Plus className="h-3.5 w-3.5" /> Add Band</Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={save.isPending} onClick={handleSave}>
            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Bands
          </Button>
          <div className="flex-1" />
          <Button size="sm" className="gap-1.5" disabled={run.isPending} onClick={handleRun}>
            {run.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run Allotment
          </Button>
        </div>
      </Card>
    </div>
  );
}
