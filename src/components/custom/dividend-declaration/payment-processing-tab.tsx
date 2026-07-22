"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useDividendFlows,
  useInitiatePaymentRun,
} from "@/hooks/useDividendDeclarationFlow";
import { formatNaira } from "./helpers";

export function PaymentProcessingTab() {
  const { currentUser } = useStore();
  const { data: flows = [], isLoading } = useDividendFlows({ status: "PENDING_PAYMENT" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gateway, setGateway] = useState<"NIBSS" | "REMITA">("NIBSS");
  const initiateMutation = useInitiatePaymentRun();

  const selected =
    flows.find((f) => f.id === selectedId) ?? flows[0] ?? null;

  function handleInitiate() {
    if (!selected) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    initiateMutation.mutate(
      { id: selected.id, gateway, actor: currentUser.email },
      {
        onSuccess: (res) => {
          toast.success(
            `Payment run initiated via ${gateway}. See the Payment Results tab — ${res.status === "PAID" ? "all payments succeeded." : "some payments failed and need requeue."}`,
          );
        },
        onError: (err) => toast.error(err?.message || "Failed to initiate payment run."),
      },
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="mrpsl-card p-0 overflow-hidden lg:col-span-1">
        <div className="px-4 py-3 bg-muted/20 border-b text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
          Ready for Payment ({flows.length})
        </div>
        <div className="divide-y max-h-[480px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))
          ) : flows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No declarations awaiting payment processing.
            </div>
          ) : (
            flows.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`w-full text-left p-4 hover:bg-accent/40 transition-colors ${
                  selected?.id === d.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="font-semibold text-sm">{d.paymentNumber}</div>
                <div className="text-[13px] text-muted-foreground mt-0.5">
                  {d.registerSymbol} · {d.totalShareholders.toLocaleString()} shareholders
                </div>
                <div className="text-[13px] font-bold tabular mt-1 text-green-700">
                  {formatNaira(d.netLiability)}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        {!selected ? (
          <Card className="mrpsl-card p-12 text-center text-muted-foreground">
            Select a declaration from the list to process payment.
          </Card>
        ) : (
          <>
            <Card className="mrpsl-card p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Register" value={selected.registerSymbol} />
                <Stat label="Shareholders" value={selected.totalShareholders.toLocaleString()} />
                <Stat label="Gross Liability" value={formatNaira(selected.grossLiability)} />
                <Stat label="Net Payout" value={formatNaira(selected.netLiability)} tone="text-green-700" />
              </div>

              <div className="flex items-end gap-4 pt-2 border-t border-border/60">
                <div className="space-y-2">
                  <label className="mrpsl-label">Payment Gateway</label>
                  <Select value={gateway} onValueChange={(v) => setGateway((v || "NIBSS") as "NIBSS" | "REMITA")}>
                    <SelectTrigger className="mrpsl-input w-48">
                      <SelectValue placeholder="Payment Gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIBSS">NIBSS</SelectItem>
                      <SelectItem value="REMITA">Remita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="lg"
                  className="gap-1.5"
                  onClick={handleInitiate}
                  disabled={initiateMutation.isPending}
                >
                  <Play className="h-4 w-4" />
                  {initiateMutation.isPending ? "Processing payment run…" : "Initiate Payment Run"}
                  {initiateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              </div>
            </Card>

            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/20 border-b text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
                Payment File Preview — {selected.prelist.length} records
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header sticky top-0">
                    <tr>
                      <th className="px-3 py-2">ACCOUNT NO</th>
                      <th className="px-3 py-2">HOLDER NAME</th>
                      <th className="px-3 py-2">BANK NAME</th>
                      <th className="px-3 py-2 text-right">AMOUNT (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px] font-mono">
                    {selected.prelist.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2">{r.accountNumber}</td>
                        <td className="px-3 py-2 font-sans">{r.holderName}</td>
                        <td className="px-3 py-2 font-sans">{r.bankName}</td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {r.netAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="mrpsl-section-title">{label}</div>
      <div className={`font-bold mt-0.5 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
