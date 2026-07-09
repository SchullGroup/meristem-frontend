"use client";

import { useState } from "react";
import { Plus, Trash2, Play, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AllotmentRulesEngineProps {
  bannerMessage?: string;
}

interface AllotmentBand {
  id: string;
  minUnits: number;
  maxUnits: number;
  flatAllotment: number;
  proRataPercent: number;
}

const MOCK_BANDS: AllotmentBand[] = [
  { id: "b1", minUnits: 500, maxUnits: 10000, flatAllotment: 0, proRataPercent: 100 },
  { id: "b2", minUnits: 10001, maxUnits: 50000, flatAllotment: 0, proRataPercent: 85 },
  { id: "b3", minUnits: 50001, maxUnits: 500000, flatAllotment: 0, proRataPercent: 70 },
  { id: "b4", minUnits: 500001, maxUnits: 5000000, flatAllotment: 0, proRataPercent: 55 },
  { id: "b5", minUnits: 5000001, maxUnits: 999999999, flatAllotment: 0, proRataPercent: 40 },
];

const TOTAL_UNITS_OFFERED = 17_772_612_811;
const TOTAL_UNITS_APPLIED = 22_450_318_000;
const TOTAL_APPLICANTS = 78956;

function DonutChart({ allottedPct }: { allottedPct: number }) {
  const r = 52;
  const cx = 68;
  const cy = 68;
  const circumference = 2 * Math.PI * r;
  const filled = (allottedPct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={136} height={136} viewBox="0 0 136 136">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={14}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={14}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="hsl(var(--destructive) / 0.3)"
          strokeWidth={14}
          strokeDasharray={`${circumference - filled} ${filled}`}
          strokeDashoffset={-filled}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-mono">{allottedPct.toFixed(0)}%</span>
        <span className="text-[10px] text-muted-foreground">Allotted</span>
      </div>
    </div>
  );
}

export function AllotmentRulesEngine({ bannerMessage }: AllotmentRulesEngineProps = {}) {
  const [bands, setBands] = useState<AllotmentBand[]>(MOCK_BANDS);
  const [executed, setExecuted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const addBand = () => {
    const last = bands[bands.length - 1];
    const newMin = last ? last.maxUnits + 1 : 500;
    setBands((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        minUnits: newMin,
        maxUnits: newMin + 49999,
        flatAllotment: 0,
        proRataPercent: 100,
      },
    ]);
  };

  const removeBand = (id: string) => {
    setBands((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBand = <K extends keyof Omit<AllotmentBand, "id">>(
    id: string,
    key: K,
    value: Omit<AllotmentBand, "id">[K]
  ) => {
    setBands((prev) => prev.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  };

  const estimatedAllottedPct = Math.min(
    (TOTAL_UNITS_OFFERED / TOTAL_UNITS_APPLIED) * 100 *
      (bands.reduce((sum, b) => sum + b.proRataPercent, 0) / (bands.length * 100)),
    100
  );

  const totalAllottedUnits = Math.floor((estimatedAllottedPct / 100) * TOTAL_UNITS_APPLIED);
  const refundUnits = TOTAL_UNITS_APPLIED - totalAllottedUnits;

  const handleExecute = () => {
    if (bands.length === 0) {
      toast.error("Add at least one allotment band before executing.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmExecute = () => {
    setShowConfirm(false);
    toast.success("Allotment algorithm executed. Data forked into Allotted Ledger and Return Monies Queue.");
    setExecuted(true);
  };

  return (
    <div className="space-y-4">
      {bannerMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">{bannerMessage}</p>
        </div>
      )}
    <div className="flex gap-5 min-h-150">
      {/* Left: Band Builder */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Allotment Band Builder</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter the SEC-approved band parameters exactly as stated in the Allotment Advice.
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
            {bands.length} band{bands.length !== 1 ? "s" : ""} configured
          </Badge>
        </div>

        <div className="space-y-2">
          {bands.map((band, i) => (
            <Card key={band.id} className="mrpsl-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Band {i + 1}
                </span>
                <div className="flex-1 h-px bg-border" />
                <button
                  onClick={() => removeBand(band.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove band"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="mrpsl-label">Min Applied Units</label>
                  <input
                    type="number"
                    className="mrpsl-input h-9 w-full"
                    value={band.minUnits || ""}
                    onChange={(e) => updateBand(band.id, "minUnits", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="mrpsl-label">Max Applied Units</label>
                  <input
                    type="number"
                    className="mrpsl-input h-9 w-full"
                    value={band.maxUnits || ""}
                    onChange={(e) => updateBand(band.id, "maxUnits", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="mrpsl-label">Flat Allotment Units (optional)</label>
                  <input
                    type="number"
                    className="mrpsl-input h-9 w-full"
                    placeholder="0 — leave blank if not applicable"
                    value={band.flatAllotment || ""}
                    onChange={(e) => updateBand(band.id, "flatAllotment", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="mrpsl-label">Pro-rata Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="mrpsl-input h-9 w-full"
                    placeholder="100"
                    value={band.proRataPercent || ""}
                    onChange={(e) => updateBand(band.id, "proRataPercent", Number(e.target.value))}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="w-full" onClick={addBand}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Band
        </Button>
      </div>

      {/* Right: Live Preview */}
      <div className="w-72 shrink-0 space-y-4">
        <Card className="mrpsl-card p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Live Preview
          </p>

          <div className="flex justify-center">
            <DonutChart allottedPct={estimatedAllottedPct} />
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Total Units Offered", value: TOTAL_UNITS_OFFERED.toLocaleString(), color: "" },
              { label: "Total Units Applied", value: TOTAL_UNITS_APPLIED.toLocaleString(), color: "" },
              {
                label: "Est. Units to Allot",
                value: totalAllottedUnits.toLocaleString(),
                color: "text-primary font-semibold",
              },
              {
                label: "Est. Units for Refund",
                value: refundUnits.toLocaleString(),
                color: "text-destructive",
              },
              { label: "Total Applicants", value: TOTAL_APPLICANTS.toLocaleString(), color: "" },
              { label: "Bands Configured", value: `${bands.length}`, color: "" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-mono ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="pt-1 border-t border-border">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
                <span className="text-muted-foreground">Allotted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/30 inline-block" />
                <span className="text-muted-foreground">Refund Queue</span>
              </div>
            </div>
          </div>
        </Card>

        {!showConfirm ? (
          <Button
            className="w-full"
            size="lg"
            onClick={handleExecute}
            disabled={executed}
          >
            <Play className="h-4 w-4 mr-2" />
            {executed ? "Algorithm Executed" : "Execute Allotment Algorithm"}
          </Button>
        ) : (
          <Card className="mrpsl-card p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                This will permanently fork the allotment data. Ensure the SEC Allotment Advice exactly matches the bands above before proceeding.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-amber-600 hover:bg-amber-700"
                onClick={confirmExecute}
              >
                Confirm Execute
              </Button>
            </div>
          </Card>
        )}

        {executed && (
          <Card className="mrpsl-card p-3 bg-green-50 dark:bg-green-950/20 border-green-200">
            <p className="text-xs text-green-800 dark:text-green-300 font-medium">
              Algorithm executed successfully. Allotted Ledger and Return Monies Queue have been populated. Proceed to Pending Approval.
            </p>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
}
