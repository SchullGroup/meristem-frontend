"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Eye, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/format";
import { useGetAllCertificateDemat } from "@/hooks/useCertDematerialisation";
import type { Demat, DematParams, DematStatus } from "@/actions/certDematActions";

export const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  CALLOVER: "bg-blue-100 text-blue-800",
  AUTHORISED: "bg-indigo-100 text-indigo-800",
  COO_APPROVED: "bg-fuchsia-100 text-fuchsia-800",
  ICU_APPROVED: "bg-purple-100 text-purple-800",
  LODGED: "bg-green-100 text-green-800",
  LODGMENT_FAILED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status?: string }) {
  const s = status ?? "";
  return <Badge className={`border-0 text-[11px] ${STATUS_BADGE[s] ?? "bg-gray-100 text-gray-700"}`}>{s.replace(/_/g, " ")}</Badge>;
}

export function fmtDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : format(d, "dd MMM yyyy");
}

export function certNoOf(c: { certNo?: string; certNumber?: string }): string {
  return c.certNo ?? c.certNumber ?? "—";
}

export function isHighValue(r: Demat): boolean {
  return r.highValue ?? (r.totalUnits ?? 0) > 10_000_000;
}

// ── Detail dialog ──────────────────────────────────────────────────────────
export function DematDetailDialog({ record, open, onClose }: { record: Demat | null; open: boolean; onClose: () => void }) {
  if (!record) return null;
  const audit: [string, string | null | undefined, string | null | undefined][] = [
    ["Captured", record.capturedBy, record.capturedAt],
    ["Call-over", record.calloverBy, record.calloverAt],
    ["Authorised", record.authorisedBy, record.authorisedAt],
    ["CEO Approved", record.cooApprovedBy, record.cooApprovedAt],
    ["ICU Approved", record.icuApprovedBy, record.icuApprovedAt],
    ["Lodged", record.lodgedBy, record.lodgedAt],
    ["Rejected", record.rejectedBy, record.rejectedAt],
  ];
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-start justify-between">
          <div>
            <DialogTitle className="text-base font-bold">{record.holderName || record.chn}</DialogTitle>
            <p className="text-[13px] text-muted-foreground mt-1 font-mono">{record.chn} · {record.register}</p>
          </div>
          <div className="flex items-center gap-2">
            {isHighValue(record) && <Badge className="border-0 text-[11px] bg-amber-100 text-amber-800">High value</Badge>}
            <StatusBadge status={record.status} />
          </div>
        </div>
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3 text-[13px]">
            <div><p className="text-[12px] text-muted-foreground">Broker</p><p className="font-medium">{record.broker || "—"}</p></div>
            <div><p className="text-[12px] text-muted-foreground">Total Units</p><p className="font-mono font-semibold">{formatNumber(record.totalUnits ?? 0)}</p></div>
            <div><p className="text-[12px] text-muted-foreground">Certificates</p><p className="font-mono">{record.certificates?.length ?? 0}</p></div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Certificates</p>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-muted/40 text-muted-foreground"><tr>
                  <th className="px-3 py-2 text-left font-medium">CERT NO</th>
                  <th className="px-3 py-2 text-right font-medium">UNITS</th>
                  <th className="px-3 py-2 text-left font-medium">CERT DATE</th>
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {(record.certificates ?? []).map((c, i) => (
                    <tr key={c.id ?? i}>
                      <td className="px-3 py-2 font-mono">{certNoOf(c)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatNumber(c.units ?? 0)}</td>
                      <td className="px-3 py-2">{fmtDate(c.certDate)}</td>
                    </tr>
                  ))}
                  {(record.certificates ?? []).length === 0 && (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground italic">No certificates.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {record.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[13px] text-red-800">
              <strong>Rejected{record.rejectionStage ? ` at ${record.rejectionStage}` : ""}:</strong> {record.rejectionReason}
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Audit Trail</p>
            <div className="space-y-1 text-[13px]">
              {audit.filter(([, by]) => by).map(([label, by, at]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{by} · {fmtDate(at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject dialog ────────────────────────────────────────────────────────
function RejectDialog({ open, count, onClose, onConfirm, busy }: { open: boolean; count: number; onClose: () => void; onConfirm: (reason: string) => void; busy: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setReason(""); onClose(); } }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">Reject {count > 1 ? `${count} records` : "record"}</DialogTitle>
        </div>
        <div className="px-6 py-5 space-y-2">
          <label className="mrpsl-label">Reason</label>
          <Input className="mrpsl-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" />
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setReason(""); onClose(); }}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" disabled={busy || !reason.trim()} onClick={() => onConfirm(reason.trim())}>
            {busy && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Reject
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared stage workspace ─────────────────────────────────────────────────
interface StageWorkspaceProps {
  description: string;
  params: DematParams; // which records this stage lists
  actionLabel: string;
  onApprove: (id: string) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
  onBulkApprove?: (ids: string[]) => Promise<unknown>;
  onBulkReject?: (ids: string[], reason: string) => Promise<unknown>;
  busy?: boolean;
  showHighValue?: boolean;
}

export function DematStageWorkspace({
  description, params, actionLabel, onApprove, onReject, onBulkApprove, onBulkReject, busy = false, showHighValue = false,
}: StageWorkspaceProps) {
  const { data, isLoading, isError, error } = useGetAllCertificateDemat({ size: 100, ...params });
  const records = useMemo(() => data?.content ?? [], [data]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Demat | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ ids: string[] } | null>(null);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const allSelected = records.length > 0 && records.every((r) => selected.has(r.id));

  const approve = async (id: string) => {
    try { await onApprove(id); toast.success("Approved."); } catch (e) { toast.error((e as Error).message); }
  };
  const confirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    const ids = rejectTarget.ids;
    try {
      if (ids.length > 1) {
        if (onBulkReject) await onBulkReject(ids, reason);
        else for (const id of ids) await onReject(id, reason);
      } else {
        await onReject(ids[0], reason);
      }
      toast.success("Rejected.");
      setSelected(new Set());
    } catch (e) { toast.error((e as Error).message); }
    setRejectTarget(null);
  };
  const bulkApprove = async () => {
    const ids = Array.from(selected);
    try {
      if (onBulkApprove) await onBulkApprove(ids);
      else for (const id of ids) await onApprove(id);
      toast.success(`${ids.length} approved.`);
      setSelected(new Set());
    } catch (e) { toast.error((e as Error).message); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-16 text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>;
  if (isError) return <div className="py-16 text-center text-red-600 text-sm">{(error as Error)?.message ?? "Failed to load."}</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{description}</p>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" disabled={busy} onClick={bulkApprove}>
              {busy && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} {actionLabel} selected
            </Button>
            <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setRejectTarget({ ids: Array.from(selected) })}>
              Reject selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-3 py-3 w-9">
                  <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(records.map((r) => r.id)))} />
                </th>
                <th className="px-4 py-3">CHN</th>
                <th className="px-4 py-3">HOLDER</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">BROKER</th>
                <th className="px-4 py-3 text-right">CERTS</th>
                <th className="px-4 py-3 text-right">TOTAL UNITS</th>
                <th className="px-4 py-3">CAPTURED</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {records.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-3 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{r.chn}</td>
                  <td className="px-4 py-3 font-medium text-sm">
                    {r.holderName || "—"}
                    {showHighValue && isHighValue(r) && <Badge className="ml-2 border-0 text-[10px] bg-amber-100 text-amber-800">High value</Badge>}
                  </td>
                  <td className="px-4 py-3"><Badge className="border-0 text-[12px] bg-gray-100 text-gray-800">{r.register}</Badge></td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.broker || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{r.certificates?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(r.totalUnits ?? 0)}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.capturedBy || "—"}<br /><span className="text-[11px]">{fmtDate(r.capturedAt)}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View" onClick={() => setDetail(r)}><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" disabled={busy} onClick={() => approve(r.id)}>{actionLabel}</Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setRejectTarget({ ids: [r.id] })}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="h-5 w-5 inline mr-1.5 text-green-500" /> Nothing awaiting this stage.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DematDetailDialog record={detail} open={detail !== null} onClose={() => setDetail(null)} />
      <RejectDialog open={rejectTarget !== null} count={rejectTarget?.ids.length ?? 0} busy={busy} onClose={() => setRejectTarget(null)} onConfirm={confirmReject} />
    </div>
  );
}

export type { DematStatus };
