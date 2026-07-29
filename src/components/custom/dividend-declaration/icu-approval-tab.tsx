"use client";

import { useState } from "react";
import { FileSpreadsheet, Gavel, Ban, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadCsvData } from "@/lib/utils/csv-template";
import {
  useDividendFlows,
  useDividendFlow,
  useDecideStage,
  useSetRowsExcluded,
  type FlowApprovalStage,
} from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatNaira } from "./helpers";
import { BatchList, MetricCard } from "./batch-list";
import { DetailHeader } from "./detail-header";
import { DecisionDialog } from "./decision-dialog";
import { ShareholderTable, prelistCsvRows } from "./shareholder-table";
import type { ShareholderColumn } from "./shareholder-table";

const REVIEW_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "address",
  "category",
  "bvn",
  "units",
  "grossAmount",
  "netAmount",
  "bankName",
  "bankAccountNumber",
  "sortCode",
];

const EDIT_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "bvn",
  "units",
  "netAmount",
  "bankName",
  "bankAccountNumber",
];

function summaryOf(record: DividendFlowRecord) {
  const rows = record.prelist;
  const included = rows.filter((r) => !r.excluded);
  return {
    total: rows.length,
    included: included.length,
    excluded: rows.length - included.length,
    net: included.reduce((s, r) => s + r.netAmount, 0),
  };
}

function exportCsv(record: DividendFlowRecord) {
  const { headers, body } = prelistCsvRows(record.prelist);
  downloadCsvData(headers, body, `dividend_${record.paymentNumber.replace("/", "-")}.csv`);
  toast.success("List exported as CSV.");
}

export function IcuApprovalTab({ stage }: { stage: FlowApprovalStage }) {
  if (stage === "ICU_2") return <Icu2 />;
  return <Icu1 />;
}

// ── ICU 1st Approval ─────────────────────────────────────────────────────────

function Icu1() {
  const { data: flows = [], isLoading } = useDividendFlows({ status: "PENDING_ICU_1" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totals = flows.reduce(
    (acc, d) => {
      acc.gross += d.grossLiability;
      acc.net += d.netLiability;
      acc.shareholders += d.totalShareholders;
      return acc;
    },
    { gross: 0, net: 0, shareholders: 0 },
  );

  if (selectedId) {
    return <Icu1Detail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Pending Review" value={flows.length.toLocaleString()} />
        <MetricCard label="Total Gross Liability" value={formatNaira(totals.gross)} />
        <MetricCard label="Total Shareholders" value={totals.shareholders.toLocaleString()} />
        <MetricCard label="Total Net Payout" value={formatNaira(totals.net)} tone="text-green-700" />
      </div>
      <p className="text-sm text-muted-foreground">
        {flows.length} declaration{flows.length !== 1 ? "s" : ""} pending 1st ICU sign-off
      </p>
      <BatchList
        flows={flows}
        isLoading={isLoading}
        actionLabel="Review"
        onOpen={(d) => setSelectedId(d.id)}
        emptyMessage="No declarations pending 1st ICU approval."
      />
    </div>
  );
}

function Icu1Detail({ id, onBack }: { id: string; onBack: () => void }) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useDividendFlow(id);
  const decideMutation = useDecideStage();
  const [decisionOpen, setDecisionOpen] = useState(false);

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to ICU Approval" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const s = summaryOf(record);

  function decide(decision: "APPROVE" | "REJECT", comment: string) {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    decideMutation.mutate(
      { id: record!.id, stage: "ICU_1", decision, actor: currentUser.email, comment: comment || undefined },
      {
        onSuccess: () => {
          toast.success(decision === "APPROVE" ? "Approved & forwarded to HOP." : "Declaration rejected.");
          setDecisionOpen(false);
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to ICU Approval"
        onBack={onBack}
        title={`ICU 1st Review — ${record.paymentNumber}`}
        subtitle={`${record.registerName} (${record.registerSymbol})`}
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={() => exportCsv(record)}>
              <FileSpreadsheet className="h-4 w-4" /> Download CSV
            </Button>
            <Button className="gap-1.5" onClick={() => setDecisionOpen(true)}>
              <Gavel className="h-4 w-4" /> Take Action
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Shareholders" value={s.total.toLocaleString()} />
        <MetricCard label="Gross Liability" value={formatNaira(record.grossLiability)} />
        <MetricCard label="Net Payout" value={formatNaira(record.netLiability)} tone="text-green-700" />
        <MetricCard label="Tier" value={`Tier ${record.tier}`} />
      </div>

      <ShareholderTable rows={record.prelist} columns={REVIEW_COLUMNS} bankFilter categoryFilter />

      <DecisionDialog
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        title={`ICU 1st Decision — ${record.paymentNumber}`}
        description="Approve to forward to HOP, or reject to send back to the initiator."
        approveLabel="Approve & Forward to HOP"
        onApprove={(c) => decide("APPROVE", c)}
        onReject={(c) => decide("REJECT", c)}
        isPending={decideMutation.isPending}
      />
    </div>
  );
}

// ── ICU 2nd Approval (editable + exclusions + Excluded Items) ────────────────

function Icu2() {
  const [subTab, setSubTab] = useState<"pending" | "excluded">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: pending = [], isLoading: loadingPending } = useDividendFlows({
    status: "PENDING_ICU_2",
  });
  const { data: allFlows = [] } = useDividendFlows();
  const withExclusions = allFlows.filter((f) => f.prelist.some((r) => r.excluded));

  if (selectedId) {
    return <Icu2Detail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border p-1 bg-muted/30">
        {(
          [
            { key: "pending", label: `Pending (${pending.length})` },
            { key: "excluded", label: `Excluded Items (${withExclusions.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              subTab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "pending" ? (
        <>
          <p className="text-sm text-muted-foreground">
            {pending.length} declaration{pending.length !== 1 ? "s" : ""} pending 2nd ICU sign-off
          </p>
          <BatchList
            flows={pending}
            isLoading={loadingPending}
            actionLabel="Review & Edit"
            onOpen={(d) => setSelectedId(d.id)}
            emptyMessage="No declarations pending 2nd ICU approval."
          />
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Batches with items excluded from their payment run
          </p>
          <BatchList
            flows={withExclusions}
            isLoading={false}
            actionLabel="View Excluded"
            onOpen={(d) => setSelectedId(d.id)}
            emptyMessage="No excluded items."
          />
        </>
      )}
    </div>
  );
}

function Icu2Detail({ id, onBack }: { id: string; onBack: () => void }) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useDividendFlow(id);
  const decideMutation = useDecideStage();
  const excludeMutation = useSetRowsExcluded();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [decisionOpen, setDecisionOpen] = useState(false);

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to ICU (2nd)" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const editable = record.status === "PENDING_ICU_2";
  const s = summaryOf(record);
  const rows = editable ? record.prelist : record.prelist.filter((r) => r.excluded);

  function toggle(rowId: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(rowId)) n.delete(rowId);
      else n.add(rowId);
      return n;
    });
  }
  function toggleAll(ids: string[]) {
    setSelected((prev) => (ids.every((i) => prev.has(i)) ? new Set() : new Set(ids)));
  }

  function setExcluded(excluded: boolean) {
    if (selected.size === 0) return toast.error("Select at least one record.");
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    excludeMutation.mutate(
      { id: record!.id, rowIds: Array.from(selected), excluded, actor: currentUser.email },
      {
        onSuccess: () => {
          toast.success(`${selected.size} record(s) ${excluded ? "excluded" : "re-included"}.`);
          setSelected(new Set());
        },
        onError: (err) => toast.error(err?.message || "Failed to update batch."),
      },
    );
  }

  function decide(decision: "APPROVE" | "REJECT", comment: string) {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    decideMutation.mutate(
      { id: record!.id, stage: "ICU_2", decision, actor: currentUser.email, comment: comment || undefined },
      {
        onSuccess: () => {
          toast.success(decision === "APPROVE" ? "Approved & forwarded to MD." : "Declaration rejected.");
          setDecisionOpen(false);
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
      },
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to ICU (2nd)"
        onBack={onBack}
        title={`${editable ? "ICU 2nd Review" : "Excluded Items"} — ${record.paymentNumber}`}
        subtitle={`${record.registerName} (${record.registerSymbol})`}
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={() => exportCsv(record)}>
              <FileSpreadsheet className="h-4 w-4" /> Download CSV
            </Button>
            {editable && (
              <Button className="gap-1.5" onClick={() => setDecisionOpen(true)}>
                <Gavel className="h-4 w-4" /> Take Action
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Records" value={s.total.toLocaleString()} />
        <MetricCard label="Included" value={s.included.toLocaleString()} tone="text-green-700" />
        <MetricCard label="Excluded" value={s.excluded.toLocaleString()} tone="text-red-600" />
        <MetricCard label="Net to Pay" value={formatNaira(s.net)} tone="text-green-700" />
      </div>

      {editable && selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-primary">
            {selected.size} record{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => setExcluded(false)}
              disabled={excludeMutation.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Re-include
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setExcluded(true)}
              disabled={excludeMutation.isPending}
            >
              <Ban className="h-3.5 w-3.5" /> Exclude from batch
            </Button>
          </div>
        </div>
      )}

      <ShareholderTable
        rows={rows}
        columns={EDIT_COLUMNS}
        selectable={editable}
        selectedIds={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        emptyMessage={editable ? "No records." : "No excluded items in this batch."}
      />

      {editable && (
        <DecisionDialog
          open={decisionOpen}
          onOpenChange={setDecisionOpen}
          title={`ICU 2nd Decision — ${record.paymentNumber}`}
          description={`${s.included} record(s) will be forwarded to MD; ${s.excluded} excluded.`}
          approveLabel="Forward to MD"
          onApprove={(c) => decide("APPROVE", c)}
          onReject={(c) => decide("REJECT", c)}
          isPending={decideMutation.isPending}
        />
      )}
    </div>
  );
}
