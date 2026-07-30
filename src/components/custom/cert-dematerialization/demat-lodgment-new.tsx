"use client";

import { useMemo, useState } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { DematDetailDialog, StatusBadge, fmtDate } from "./demat-shared";
import { useGetAllCertificateDemat, useLodgetDematRequest } from "@/hooks/useCertDematerialisation";
import type { Demat } from "@/actions/certDematActions";

type Rin = "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS";
type Method = "DOWNLOAD" | "PUSH";

function LodgeDialog({ record, open, onClose, onLodge, busy }: {
  record: Demat | null; open: boolean; onClose: () => void;
  onLodge: (rinStatus: Rin, method: Method) => void; busy: boolean;
}) {
  const [rin, setRin] = useState<Rin>("RIN_AT_CSCS");
  const [method, setMethod] = useState<Method>("DOWNLOAD");
  if (!record) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">Lodge with CSCS</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1 font-mono">{record.chn} · {record.register} · {formatNumber(record.totalUnits ?? 0)} units</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="mrpsl-label">RIN Status</label>
            <Select value={rin} onValueChange={(v) => setRin(v as Rin)}>
              <SelectTrigger className="mrpsl-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RIN_AT_CSCS">RIN at CSCS</SelectItem>
                <SelectItem value="RIN_NOT_AT_CSCS">RIN not at CSCS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="mrpsl-label">Lodgment Method</label>
            <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
              <SelectTrigger className="mrpsl-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DOWNLOAD">Download file</SelectItem>
                <SelectItem value="PUSH">Push to CSCS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} onClick={() => onLodge(rin, method)}>
            {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Lodge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DematLodgment() {
  const ready = useGetAllCertificateDemat({ status: "ICU_APPROVED", size: 100 });
  const failed = useGetAllCertificateDemat({ status: "LODGMENT_FAILED", size: 100 });
  const lodge = useLodgetDematRequest();

  const records = useMemo(
    () => [...(ready.data?.content ?? []), ...(failed.data?.content ?? [])],
    [ready.data, failed.data],
  );

  const [detail, setDetail] = useState<Demat | null>(null);
  const [lodgeTarget, setLodgeTarget] = useState<Demat | null>(null);

  const doLodge = async (rinStatus: Rin, method: Method) => {
    if (!lodgeTarget) return;
    try {
      await lodge.mutateAsync({ id: lodgeTarget.id, data: { rinStatus, method } });
      toast.success(`Lodged ${lodgeTarget.chn} with CSCS.`);
      setLodgeTarget(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  if (ready.isLoading || failed.isLoading) {
    return <div className="flex items-center justify-center py-16 text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">ICU-approved records ready to lodge with CSCS. Failed lodgments can be retried here.</p>
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3 text-right">CERTS</th>
                <th className="px-4 py-3 text-right">TOTAL UNITS</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">ICU APPROVED</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.chn}</td>
                  <td className="px-4 py-3 font-medium text-sm">{r.holderName || "—"}</td>
                  <td className="px-4 py-3"><Badge className="border-0 text-[12px] bg-gray-100 text-gray-800">{r.register}</Badge></td>
                  <td className="px-4 py-3 text-right font-mono">{r.certificates?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(r.totalUnits ?? 0)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.icuApprovedBy || "—"}<br /><span className="text-[11px]">{fmtDate(r.icuApprovedAt)}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setDetail(r)}>View</Button>
                      <Button size="sm" onClick={() => setLodgeTarget(r)}>
                        {r.status === "LODGMENT_FAILED" ? "Re-lodge" : "Lodge"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  <PackageCheck className="h-5 w-5 inline mr-1.5 text-green-500" /> Nothing awaiting lodgement.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DematDetailDialog record={detail} open={detail !== null} onClose={() => setDetail(null)} />
      <LodgeDialog record={lodgeTarget} open={lodgeTarget !== null} onClose={() => setLodgeTarget(null)} onLodge={doLodge} busy={lodge.isPending} />
    </div>
  );
}
