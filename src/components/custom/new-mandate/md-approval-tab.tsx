"use client";

import { useState } from "react";
import { Download, Play, FileDown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import { useMandateBatches, useMdDecision } from "@/hooks/useMandatePaymentFlow";
import { batchTotalAmount, formatNaira } from "./helpers";
import { BatchListTable } from "./batch-list-table";
import { BatchDetailPanel } from "./batch-detail-panel";
import { downloadBatchListCsv, downloadShareholdersCsv } from "./csv";

// MD Approval (§6.7) — final executive sign-off. Two branching actions:
// initiate payment, or approve & forward the payment file for manual NIBSS run.
export function MdApprovalTab() {
  const { currentUser } = useStore();
  const { data: batches = [], isLoading } = useMandateBatches({
    status: "PENDING_MD",
  });
  const mdMutation = useMdDecision();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gateway, setGateway] = useState<"NIBSS" | "REMITA">("NIBSS");

  const selected: MandateBatch | null =
    batches.find((b) => b.id === selectedId) ?? null;
  const totalExposure = batches.reduce((s, b) => s + batchTotalAmount(b), 0);

  function requireSession() {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return false;
    }
    return true;
  }

  function handlePay() {
    if (!selected || !requireSession()) return;
    mdMutation.mutate(
      { id: selected.id, decision: "PAY", actor: currentUser!.email, gateway },
      {
        onSuccess: (res) => {
          toast.success(
            `Payment run initiated for ${res.batchRef} via ${gateway}. See Payment Results.`,
          );
          setSelectedId(null);
        },
        onError: (err) => toast.error(err?.message || "Failed to initiate payment."),
      },
    );
  }

  function handleManual() {
    if (!selected || !requireSession()) return;
    // The manual path downloads the payment file for the team to send to NIBSS.
    downloadShareholdersCsv(
      selected.shareholders,
      `payment_file_${selected.batchRef.replace("/", "-")}.csv`,
    );
    mdMutation.mutate(
      { id: selected.id, decision: "MANUAL", actor: currentUser!.email },
      {
        onSuccess: (res) => {
          toast.success(
            `Payment file for ${res.batchRef} downloaded — send to NIBSS manually.`,
          );
          setSelectedId(null);
        },
        onError: (err) => toast.error(err?.message || "Failed to forward batch."),
      },
    );
  }

  if (selected) {
    return (
      <BatchDetailPanel
        batch={selected}
        title="MD Final Approval"
        onBack={() => setSelectedId(null)}
        footer={
          <div className="w-full space-y-3">
            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <label className="mrpsl-label mb-0">Payment Gateway</label>
                <Select
                  value={gateway}
                  onValueChange={(v) =>
                    setGateway((v || "NIBSS") as "NIBSS" | "REMITA")
                  }
                >
                  <SelectTrigger className="mrpsl-input w-44">
                    <SelectValue placeholder="Gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIBSS">NIBSS</SelectItem>
                    <SelectItem value="REMITA">Remita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleManual}
                disabled={mdMutation.isPending}
              >
                <FileDown className="h-4 w-4" /> Approve &amp; Forward for Manual
                Processing
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handlePay}
                disabled={mdMutation.isPending}
              >
                <Play className="h-4 w-4" /> Approve &amp; Initiate Payment
                {mdMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="mrpsl-section-title">Batches Pending MD Sign-Off</div>
          <div className="text-xl font-bold tabular mt-1">
            {batches.length.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mrpsl-section-title">Total Exposure</div>
          <div className="text-xl font-bold tabular mt-1 text-green-700">
            {formatNaira(totalExposure)}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {batches.length} batch{batches.length !== 1 ? "es" : ""} awaiting final
          MD approval
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            downloadBatchListCsv(batches, "mandate_md_approval.csv");
            toast.success("Batch list exported as CSV.");
          }}
        >
          <Download className="h-4 w-4" /> Download CSV
        </Button>
      </div>

      <BatchListTable
        batches={batches}
        isLoading={isLoading}
        actionLabel="Review"
        onAction={(b) => {
          setGateway("NIBSS");
          setSelectedId(b.id);
        }}
        emptyLabel="No batches awaiting MD approval."
      />
    </div>
  );
}
