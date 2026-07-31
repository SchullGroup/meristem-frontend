"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, UserCheck, Pencil, Check, X,
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
  usePendingSubscriptions,
  useApproveSubscription,
  useRejectSubscription,
  useUpdateSubscriptionFmEmail,
} from "@/hooks/useFunds";
import type { FundSubscription } from "@/actions/fundActions";

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : format(d, "dd MMM yyyy");
}

export function SubscriptionApproval() {
  const actor = useStore((s) => s.currentUser)?.email;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isError, error } = usePendingSubscriptions({ page, size: pageSize });
  const pending = useMemo(() => data?.content ?? [], [data]);

  const [reviewing, setReviewing] = useState<FundSubscription | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");

  const approve = useApproveSubscription();
  const reject = useRejectSubscription();
  const updateEmail = useUpdateSubscriptionFmEmail();

  const handleApprove = async () => {
    if (!reviewing) return;
    try {
      await approve.mutateAsync({ id: reviewing.id, approvedBy: actor });
      toast.success(`Subscription ${reviewing.ref} approved. Fund manager notified.`);
      setReviewing(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleReject = async () => {
    if (!reviewing || !rejectRemark.trim()) return;
    try {
      await reject.mutateAsync({ id: reviewing.id, rejectionRemark: rejectRemark.trim(), rejectedBy: actor });
      toast.info(`Subscription ${reviewing.ref} rejected. Submitter notified.`);
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
    const isNew = reviewing.subscriberType === "NEW";
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
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">On approval, the fund holding is updated and an email is sent to the Fund Manager.</p>
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subscription Details — {reviewing.ref}</p>
            <Badge className={isNew ? "bg-blue-100 text-blue-800 border-0" : "bg-violet-100 text-violet-800 border-0"}>
              {isNew ? "New Subscriber" : "Existing Unit Holder"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="mrpsl-label">Fund Register</p><p className="font-medium mt-0.5">{reviewing.fundName || reviewing.fundRegisterId}</p></div>
            <div><p className="mrpsl-label">Holder Name</p><p className="font-medium mt-0.5">{reviewing.holderName || "—"}</p></div>
            <div><p className="mrpsl-label">Account No.</p><p className="font-medium mt-0.5 font-mono">{reviewing.holderAccountNo || "(new)"}</p></div>
            <div><p className="mrpsl-label">Email</p><p className="font-medium mt-0.5 break-all">{reviewing.email || "—"}</p></div>
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
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div><p className="mrpsl-label">Units Subscribed</p><p className="font-mono font-bold text-xl mt-0.5">{reviewing.unitsSubscribed.toLocaleString()}</p></div>
            <div><p className="mrpsl-label">Amount Paid</p><p className="font-mono font-bold text-xl mt-0.5">
              {reviewing.amountPaid != null ? `₦${reviewing.amountPaid.toLocaleString()}` : <span className="text-muted-foreground text-base font-normal">Not provided</span>}
            </p></div>
          </div>

          {reviewing.nextOfKin && (
            <div className="pt-2 border-t border-border text-sm"><p className="mrpsl-label mb-0.5">Next of Kin</p><p className="font-medium">{reviewing.nextOfKin}</p></div>
          )}
          {reviewing.narration && (
            <div className="pt-2 border-t border-border text-sm"><p className="mrpsl-label mb-0.5">Narration</p><p className="font-medium">{reviewing.narration}</p></div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="destructive" onClick={() => setRejectOpen(true)}><XCircle className="h-4 w-4 mr-2" />Reject</Button>
          <Button onClick={handleApprove} disabled={approve.isPending}>
            {approve.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving…</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve &amp; Notify Fund Manager</>}
          </Button>
        </div>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Subscription</DialogTitle>
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

  /* ── Queue table ── */
  return (
    <div className="space-y-4">
      <Card className="mrpsl-card p-4 border-l-4 border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Team Lead — Subscription Approval Queue</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {data?.totalElements ?? 0} subscription{(data?.totalElements ?? 0) !== 1 ? "s" : ""} pending. The Fund Manager is notified automatically on approval.
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
          <p className="text-xs mt-1">No subscriptions pending approval.</p>
        </div>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">SUB NO.</th>
                  <th className="px-4 py-3 whitespace-nowrap">SHAREHOLDER</th>
                  <th className="px-4 py-3 whitespace-nowrap">TYPE</th>
                  <th className="px-4 py-3 whitespace-nowrap">FUND REGISTER</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">UNITS</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">AMOUNT PAID</th>
                  <th className="px-4 py-3 whitespace-nowrap">DATE</th>
                  <th className="px-4 py-3 whitespace-nowrap">SUBMITTED BY</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map((sub) => (
                  <tr key={sub.id} className="mrpsl-table-row hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground whitespace-nowrap">{sub.ref}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{sub.holderName || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={sub.subscriberType === "NEW" ? "bg-blue-100 text-blue-800 border-0 whitespace-nowrap" : "bg-violet-100 text-violet-800 border-0 whitespace-nowrap"}>
                        {sub.subscriberType === "NEW" ? "New" : "Existing"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">{sub.fundName || sub.fundRegisterId}</td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">{sub.unitsSubscribed.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      {sub.amountPaid != null ? `₦${sub.amountPaid.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{fmtDate(sub.submittedAt)}</td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">{sub.submittedBy || "—"}</td>
                    <td className="px-4 py-3 text-center"><Button size="sm" onClick={() => setReviewing(sub)}>Review</Button></td>
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
