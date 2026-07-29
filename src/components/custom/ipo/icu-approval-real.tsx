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
  useGetIcuApprovals,
  useGetIpoBatch,
  useGetIpoBatchSubscribers,
  useIcuReviewIpo,
} from "@/hooks/useIPO";
import { useStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";
import { DataErrorState, PendingListSkeleton } from "./loaders";
import type { IPOBatchType } from "@/types/ipo";

export default function IcuApprovalIpoReal() {
  const { currentUser } = useStore();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [subType, setSubType] = useState<IPOBatchType>("APPROVED");
  const [subPage, setSubPage] = useState(0);

  const { data, isLoading, isError, refetch } = useGetIcuApprovals(
    { page, size: pageSize },
    { enabled: !selectedBatch },
  );
  const { data: batchDetail } = useGetIpoBatch(selectedBatch ?? undefined);
  const { data: subsData, isLoading: subsLoading } = useGetIpoBatchSubscribers(
    { batchRef: selectedBatch ?? "", type: subType, page: subPage, size: 10 },
    { enabled: !!selectedBatch },
  );

  const icuReview = useIcuReviewIpo();

  function handleReview(approved: boolean, comment: string) {
    if (!selectedBatch || !currentUser?.email) return;
    if (!approved && !comment.trim()) {
      toast.error("A comment is required to return the batch.");
      return;
    }
    icuReview.mutate(
      {
        batchRef: selectedBatch,
        payload: { approved, comment, reviewedBy: currentUser.email },
      },
      {
        onSuccess: () => {
          toast.success(
            approved
              ? `Batch ${selectedBatch} ICU-approved.`
              : `Batch ${selectedBatch} returned to OPS.`,
          );
          setReturnOpen(false);
          setReturnComment("");
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
          <ArrowLeft className="h-4 w-4" /> Back to ICU Queue
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
              <div className="mrpsl-section-title">OPS Approved By</div>
              <div className="font-semibold mt-0.5">{batchDetail?.opsApprovedBy}</div>
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {subsLoading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />Loading…</td></tr>
                ) : (subsData?.content ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground italic">No {subType.toLowerCase()} subscribers.</td></tr>
                ) : (
                  subsData?.content?.map((s) => (
                    <tr key={s.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-medium">{s.subscriberName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.chn}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{s.stockbrokerCode}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(s.units)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">₦{formatNumber(s.amount)}</td>
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
          <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => setReturnOpen(true)} disabled={icuReview.isPending}>
            Return to OPS
          </Button>
          <Button onClick={() => handleReview(true, "Cleared for lodgment.")} disabled={icuReview.isPending}>
            {icuReview.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            ICU Approve
          </Button>
        </div>

        <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Return Batch {selectedBatch} to OPS</DialogTitle></DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <Textarea
                placeholder="State reason for returning to OPS…"
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleReview(false, returnComment)} disabled={icuReview.isPending}>
                  {icuReview.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirm Return
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (isLoading) return <PendingListSkeleton />;
  if (isError) return <DataErrorState message="Failed to load ICU-pending batches." onRetry={() => refetch()} />;

  const batches = data?.content ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        OPS-approved batches awaiting ICU review before CSCS lodgement.
      </p>
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">BATCH REF</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">OPS APPROVED BY</th>
                <th className="px-4 py-3">OPS APPROVED AT</th>
                <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground italic">No batches pending ICU review.</td></tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batchReference} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold">{b.batchReference}</td>
                    <td className="px-4 py-3">{b.register}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.opsApprovedBy}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.opsApprovedAt}</td>
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
