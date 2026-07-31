"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useGetPendingApprovals,
  useGetIpoBatch,
  useGetIpoBatchSubscribers,
  useOpsApproveIpo,
  useOpsRejectIpo,
} from "@/hooks/useIPO";
import { useStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";
import { DataErrorState, PendingListSkeleton } from "./loaders";
import type { IPOBatchType } from "@/types/ipo";

export default function PendingApprovalIpoReal() {
  const { currentUser } = useStore();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [subType, setSubType] = useState<IPOBatchType>("APPROVED");
  const [subPage, setSubPage] = useState(0);

  const { data, isLoading, isError, refetch } = useGetPendingApprovals(
    { page, size: pageSize },
    { enabled: !selectedBatch },
  );
  const { data: batchDetail } = useGetIpoBatch(selectedBatch ?? undefined);
  const { data: subsData, isLoading: subsLoading } = useGetIpoBatchSubscribers(
    { batchRef: selectedBatch ?? "", type: subType, page: subPage, size: 10 },
    { enabled: !!selectedBatch },
  );

  const opsApprove = useOpsApproveIpo();
  const opsReject = useOpsRejectIpo();

  function handleApprove() {
    if (!selectedBatch || !currentUser?.email) return;
    opsApprove.mutate(
      { batchRef: selectedBatch, payload: { approvedBy: currentUser.email } },
      {
        onSuccess: () => {
          toast.success(`Batch ${selectedBatch} approved.`);
          setSelectedBatch(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleReject() {
    if (!selectedBatch || !currentUser?.email || !rejectComment.trim()) {
      toast.error("A rejection comment is required.");
      return;
    }
    opsReject.mutate(
      {
        batchRef: selectedBatch,
        payload: { comment: rejectComment, rejectedBy: currentUser.email },
      },
      {
        onSuccess: () => {
          toast.success(`Batch ${selectedBatch} rejected.`);
          setRejectOpen(false);
          setRejectComment("");
          setSelectedBatch(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  if (selectedBatch) {
    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => setSelectedBatch(null)}>
          <ArrowLeft className="h-4 w-4" /> Back to Pending Batches
        </Button>

        <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
          <div className="flex items-center gap-8 text-sm flex-wrap">
            <div>
              <div className="mrpsl-section-title">Batch Ref</div>
              <div className="font-mono font-semibold mt-0.5">{selectedBatch}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Register</div>
              <div className="font-semibold mt-0.5">{batchDetail?.register}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Approved</div>
              <div className="font-mono mt-0.5 text-green-700">{formatNumber(batchDetail?.approvedCount ?? 0)}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Disapproved</div>
              <div className="font-mono mt-0.5 text-red-700">{formatNumber(batchDetail?.disapprovedCount ?? 0)}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Invalid</div>
              <div className="font-mono mt-0.5 text-amber-700">{formatNumber(batchDetail?.invalidCount ?? 0)}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Total Amount</div>
              <div className="font-mono mt-0.5">₦{formatNumber(batchDetail?.totalAmount ?? 0)}</div>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          {(["APPROVED", "DISAPPROVED", "INVALID"] as IPOBatchType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setSubType(t); setSubPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border cursor-pointer ${
                subType === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">SUBSCRIBER</th>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3">STOCKBROKER</th>
                  <th className="px-4 py-3 text-right">UNITS</th>
                  <th className="px-4 py-3 text-right">AMOUNT</th>
                  <th className="px-4 py-3">REMARK</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subsLoading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />Loading…</td></tr>
                ) : (subsData?.content ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground italic">No {subType.toLowerCase()} subscribers.</td></tr>
                ) : (
                  subsData?.content?.map((s) => (
                    <tr key={s.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-medium">{s.subscriberName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.chn}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{s.stockbrokerCode}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(s.units)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">₦{formatNumber(s.amount)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{s.remark ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {subsData?.pagination && (
            <PaginationBar
              page={subPage}
              total={subsData.pagination.total ?? 0}
              pageSize={10}
              onPageChange={setSubPage}
              onPageSizeChange={() => {}}
            />
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setRejectOpen(true)} disabled={opsApprove.isPending || opsReject.isPending}>
            Reject Batch
          </Button>
          <Button onClick={handleApprove} disabled={opsApprove.isPending || opsReject.isPending}>
            {opsApprove.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Approve Batch
          </Button>
        </div>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Reject Batch {selectedBatch}</DialogTitle></DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <Textarea
                placeholder="State reason for rejection…"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} disabled={opsReject.isPending}>
                  {opsReject.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (isLoading) return <PendingListSkeleton />;
  if (isError) return <DataErrorState message="Failed to load pending batches." onRetry={() => refetch()} />;

  const batches = data?.content ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Subscription batches awaiting OPS approval before ICU review.
      </p>
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">BATCH REF</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3 text-right">APPROVED</th>
                <th className="px-4 py-3 text-right">DISAPPROVED</th>
                <th className="px-4 py-3 text-right">INVALID</th>
                <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground italic">No batches pending OPS approval.</td></tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batchReference} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold">{b.batchReference}</td>
                    <td className="px-4 py-3">{b.register}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.batchDate}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-green-700">{formatNumber(b.approvedCount)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-red-700">{formatNumber(b.disapprovedCount)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-700">{formatNumber(b.invalidCount)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">₦{formatNumber(b.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => setSelectedBatch(b.batchReference)}>Review</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.pagination && (
          <PaginationBar
            page={page}
            total={data.pagination.total ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </Card>
    </div>
  );
}
