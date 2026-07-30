"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { useApprovedSubscriptions } from "@/hooks/useFunds";
import type { FundSubscription } from "@/actions/fundActions";

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : format(d, "dd MMM yyyy");
}

export function ApprovedSubscriptions() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isError, error } = useApprovedSubscriptions({ page, size: pageSize });
  const approved = useMemo(() => data?.content ?? [], [data]);
  const [viewing, setViewing] = useState<FundSubscription | null>(null);

  if (viewing) {
    const isNew = viewing.subscriberType === "NEW";
    return (
      <div className="space-y-4">
        <button onClick={() => setViewing(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to approved list
        </button>

        <Card className="mrpsl-card p-4 border-l-4 border-l-green-500 bg-green-50/40 dark:bg-green-950/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-300">Subscription Approved</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Approved by {viewing.approvedBy || "—"} on {fmtDate(viewing.approvedAt)}. Fund Manager notified.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subscription Details — {viewing.ref}</p>
            <div className="flex items-center gap-2">
              <Badge className={isNew ? "bg-blue-100 text-blue-800 border-0" : "bg-violet-100 text-violet-800 border-0"}>{isNew ? "New Subscriber" : "Existing Unit Holder"}</Badge>
              <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="mrpsl-label">Fund Register</p><p className="font-medium mt-0.5">{viewing.fundName || viewing.fundRegisterId}</p></div>
            <div><p className="mrpsl-label">Holder Name</p><p className="font-medium mt-0.5">{viewing.holderName || "—"}</p></div>
            <div><p className="mrpsl-label">Account No.</p><p className="font-medium mt-0.5 font-mono">{viewing.holderAccountNo || "—"}</p></div>
            <div><p className="mrpsl-label">Email</p><p className="font-medium mt-0.5 break-all">{viewing.email || "—"}</p></div>
            <div><p className="mrpsl-label">Fund Manager Email</p><p className="font-medium mt-0.5 break-all">{viewing.fundManagerEmail || "—"}</p></div>
            <div><p className="mrpsl-label">Submitted By</p><p className="font-medium mt-0.5">{viewing.submittedBy || "—"}</p></div>
            <div><p className="mrpsl-label">Date Submitted</p><p className="font-medium mt-0.5">{fmtDate(viewing.submittedAt)}</p></div>
            <div><p className="mrpsl-label">Approved By</p><p className="font-medium mt-0.5">{viewing.approvedBy || "—"}</p></div>
            <div><p className="mrpsl-label">Date Approved</p><p className="font-medium mt-0.5">{fmtDate(viewing.approvedAt)}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div><p className="mrpsl-label">Units Subscribed</p><p className="font-mono font-bold text-xl mt-0.5">{viewing.unitsSubscribed.toLocaleString()}</p></div>
            <div><p className="mrpsl-label">Amount Paid</p><p className="font-mono font-bold text-xl mt-0.5">
              {viewing.amountPaid != null ? `₦${viewing.amountPaid.toLocaleString()}` : <span className="text-muted-foreground text-base font-normal">Not provided</span>}
            </p></div>
          </div>
          {viewing.narration && <div className="pt-2 border-t border-border text-sm"><p className="mrpsl-label mb-0.5">Narration</p><p className="font-medium">{viewing.narration}</p></div>}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="mrpsl-card p-4 border-l-4 border-l-green-500 bg-green-50/40 dark:bg-green-950/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900 dark:text-green-300">Approved Subscriptions</p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{data?.totalElements ?? 0} approved. Click View to inspect any record.</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
      ) : isError ? (
        <div className="py-16 text-center text-red-600 text-sm">{(error as Error)?.message ?? "Failed to load."}</div>
      ) : approved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-2xl text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-sm text-foreground">No approved subscriptions</p>
          <p className="text-xs mt-1">Approved items will appear here.</p>
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
                  <th className="px-4 py-3 whitespace-nowrap">DATE APPROVED</th>
                  <th className="px-4 py-3 whitespace-nowrap">APPROVED BY</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {approved.map((sub) => (
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
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{fmtDate(sub.approvedAt)}</td>
                    <td className="px-4 py-3 text-[13px] whitespace-nowrap">{sub.approvedBy || "—"}</td>
                    <td className="px-4 py-3 text-center"><Button size="sm" variant="outline" onClick={() => setViewing(sub)}>View</Button></td>
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
