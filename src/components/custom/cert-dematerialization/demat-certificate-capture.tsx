"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { DematDetailDialog, fmtDate } from "./demat-shared";
import { useCaptureDematRequest, useGetAllCertificateDemat } from "@/hooks/useCertDematerialisation";
import type { CaptureDematRequest, Demat } from "@/actions/certDematActions";

interface CertRow { certNo: string; units: string; certDate: string }
const EMPTY_ROW: CertRow = { certNo: "", units: "", certDate: "" };

export function DematCertificateCapture() {
  const capture = useCaptureDematRequest();
  const drafts = useGetAllCertificateDemat({ status: "DRAFT", size: 100 });
  const draftRecords = useMemo(() => drafts.data?.content ?? [], [drafts.data]);

  const [register, setRegister] = useState("");
  const [chn, setChn] = useState("");
  const [holderName, setHolderName] = useState("");
  const [broker, setBroker] = useState("");
  const [shareholderIdRef, setShareholderIdRef] = useState("");
  const [dematFormRef, setDematFormRef] = useState("");
  const [scannedCertsRef, setScannedCertsRef] = useState("");
  const [rows, setRows] = useState<CertRow[]>([{ ...EMPTY_ROW }]);

  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Demat | null>(null);

  const filteredDrafts = draftRecords.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.chn.toLowerCase().includes(q) || (r.holderName ?? "").toLowerCase().includes(q) ||
      (r.certificates ?? []).some((c) => (c.certNo ?? c.certNumber ?? "").toLowerCase().includes(q));
  });

  const reset = () => {
    setRegister(""); setChn(""); setHolderName(""); setBroker("");
    setShareholderIdRef(""); setDematFormRef(""); setScannedCertsRef("");
    setRows([{ ...EMPTY_ROW }]);
  };

  const submit = () => {
    if (!register.trim() || !chn.trim() || !holderName.trim()) { toast.error("Register, CHN and Holder Name are required."); return; }
    const certs = rows
      .filter((r) => r.certNo.trim() && r.units)
      .map((r) => ({ certNo: r.certNo.trim(), units: Number(r.units), certDate: r.certDate || "" }));
    if (certs.length === 0) { toast.error("Add at least one certificate (cert no + units)."); return; }

    const payload: CaptureDematRequest = {
      register: register.trim(), chn: chn.trim(), holderName: holderName.trim(), broker: broker.trim(),
      certificates: certs, shareholderIdRef: shareholderIdRef.trim(), dematFormRef: dematFormRef.trim(), scannedCertsRef: scannedCertsRef.trim(),
    };
    capture.mutate(payload, {
      onSuccess: () => { toast.success(`Captured demat for ${payload.chn} (draft).`); reset(); },
      onError: (err) => toast.error((err as Error).message),
    });
  };

  return (
    <div className="space-y-6">
      {/* Capture form */}
      <Card className="mrpsl-card p-5 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">New Certificate Capture</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><label className="mrpsl-label">Register (symbol) *</label><Input className="mrpsl-input" value={register} onChange={(e) => setRegister(e.target.value)} placeholder="e.g. DANGCEM" /></div>
          <div className="space-y-1.5"><label className="mrpsl-label">CHN *</label><Input className="mrpsl-input font-mono" value={chn} onChange={(e) => setChn(e.target.value)} placeholder="C00012345AK" /></div>
          <div className="space-y-1.5"><label className="mrpsl-label">Holder Name *</label><Input className="mrpsl-input" value={holderName} onChange={(e) => setHolderName(e.target.value)} /></div>
          <div className="space-y-1.5"><label className="mrpsl-label">Broker</label><Input className="mrpsl-input" value={broker} onChange={(e) => setBroker(e.target.value)} /></div>
          <div className="space-y-1.5"><label className="mrpsl-label">Shareholder ID Ref</label><Input className="mrpsl-input" value={shareholderIdRef} onChange={(e) => setShareholderIdRef(e.target.value)} /></div>
          <div className="space-y-1.5"><label className="mrpsl-label">Demat Form Ref</label><Input className="mrpsl-input" value={dematFormRef} onChange={(e) => setDematFormRef(e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2 sm:col-span-3"><label className="mrpsl-label">Scanned Certificates Ref</label><Input className="mrpsl-input" value={scannedCertsRef} onChange={(e) => setScannedCertsRef(e.target.value)} placeholder="Document/upload reference" /></div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="mrpsl-label">Certificates</label>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-[12px]" onClick={() => setRows((r) => [...r, { ...EMPTY_ROW }])}><Plus className="h-3 w-3" /> Add certificate</Button>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
              <Input className="mrpsl-input font-mono" placeholder="Cert No" value={row.certNo} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, certNo: e.target.value } : r))} />
              <Input className="mrpsl-input font-mono" type="number" placeholder="Units" value={row.units} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, units: e.target.value } : r))} />
              <Input className="mrpsl-input" type="date" value={row.certDate} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, certDate: e.target.value } : r))} />
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-muted-foreground" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={reset}>Clear</Button>
          <Button disabled={capture.isPending} onClick={submit}>{capture.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Capture (Draft)</Button>
        </div>
      </Card>

      {/* Captured drafts list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Captured Drafts</p>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="mrpsl-input pl-9 h-8" placeholder="Search CHN, holder, cert no…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header"><tr>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3 text-right">CERTS</th>
                <th className="px-4 py-3 text-right">TOTAL UNITS</th>
                <th className="px-4 py-3">CAPTURED</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr></thead>
              <tbody className="divide-y divide-border/60">
                {drafts.isLoading && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading…</td></tr>
                )}
                {!drafts.isLoading && filteredDrafts.map((r) => (
                  <tr key={r.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.chn}</td>
                    <td className="px-4 py-3 font-medium text-sm">{r.holderName || "—"}</td>
                    <td className="px-4 py-3"><Badge className="border-0 text-[12px] bg-gray-100 text-gray-800">{r.register}</Badge></td>
                    <td className="px-4 py-3 text-right font-mono">{r.certificates?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(r.totalUnits ?? 0)}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.capturedBy || "—"}<br /><span className="text-[11px]">{fmtDate(r.capturedAt)}</span></td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => setDetail(r)}>View</Button></td>
                  </tr>
                ))}
                {!drafts.isLoading && filteredDrafts.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">No captured drafts. Submit for call-over happens in the Team Lead Approval tab.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <DematDetailDialog record={detail} open={detail !== null} onClose={() => setDetail(null)} />
    </div>
  );
}
