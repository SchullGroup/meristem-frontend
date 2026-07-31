"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, User, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { useSearchDematHolders, useSearchDematStockbrokers } from "@/hooks/useCertDematerialisation";
import type { DematHolder, DematStockbroker } from "@/actions/certDematActions";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value !== undefined && value !== null && value !== "" ? value : "—"}</p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground/70">
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ── Shareholder panel ──────────────────────────────────────────────────────
function ShareholderPanel() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const isChn = /^[A-Za-z]?\d/.test(term) && !term.includes(" ");
  const { data, isLoading, isError, error } = useSearchDematHolders(
    isChn ? { chn: term, size: 25 } : { name: term, size: 25 },
    term.length >= 2,
  );
  const holders = useMemo(() => data?.content ?? [], [data]);

  const run = () => {
    if (input.trim().length < 2) { toast.error("Enter at least 2 characters (name or CHN)."); return; }
    setTerm(input.trim());
  };

  return (
    <Card className="mrpsl-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Shareholder Verification</span>
      </div>
      <div className="flex gap-2">
        <Input className="mrpsl-input h-10 flex-1" placeholder="Search by name or CHN…" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} />
        <Button className="h-10 gap-1.5" onClick={run}><Search className="h-4 w-4" /> Search</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
      ) : isError ? (
        <p className="text-sm text-red-600 py-6 text-center">{(error as Error)?.message ?? "Search failed."}</p>
      ) : term.length < 2 ? (
        <EmptyState icon={<User className="h-8 w-8" />} text="Search for a shareholder to view their profile" />
      ) : holders.length === 0 ? (
        <EmptyState icon={<User className="h-8 w-8" />} text={`No shareholders found matching "${term}"`} />
      ) : (
        <div className="space-y-3">
          {holders.map((h: DematHolder, i) => (
            <div key={h.id ?? h.chn ?? i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{h.name || "—"}</span>
                <Badge className="border-0 text-[11px] bg-gray-100 text-gray-800">{h.registerSymbol || h.register || "—"}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CHN" value={h.chn} />
                <Field label="CSCS Account" value={h.cscsAccountNo} />
                <Field label="Registrar Account" value={h.accountNo} />
                <Field label="BVN" value={h.bvn} />
                <Field label="Units Held" value={h.units != null ? formatNumber(h.units) : undefined} />
                <Field label="Broker" value={h.broker} />
                <Field label="Stockbroker Code" value={h.stockbrokerCode} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Stockbroker panel ──────────────────────────────────────────────────────
function StockbrokerPanel() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const { data, isLoading, isError, error } = useSearchDematStockbrokers(term, term.length >= 2);
  const brokers = useMemo(() => data ?? [], [data]);

  const run = () => {
    if (input.trim().length < 2) { toast.error("Enter at least 2 characters (firm name or CSCS code)."); return; }
    setTerm(input.trim());
  };

  return (
    <Card className="mrpsl-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Stockbroker Verification</span>
      </div>
      <div className="flex gap-2">
        <Input className="mrpsl-input h-10 flex-1" placeholder="Search by firm name or CSCS code…" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} />
        <Button className="h-10 gap-1.5" onClick={run}><Search className="h-4 w-4" /> Search</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
      ) : isError ? (
        <p className="text-sm text-red-600 py-6 text-center">{(error as Error)?.message ?? "Search failed."}</p>
      ) : term.length < 2 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} text="Search for a stockbroker to view their profile" />
      ) : brokers.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} text={`No stockbrokers found matching "${term}"`} />
      ) : (
        <div className="space-y-3">
          {brokers.map((b: DematStockbroker, i) => (
            <div key={`${b.stockbrokerCode}-${i}`} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{b.firmName || "—"}</span>
                {b.stockbrokerCode && <Badge className="border-0 text-[11px] bg-blue-100 text-blue-800 font-mono">{b.stockbrokerCode}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CSCS / Stockbroker Code" value={b.stockbrokerCode} />
                <Field label="Shareholders" value={formatNumber(b.holderCount ?? 0)} />
                <Field label="Total Units Under Broker" value={formatNumber(b.totalUnits ?? 0)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function DematVerification() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ShareholderPanel />
      <StockbrokerPanel />
    </div>
  );
}
