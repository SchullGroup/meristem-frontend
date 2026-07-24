"use client";

import { useState } from "react";
import { Plus, FileSpreadsheet, Loader2, Eye, Pencil, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { downloadCsvData } from "@/lib/utils/csv-template";
import {
  useDividendFlows,
  useDividendFlow,
  useGeneratePrelist,
  useForwardToIcu,
} from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import {
  formatFlowStatus,
  formatNaira,
  getTierBadge,
  statusBadgeClass,
} from "./helpers";
import { NewDividendForm } from "./new-dividend-form";
import { DetailHeader } from "./detail-header";
import { MetricCard } from "./batch-list";
import { ShareholderTable, prelistCsvRows } from "./shareholder-table";
import type { ShareholderColumn } from "./shareholder-table";

const PRELIST_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "chn",
  "holderName",
  "address",
  "category",
  "bvn",
  "units",
  "grossAmount",
  "whtAmount",
  "netAmount",
  "bankName",
  "bankAccountNumber",
  "sortCode",
];

export function AllDividendsTab() {
  const { currentUser } = useStore();
  const { data: flows = [], isLoading } = useDividendFlows();
  const generatePrelistMutation = useGeneratePrelist();

  const [view, setView] = useState<"list" | "create" | "prelist">("list");
  const [editRecord, setEditRecord] = useState<DividendFlowRecord | null>(null);
  const [prelistId, setPrelistId] = useState<string | null>(null);

  const canInitiate = !["ENQUIRY_ONLY", "AUDIT_REVIEWER"].includes(
    currentUser?.roles?.[0] || "",
  );

  function backToList() {
    setView("list");
    setEditRecord(null);
    setPrelistId(null);
  }

  function handleGeneratePrelist(id: string) {
    generatePrelistMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Prelist generated for eligible shareholders.");
          setPrelistId(id);
          setView("prelist");
        },
        onError: (err) => toast.error(err?.message || "Failed to generate prelist."),
      },
    );
  }

  if (view === "create") {
    return (
      <NewDividendForm editRecord={editRecord} onCancel={backToList} onSuccess={backToList} />
    );
  }

  if (view === "prelist" && prelistId) {
    return <PrelistScreen id={prelistId} onBack={backToList} />;
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
                    <td className="px-4 py-3 tabular text-center">₦{d.rate.toFixed(4)}</td>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => {
                            setPrelistId(d.id);
                            setView("prelist");
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" /> View Prelist
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PrelistScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useDividendFlow(id);
  const forwardMutation = useForwardToIcu();

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to All Dividends" onBack={onBack} title="Loading prelist…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const prelist = record.prelist;
  const mandated = prelist.filter((r) => r.category === "MANDATED").length;
  const others = prelist.length - mandated;
  const canForward = record.status === "PRELIST_GENERATED";

  function handleCsv() {
    const { headers, body } = prelistCsvRows(prelist);
    downloadCsvData(headers, body, `dividend_prelist_${record!.paymentNumber.replace("/", "-")}.csv`);
    toast.success("Prelist exported as CSV.");
  }

  function handleForward() {
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    forwardMutation.mutate(
      { id: record!.id, actor: currentUser.email },
      {
        onSuccess: () => {
          toast.success("Forwarded to ICU for 1st approval.");
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to forward."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to All Dividends"
        onBack={onBack}
        title={`Prelist — ${record.paymentNumber}`}
        subtitle={`${record.registerName} (${record.registerSymbol}) · eligible shareholders & registrar details`}
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={handleCsv}>
              <FileSpreadsheet className="h-4 w-4" /> Download CSV
            </Button>
            {canForward && (
              <Button
                className="gap-1.5"
                onClick={handleForward}
                disabled={forwardMutation.isPending}
              >
                <Send className="h-4 w-4" /> Forward to ICU for Approval
                {forwardMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Eligible Shareholders" value={prelist.length.toLocaleString()} />
        <MetricCard label="Mandated" value={mandated.toLocaleString()} tone="text-green-700" />
        <MetricCard label="Others (KYC conflict)" value={others.toLocaleString()} tone="text-amber-600" />
        <MetricCard label="Gross Liability" value={formatNaira(record.grossLiability)} />
        <MetricCard label="Net Payout" value={formatNaira(record.netLiability)} tone="text-green-700" />
      </div>

      <ShareholderTable
        rows={prelist}
        columns={PRELIST_COLUMNS}
        bankFilter
        categoryFilter
      />
    </div>
  );
}
