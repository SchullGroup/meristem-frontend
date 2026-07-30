"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Loader2, AlertCircle } from "lucide-react";
import {
  useListIpoBatchesByStatus,
  useDownloadIpoStickyLabels,
} from "@/hooks/useIPO";
import { useStore } from "@/lib/store";
import IpoEmailComposer from "./email/ipo-email-composer";
import IpoEmailDeliveryReport from "./email/ipo-email-delivery-report";

export default function IpoDispatchReal() {
  const { currentUser } = useStore();
  const [batchRef, setBatchRef] = useState("");

  const { data: batchesData } = useListIpoBatchesByStatus("LODGED");
  const downloadLabels = useDownloadIpoStickyLabels();

  const batches = batchesData?.content ?? [];

  // ── Sticky labels (preserved) ───────────────────────────────────────────────
  async function handleDownloadLabels() {
    if (!batchRef) {
      toast.error("Select a lodged batch first.");
      return;
    }
    try {
      const blob = await downloadLabels.mutateAsync(batchRef);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ipo_sticky_labels_${batchRef}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download sticky labels.");
    }
  }

  return (
    <div className="space-y-5">
      <Card className="mrpsl-card p-4 flex items-end gap-4 flex-wrap">
        <div className="space-y-1.5 w-72">
          <label className="mrpsl-label">Lodged Batch</label>
          <Select value={batchRef} onValueChange={(v) => setBatchRef(v ?? "")}>
            <SelectTrigger className="mrpsl-input">
              <SelectValue placeholder="Select a lodged batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.batchReference} value={b.batchReference}>
                  {b.batchReference} — {b.register}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {!batchRef ? (
        <Card className="mrpsl-card p-10 flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
          <AlertCircle className="h-6 w-6 opacity-40" />
          <p className="text-sm">Select a lodged batch above to compose notifications or view the delivery report.</p>
        </Card>
      ) : (
        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="h-auto p-1 bg-muted rounded-xl gap-0.5">
            <TabsTrigger
              value="compose"
              className="rounded-lg px-4 py-2 text-[13px] font-medium data-active:bg-background data-active:shadow-sm cursor-pointer"
            >
              Compose &amp; Send
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              className="rounded-lg px-4 py-2 text-[13px] font-medium data-active:bg-background data-active:shadow-sm cursor-pointer"
            >
              Delivery Report
            </TabsTrigger>
          </TabsList>

          <div className="mt-5">
            <TabsContent value="compose" className="space-y-5">
              <IpoEmailComposer batchRef={batchRef} sentBy={currentUser?.email ?? ""} />

              {/* Postal dispatch — sticky labels (preserved) */}
              <Card className="mrpsl-card p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Postal Dispatch</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Download sticky labels for postal dispatch to the batch&apos;s approved subscribers.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!batchRef || downloadLabels.isPending}
                  onClick={handleDownloadLabels}
                >
                  {downloadLabels.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download Sticky Labels (CSV)
                </Button>
              </Card>
            </TabsContent>

            <TabsContent value="delivery">
              <IpoEmailDeliveryReport batchRef={batchRef} />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
