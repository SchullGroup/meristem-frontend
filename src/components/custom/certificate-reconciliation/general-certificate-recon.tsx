"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { ResolutionDesk } from "./resolution-desk";
import { useReconSearch } from "@/hooks/useReconciliation";
import type { ReconSearchResult } from "@/actions/reconciliationActions";

export default function GeneralCertificateReconciliation() {
  const [term, setTerm] = useState(""); // committed query
  const [input, setInput] = useState("");
  const { data: results, isLoading, isError, error } = useReconSearch(term, term.length >= 2);

  // Selected shareholder + register for the desk.
  const [holder, setHolder] = useState<ReconSearchResult | null>(null);
  const [register, setRegister] = useState<string>("");

  const runSearch = () => {
    if (input.trim().length < 2) { toast.error("Enter at least 2 characters (CHN, BVN, name, or phone)."); return; }
    setTerm(input.trim());
  };

  // ── Desk ──
  if (holder && register) {
    return (
      <ResolutionDesk
        chn={holder.chn}
        register={register}
        holderName={holder.name}
        backLabel="Back to Search"
        onBack={() => { setHolder(null); setRegister(""); }}
      />
    );
  }

  // ── Register picker (selected holder has multiple registers) ──
  if (holder && !register) {
    return (
      <Card className="mrpsl-card p-5 space-y-4">
        <div>
          <p className="font-semibold text-sm">{holder.name}</p>
          <p className="text-[12px] text-muted-foreground font-mono">{holder.chn}{holder.bvn ? ` · BVN: ${holder.bvn}` : ""}</p>
        </div>
        <p className="text-sm text-muted-foreground">Select a register to reconcile:</p>
        <div className="flex flex-wrap gap-2">
          {holder.registers.map((r) => (
            <Button key={r} variant="outline" onClick={() => setRegister(r)}>{r}</Button>
          ))}
          {holder.registers.length === 0 && <p className="text-sm text-muted-foreground italic">No registers on record for this shareholder.</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setHolder(null)}>Back to Search</Button>
      </Card>
    );
  }

  // ── Search ──
  return (
    <Card className="mrpsl-card p-5 space-y-5">
      <div className="space-y-1.5">
        <label className="mrpsl-label">Find Shareholder</label>
        <div className="flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="mrpsl-input h-9 pl-9"
              placeholder="Search by CHN, BVN, name or phone…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            />
          </div>
          <Button onClick={runSearch} className="gap-1.5">Search</Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
      )}
      {isError && <p className="text-sm text-red-600">{(error as Error)?.message ?? "Search failed."}</p>}

      {!isLoading && !isError && term.length >= 2 && (
        (results ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No shareholders found matching &quot;{term}&quot;.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-muted/30 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              {(results ?? []).length} record{(results ?? []).length !== 1 ? "s" : ""} found — select to continue
            </div>
            {(results ?? []).map((s) => (
              <button
                key={s.chn}
                className="w-full flex items-start justify-between px-4 py-3 hover:bg-accent/50 border-t border-border/50 text-left transition-colors"
                onClick={() => {
                  setHolder(s);
                  if (s.registers.length === 1) setRegister(s.registers[0]);
                }}
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-[12px] text-muted-foreground font-mono">
                    CHN: {s.chn}{s.bvn ? ` · BVN: ${s.bvn}` : ""}{s.phone ? ` · ${s.phone}` : ""}
                  </p>
                  {s.matchedOn && <p className="text-[11px] text-muted-foreground">matched on {s.matchedOn}</p>}
                </div>
                <div className="flex gap-1 mt-0.5 shrink-0 flex-wrap justify-end max-w-40">
                  {s.registers.map((r) => (
                    <Badge key={r} className="border-0 text-[11px] bg-gray-100 text-gray-700">{r}</Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </Card>
  );
}
