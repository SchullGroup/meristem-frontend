"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, User, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { useSearchDematHolders } from "@/hooks/useCertDematerialisation";
import type { DematHolder } from "@/actions/certDematActions";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value !== undefined && value !== null && value !== "" ? value : "—"}</p>
    </div>
  );
}

export function DematVerification() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  // Term looks like a CHN if it has digits and letters and no spaces; else search by name.
  const isChn = /^[A-Za-z]?\d/.test(term) && !term.includes(" ");
  const { data, isLoading, isError, error } = useSearchDematHolders(
    isChn ? { chn: term, size: 25 } : { name: term, size: 25 },
    term.length >= 2,
  );
  const holders = useMemo(() => data?.content ?? [], [data]);

  const runSearch = () => {
    if (input.trim().length < 2) { toast.error("Enter at least 2 characters (name or CHN)."); return; }
    setTerm(input.trim());
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Look up a shareholder&apos;s registration and stockbroker details before capturing a dematerialisation request.</p>

      <div className="flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="mrpsl-input h-9 pl-9" placeholder="Search by shareholder name or CHN…" value={input}
            onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} />
        </div>
        <Button onClick={runSearch}>Search</Button>
      </div>

      {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>}
      {isError && <p className="text-sm text-red-600">{(error as Error)?.message ?? "Search failed."}</p>}

      {!isLoading && !isError && term.length >= 2 && (
        holders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shareholders found matching &quot;{term}&quot;.</p>
        ) : (
          <div className="space-y-3">
            {holders.map((h: DematHolder, i) => (
              <Card key={h.id ?? h.chn ?? i} className="mrpsl-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{h.name || "—"}</span>
                    <Badge className="border-0 text-[11px] bg-gray-100 text-gray-800">{h.registerSymbol || h.register || "—"}</Badge>
                  </div>
                  {h.status && <Badge className="border-0 text-[11px] bg-blue-100 text-blue-800">{h.status}</Badge>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="CHN" value={h.chn} />
                  <Field label="CSCS Account" value={h.cscsAccountNo} />
                  <Field label="Registrar Account" value={h.accountNo} />
                  <Field label="BVN" value={h.bvn} />
                  <Field label="Units Held" value={h.units != null ? formatNumber(h.units) : undefined} />
                </div>
                <div className="pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Stockbroker</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Broker" value={h.broker} />
                    <Field label="Stockbroker Code" value={h.stockbrokerCode} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
