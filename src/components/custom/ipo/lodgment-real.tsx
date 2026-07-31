"use client";

import { useState } from "react";
import { ArrowLeft, Download, FileText, Loader2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  useGetIpoBatchesLodgment,
  useGetIpoBatchLodgment,
  useDownloadIpoBatchLodgment,
  useApproveBatchLodgment,
} from "@/hooks/useIPO";
import { useStore } from "@/lib/store";
import { formatNumber } from "@/lib/utils/format";
import { PaginationBar } from "../pagination-bar";
import { DataErrorState, PendingListSkeleton } from "./loaders";

export default function IcuLodgmentReal() {
  const { currentUser } = useStore();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [lodgeOpen, setLodgeOpen] = useState(false);
  const [lodgeComment, setLodgeComment] = useState("");
  const [format, setFormat] = useState<"RIN_AT_CSCS" | "RIN_NOT_AT_CSCS">("RIN_AT_CSCS");

  const { data, isLoading, isError, refetch } = useGetIpoBatchesLodgment(
    { page, size: pageSize },
    { enabled: !selectedBatch },
  );
  const { data: lodgement, isLoading: lodgementLoading } = useGetIpoBatchLodgment(
    { batchRef: selectedBatch ?? "" },
    { enabled: !!selectedBatch },
  );

  const downloadFile = useDownloadIpoBatchLodgment();
  const approveLodgment = useApproveBatchLodgment();

  async function handleDownload() {
    if (!selectedBatch) return;
    try {
      const text = await downloadFile.mutateAsync({ batchRef: selectedBatch, format });
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ipo_lodgement_${selectedBatch}_${format.toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download lodgement file.");
    }
  }

  function handleMarkLodged() {
    if (!selectedBatch || !currentUser?.email) return;
    approveLodgment.mutate(
      { batchRef: selectedBatch, payload: { comment: lodgeComment, lodgedBy: currentUser.email } },
      {
        onSuccess: () => {
          toast.success(`Batch ${selectedBatch} marked as lodged.`);
          setLodgeOpen(false);
          setLodgeComment("");
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
          <ArrowLeft className="h-4 w-4" /> Back to Lodgement Queue
        </Button>

        <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
          <div className="flex items-center gap-8 text-sm flex-wrap">
            <div>
              <div className="mrpsl-section-title">Batch Ref</div>
              <div className="font-mono font-semibold mt-0.5">{lodgement?.batchReference ?? selectedBatch}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Register</div>
              <div className="font-semibold mt-0.5">{lodgement?.register}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Status</div>
              <div className="font-semibold mt-0.5">{lodgement?.status}</div>
            </div>
            <div>
              <div className="mrpsl-section-title">Total Rows</div>
              <div className="font-mono mt-0.5">{formatNumber(lodgement?.totalRows ?? 0)}</div>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">Lodgment Format:</span>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as "RIN_AT_CSCS" | "RIN_NOT_AT_CSCS")} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="RIN_AT_CSCS" id="rin-yes" />
              <label htmlFor="rin-yes" className="text-sm cursor-pointer">RIN at CSCS</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="RIN_NOT_AT_CSCS" id="rin-no" />
              <label htmlFor="rin-no" className="text-sm cursor-pointer">RIN NOT at CSCS</label>
            </div>
          </RadioGroup>
          <Button size="sm" variant="outline" className="gap-1.5 ml-auto" onClick={handleDownload} disabled={downloadFile.isPending}>
            {downloadFile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download CSCS File
          </Button>
        </div>

        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">STOCKBROKER</th>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3">SHAREHOLDER</th>
                  <th className="px-4 py-3">CERT NO</th>
                  <th className="px-4 py-3">SYMBOL</th>
                  <th className="px-4 py-3 text-right">UNITS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lodgementLoading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />Loading…</td></tr>
                ) : (lodgement?.previewRows ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground italic">No preview rows.</td></tr>
                ) : (
                  lodgement?.previewRows.map((r, i) => (
                    <tr key={`${r.chn}-${i}`} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono text-xs">{r.stockbrokerCode}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.chn}</td>
                      <td className="px-4 py-3 font-medium">{r.shareholderName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.certNo}</td>
                      <td className="px-4 py-3">{r.symbol}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatNumber(r.units)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => setLodgeOpen(true)} disabled={lodgement?.status === "LODGED"}>
            <Upload className="h-4 w-4" />
            {lodgement?.status === "LODGED" ? "Already Lodged" : "Mark as Lodged"}
          </Button>
        </div>

        <Dialog open={lodgeOpen} onOpenChange={setLodgeOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Confirm Lodgement — {selectedBatch}</DialogTitle></DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Confirms this batch has been submitted to CSCS via the downloaded file. This
                transitions the batch to LODGED.
              </p>
              <Textarea
                placeholder="Notes (optional)…"
                value={lodgeComment}
                onChange={(e) => setLodgeComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setLodgeOpen(false)}>Cancel</Button>
                <Button onClick={handleMarkLodged} disabled={approveLodgment.isPending}>
                  {approveLodgment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirm Lodged
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (isLoading) return <PendingListSkeleton />;
  if (isError) return <DataErrorState message="Failed to load lodgement queue." onRetry={() => refetch()} />;

  const batches = data?.content ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        ICU-approved batches ready for CSCS lodgement.
      </p>
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">BATCH REF</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">ICU APPROVED BY</th>
                <th className="px-4 py-3">ICU APPROVED AT</th>
                <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground italic">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  No batches ready for lodgement.
                </td></tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batchReference} className="mrpsl-table-row">
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold">{b.batchReference}</td>
                    <td className="px-4 py-3">{b.register}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.icuApprovedBy}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{b.icuApprovedAt}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">₦{formatNumber(b.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => setSelectedBatch(b.batchReference)}>
                        {b.status === "LODGED" ? "View" : "Lodge"}
                      </Button>
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
