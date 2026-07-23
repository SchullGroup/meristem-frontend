"use client";

import { useState } from "react";
import { Plus, FileSpreadsheet, Loader2, Eye, Pencil, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import {
  useDividendFlows,
  useGeneratePrelist,
} from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatFlowStatus, formatNaira, getTierBadge, statusBadgeClass, formatDate } from "./helpers";
import { NewDividendForm } from "./new-dividend-form";
import { PrelistDialog } from "./prelist-dialog";

export function AllDividendsTab() {
  const { currentUser } = useStore();
  const { data: flows = [], isLoading } = useDividendFlows();
  const generatePrelistMutation = useGeneratePrelist();

  const [view, setView] = useState<"list" | "create">("list");
  const [editRecord, setEditRecord] = useState<DividendFlowRecord | null>(null);
  const [prelistId, setPrelistId] = useState<string | null>(null);
  const [detailsRecord, setDetailsRecord] = useState<DividendFlowRecord | null>(null);

  const canInitiate = !["ENQUIRY_ONLY", "AUDIT_REVIEWER"].includes(
    currentUser?.roles?.[0] || "",
  );

  function handleGeneratePrelist(id: string) {
    generatePrelistMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Prelist generated for eligible shareholders.");
          setPrelistId(id);
        },
        onError: (err) => toast.error(err?.message || "Failed to generate prelist."),
      },
    );
  }

  function backToList() {
    setView("list");
    setEditRecord(null);
  }

  if (view === "create") {
    return (
      <NewDividendForm editRecord={editRecord} onCancel={backToList} onSuccess={backToList} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {flows.length} dividend payment run{flows.length !== 1 ? "s" : ""} in the system
        </p>
        {canInitiate && (
          <Button className="gap-1.5" onClick={() => setView("create")}>
            <Plus className="h-4 w-4" /> New Dividend Declaration
          </Button>
        )}
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">PAYMENT NO</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3 text-center">RATE</th>
                <th className="px-4 py-3 text-center">GROSS LIABILITY</th>
                <th className="px-4 py-3 text-center">SHAREHOLDERS</th>
                <th className="px-4 py-3 text-center">TIER</th>
                <th className="px-4 py-3 text-center">STATUS</th>
                <th className="px-4 py-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No dividend declarations yet.
                  </td>
                </tr>
              ) : (
                flows.map((d) => (
                  <tr key={d.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                      {d.paymentNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold">{d.registerSymbol}</td>
                    <td className="px-4 py-3">{d.dividendType}</td>
                    <td className="px-4 py-3 tabular text-center">
                      ₦{d.rate.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 tabular text-center font-bold">
                      {formatNaira(d.grossLiability)}
                    </td>
                    <td className="px-4 py-3 tabular text-center">
                      {d.totalShareholders.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${getTierBadge(d.tier)} text-[13px]`}>
                        Tier {d.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`border-0 text-[13px] ${statusBadgeClass(d.status)}`}>
                        {formatFlowStatus(d.status, d.rejectedAt)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.status === "DRAFT" ? (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={
                            generatePrelistMutation.isPending &&
                            generatePrelistMutation.variables?.id === d.id
                          }
                          onClick={() => handleGeneratePrelist(d.id)}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          Generate Prelist
                          {generatePrelistMutation.isPending &&
                            generatePrelistMutation.variables?.id === d.id && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                        </Button>
                      ) : d.status === "REJECTED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setEditRecord(d);
                            setView("create");
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit &amp; Resend
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPrelistId(d.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View Prelist
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDetailsRecord(d)}>
                              <Info className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PrelistDialog
        id={prelistId}
        open={!!prelistId}
        onOpenChange={(v) => !v && setPrelistId(null)}
      />

      <Dialog open={!!detailsRecord} onOpenChange={(v) => !v && setDetailsRecord(null)}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>Declaration Details — {detailsRecord?.paymentNumber}</DialogTitle>
          </DialogHeader>
          {detailsRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Register" value={`${detailsRecord.registerName} (${detailsRecord.registerSymbol})`} />
                <Field label="Type" value={detailsRecord.dividendType} />
                <Field label="Rate" value={`₦${detailsRecord.rate.toFixed(4)}`} />
                <Field label="WHT Rate" value={`${detailsRecord.isTaxExempt ? detailsRecord.exemptionRate ?? 0 : detailsRecord.whtRate}%`} />
                <Field label="Qualification Date" value={formatDate(detailsRecord.qualificationDate)} />
                <Field label="Closure Date" value={formatDate(detailsRecord.closureDate)} />
                <Field label="Payment Date" value={formatDate(detailsRecord.paymentDate)} />
                <Field label="Initiated By" value={detailsRecord.initiatedBy} />
                <Field label="Gross Liability" value={formatNaira(detailsRecord.grossLiability)} />
                <Field label="WHT Amount" value={formatNaira(detailsRecord.whtAmount)} />
                <Field label="Net Payout" value={formatNaira(detailsRecord.netLiability)} />
                <Field label="Shareholders" value={detailsRecord.totalShareholders.toLocaleString()} />
              </div>
              {detailsRecord.narrative && (
                <div>
                  <div className="mrpsl-section-title">Narrative</div>
                  <p className="text-sm mt-1">{detailsRecord.narrative}</p>
                </div>
              )}
              <div>
                <div className="mrpsl-section-title mb-2">Approval Trail</div>
                <div className="space-y-2">
                  {detailsRecord.approvalTrail.map((t, i) => (
                    <div key={i} className="text-[13px] flex justify-between border-b border-border/40 pb-1.5 last:border-0">
                      <span>
                        <strong>{t.stage}</strong> — {t.action.replace(/_/g, " ").toLowerCase()} by {t.actor}
                        {t.comment ? ` — "${t.comment}"` : ""}
                      </span>
                      <span className="text-muted-foreground shrink-0 ml-2">{formatDate(t.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mrpsl-section-title">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}
