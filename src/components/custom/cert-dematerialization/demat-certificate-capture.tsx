"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, FileSearch, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { useGetShareholdersCertificate } from "@/hooks/useCertificates";
import {
  useCaptureDematFromCertificates,
  useGetAllCertificateDemat,
} from "@/hooks/useCertDematerialisation";
import type { CscsShareholder } from "@/types/cscs";
import type { Demat } from "@/actions/certDematActions";

export function DematCertificateCapture() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");

  const { data: lookup, isLoading, isError, error } = useGetShareholdersCertificate(
    { search: term },
    { enabled: term.trim().length >= 2 },
  );
  const results = useMemo(() => (lookup?.data ?? []) as CscsShareholder[], [lookup]);

  const capture = useCaptureDematFromCertificates();
  const returned = useGetAllCertificateDemat({ status: "REJECTED", size: 100 });
  const returnedRecords = useMemo(() => returned.data?.content ?? [], [returned.data]);

  const runSearch = () => {
    if (input.trim().length < 2) { toast.error("Enter a certificate number or shareholder name (min 2 characters)."); return; }
    setTerm(input.trim());
  };

  const beginFromHit = (s: CscsShareholder) => {
    if (!s.certificateId) { toast.error("This shareholder has no certificate on record to dematerialise."); return; }
    capture.mutate(
      {
        chn: s.chn,
        register: s.registerSymbol,
        holderName: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.chn,
        certificateIds: [s.certificateId],
      },
      {
        onSuccess: () => toast.success(`Dematerialisation request created for ${s.chn} — sent to Team Lead call-over.`),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  const resubmit = (r: Demat) => {
    const ids = (r.certificates ?? []).map((c) => c.id).filter(Boolean);
    if (ids.length === 0) { toast.error("This request has no linked certificates to resubmit."); return; }
    capture.mutate(
      { chn: r.chn, register: r.register, holderName: r.holderName, broker: r.broker, certificateIds: ids },
      {
        onSuccess: () => toast.success(`Resubmitted dematerialisation for ${r.chn}.`),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Certificate lookup (search) */}
      <Card className="mrpsl-card p-5 space-y-4">
        <div>
          <p className="font-semibold text-sm">Certificate Lookup</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Search for a shareholder certificate by certificate number or shareholder name to begin a new dematerialisation request.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="mrpsl-input h-10 pl-9" placeholder="Certificate number or shareholder name…" value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} />
          </div>
          <Button className="h-10 gap-1.5" onClick={runSearch}><Search className="h-4 w-4" /> Search</Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
        ) : isError ? (
          <p className="text-sm text-red-600">{(error as Error)?.message ?? "Search failed."}</p>
        ) : term.length >= 2 && results.length === 0 ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" /> No certificate found matching &quot;{term}&quot;.
          </div>
        ) : results.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">SHAREHOLDER</th>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">CERT NUMBER</th>
                  <th className="px-4 py-3 text-right">HOLDINGS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {results.map((s) => (
                  <tr key={s.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-medium text-sm">{`${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "—"}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{s.chn}</td>
                    <td className="px-4 py-3"><Badge className="border-0 text-[12px] bg-gray-100 text-gray-800">{s.registerSymbol}</Badge></td>
                    <td className="px-4 py-3 font-mono text-[13px]">{s.certNumber ?? <span className="text-muted-foreground/60 italic">no certificate</span>}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(s.holdings ?? 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" disabled={!s.certificateId || capture.isPending} onClick={() => beginFromHit(s)}>
                        {capture.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Begin Dematerialisation
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/70">
            <FileSearch className="h-8 w-8" />
            <p className="text-sm">Search for a certificate to begin a dematerialisation request.</p>
          </div>
        )}
      </Card>

      {/* Returned requests */}
      <Card className="mrpsl-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">Returned Requests</p>
          {returnedRecords.length > 0 && <Badge className="border-0 text-[11px] bg-gray-900 text-white">{returnedRecords.length}</Badge>}
        </div>
        {returned.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : returnedRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">No returned (rejected) requests.</p>
        ) : (
          <div className="space-y-3">
            {returnedRecords.map((r) => (
              <div key={r.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{r.holderName || r.chn}</p>
                    <p className="text-[12px] text-muted-foreground font-mono">
                      {r.chn} · {r.register}
                      {r.certificates?.length ? ` — ${r.certificates.map((c) => c.certNo ?? c.certNumber).filter(Boolean).join(", ")}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" disabled={capture.isPending} onClick={() => resubmit(r)}>
                    {capture.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Edit &amp; Resubmit
                  </Button>
                </div>
                {r.rejectionReason && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 text-[13px] text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{r.rejectionReason}{r.rejectionStage ? ` (${r.rejectionStage})` : ""}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
