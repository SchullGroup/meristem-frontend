"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, CheckCircle2, XCircle, UserCheck, Loader2, Pencil, Check, X,
} from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  usePendingRedemptions,
  useApproveRedemption,
  useRejectRedemption,
  useUpdateRedemptionFmEmail,
} from "@/hooks/useFunds";
import type { FundRedemption } from "@/actions/fundActions";

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : format(d, "dd MMM yyyy");
}

export function RedemptionApproval() {
  const actor = useStore((s) => s.currentUser)?.email;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isError, error } = usePendingRedemptions({ page, size: pageSize });
  const pending = useMemo(() => data?.content ?? [], [data]);

  const [reviewing, setReviewing] = useState<FundRedemption | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");

  const approve = useApproveRedemption();
  const reject = useRejectRedemption();
  const updateEmail = useUpdateRedemptionFmEmail();

  const handleApprove = async () => {
    if (!reviewing) return;
    try {
      await approve.mutateAsync({ id: reviewing.id, approvedBy: actor });
      toast.success(`Redemption ${reviewing.ref} approved — units deducted, Fund Manager notified.`);
      setReviewing(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleReject = async () => {
    if (!reviewing || !rejectRemark.trim()) return;
    try {
      await reject.mutateAsync({ id: reviewing.id, rejectionRemark: rejectRemark.trim(), rejectedBy: actor });
      toast.info(`Redemption ${reviewing.ref} rejected. Submitter notified.`);
      setRejectOpen(false); setRejectRemark(""); setReviewing(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleSaveEmail = async () => {
    if (!reviewing || !editedEmail.trim()) return;
    try {
      const updated = await updateEmail.mutateAsync({ id: reviewing.id, fundManagerEmail: editedEmail.trim(), updatedBy: actor });
      setReviewing(updated);
      setEditingEmail(false);
      toast.success("Fund manager email updated.");
    } catch (e) { toast.error((e as Error).message); }
  };

  /* ── Review panel ── */
  if (reviewing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setReviewing(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </button>

        <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Awaiting Team Lead Approval</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">On approval, units are deducted from the holder balance and the Fund Manager is emailed.</p>
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Redemption Details — {reviewing.ref}</p>
            <Badge className="bg-amber-100 text-amber-800 border-0">Pending</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="mrpsl-label">Fund Register</p><p className="font-medium mt-0.5">{reviewing.fundName || reviewing.fundRegisterId}</p></div>
            <div><p className="mrpsl-label">Holder Name</p><p className="font-medium mt-0.5">{reviewing.holderName || "—"}</p></div>
            <div><p className="mrpsl-label">Account No.</p><p className="font-medium mt-0.5 font-mono">{reviewing.holderAccountNo || "—"}</p></div>
            <div>
              <p className="mrpsl-label">Fund Manager Email</p>
              {editingEmail ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input className="mrpsl-input h-8 text-sm w-56" type="email" value={editedEmail} autoFocus
                    onChange={(e) => setEditedEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEmail(); if (e.key === "Escape") setEditingEmail(false); }} />
                  <Button size="sm" className="h-8 px-2.5" onClick={handleSaveEmail} disabled={updateEmail.isPending || !editedEmail.trim()}>
                    {updateEmail.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={() => setEditingEmail(false)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-medium break-all">{reviewing.fundManagerEmail || "—"}</p>
                  <button type="button" title="Edit fund manager email" onClick={() => { setEditedEmail(reviewing.fundManagerEmail ?? ""); setEditingEmail(true); }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"><Pencil className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>
            <div><p className="mrpsl-label">Submitted By</p><p className="font-medium mt-0.5">{reviewing.submittedBy || "—"}</p></div>
            <div><p className="mrpsl-label">Date Submitted</p><p className="font-medium mt-0.5">{fmtDate(reviewing.submittedAt)}</p></div>
            <div><p className="mrpsl-label">Redemption Date</p><p className="font-medium mt-0.5">{fmtDate(reviewing.redemptionDate)}</p></div>
            <div><p className="mrpsl-label">Date Payable</p><p className="font-medium mt-0.5">{fmtDate(reviewing.datePayable)}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div><p className="mrpsl-label">Units Requested</p><p className="font-mono font-bold text-xl mt-0.5">{reviewing.unitsRequested.toLocaleString()}</p></div>
            <div><p className="mrpsl-label">Available at Request</p><p className="font-mono font-bold text-xl mt-0.5">{(reviewing.availableUnitsAtRequest ?? 0).toLocaleString()}</p></div>
          </div>

          {reviewing.narration && <div className="pt-2 border-t border-border text-sm"><p className="mrpsl-label mb-0.5">Narration</p><p className="font-medium">{reviewing.narration}</p></div>}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="destructive" onClick={() => setRejectOpen(true)}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
          <Button onClick={handleApprove} disabled={approve.isPending}>
            {approve.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving…</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve &amp; Deduct Units</>}
          </Button>
        </div>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Redemption</DialogTitle>
              <DialogDescription>Provide a reason for rejection. The initiator will be notified.</DialogDescription>
            </DialogHeader>
            <Textarea className="mrpsl-input resize-none" rows={3} placeholder="Reason for rejection…" value={rejectRemark} onChange={(e) => setRejectRemark(e.target.value)} />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={!rejectRemark.trim() || reject.isPending} onClick={handleReject}>
                {reject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirm Rejection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ── Queue ── */
  return (
    <div className="space-y-4">
      <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Team Lead — Redemption Approval Queue</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {data?.totalElements ?? 0} redemption{(data?.totalElements ?? 0) !== 1 ? "s" : ""} pending. Units are deducted on approval.
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
      ) : isError ? (
        <div className="py-16 text-center text-red-600 text-sm">{(error as Error)?.message ?? "Failed to load."}</div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm text-foreground">All caught up</p>
          <p className="text-xs mt-1">No redemptions pending approval.</p>
        </div>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">REDM NO.</th>
                  <th className="px-4 py-3 whitespace-nowrap">HOLDER</th>
                  <th className="px-4 py-3 whitespace-nowrap">FUND REGISTER</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">UNITS</th>
                  <th className="px-4 py-3 whitespace-nowrap">DATE PAYABLE</th>
                  <th className="px-4 py-3 whitespace-nowrap">SUBMITTED BY</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map((r) => (
                  <tr key={r.id} className="mrpsl-table-row hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground whitespace-nowrap">{r.ref}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.holderName || "—"}</td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">{r.fundName || r.fundRegisterId}</td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">{r.unitsRequested.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{fmtDate(r.datePayable)}</td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">{r.submittedBy || "—"}</td>
                    <td className="px-4 py-3 text-center"><Button size="sm" onClick={() => setReviewing(r)}>Review</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={page}
            pageSize={pageSize}
            totalPages={data?.totalPages ?? 1}
            total={data?.totalElements ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
          />
        </Card>
      )}
    </div>
  );
}
