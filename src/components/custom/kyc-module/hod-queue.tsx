"use client";

import { useMemo, useState } from "react";
import {
  Check,
  X,
  Undo2,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useKycRequests,
  useKycRequest,
  useKycDecision,
  useBulkApproveRequests,
  usePushToDividendMandate,
  useNibssBatch,
  type KycRequestFilters,
} from "@/hooks/useKycModule";
import { KYC_REGISTERS, OFFICERS } from "./seed-data";
import type { KycRequest } from "@/types/kyc-module";
import {
  CHANNEL_SHORT,
  channelBadgeClass,
  requestStatusClass,
  requestStatusLabel,
  ageingClass,
  formatDate,
  rowValidationClass,
} from "./helpers";
import { DetailHeader } from "./detail-header";
import { DiffView } from "./diff-view";
import { DocList } from "./doc-list";

export function HodQueue({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) {
    return <HodReview id={openId} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to KYC Home"
        onBack={onBack}
        title="HOD Approval Queue"
        subtitle="Unified queue across all channels — review, approve and push to dividend mandate."
      />

      <div className="inline-flex rounded-lg border p-1 bg-muted/30">
        {(
          [
            { key: "pending", label: "Pending Review" },
            { key: "approved", label: "Approved — Ready for Dividend Mandate" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending" ? (
        <PendingQueue onOpen={setOpenId} />
      ) : (
        <ApprovedQueue />
      )}
    </div>
  );
}

// ── Shared filter bar ────────────────────────────────────────────────────────

function useQueueFilters() {
  const [channel, setChannel] = useState("");
  const [register, setRegister] = useState("");
  const [officer, setOfficer] = useState("");
  const [ageing, setAgeing] = useState("");
  const filters: KycRequestFilters = {
    channel: (channel || undefined) as KycRequestFilters["channel"],
    registerSymbol: register || undefined,
    submittedBy: officer || undefined,
    ageingBucket: (ageing || undefined) as KycRequestFilters["ageingBucket"],
  };
  const bar = (
    <div className="flex flex-wrap gap-3 items-end">
      <FilterSelect label="Channel" value={channel} onChange={setChannel} placeholder="All Channels"
        options={[["STANDARD", "Standard"], ["NIBSS", "NIBSS"], ["CSCS", "CSCS"], ["MERICONNECT", "Mericonnect"]]} />
      <FilterSelect label="Register" value={register} onChange={setRegister} placeholder="All Registers"
        options={KYC_REGISTERS.map((r) => [r.symbol, r.symbol])} />
      <FilterSelect label="Officer" value={officer} onChange={setOfficer} placeholder="All Officers"
        options={OFFICERS.map((o) => [o, o])} />
      <FilterSelect label="Ageing" value={ageing} onChange={setAgeing} placeholder="Any Age"
        options={[["0-2", "0–2 days"], ["3-5", "3–5 days"], ["6+", "6+ days"]]} />
    </div>
  );
  return { filters, bar };
}

function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-col">
      <label className="mrpsl-label">{label}</label>
      <Select value={value} onValueChange={(v) => onChange(v || "")}>
        <SelectTrigger className="w-44 mrpsl-input">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Pending queue ────────────────────────────────────────────────────────────

function PendingQueue({ onOpen }: { onOpen: (id: string) => void }) {
  const { currentUser } = useStore();
  const { filters, bar } = useQueueFilters();
  const { data: rows = [], isLoading } = useKycRequests({
    ...filters,
    status: ["SUBMITTED", "HOD_REVIEW"],
  });
  const bulkApprove = useBulkApproveRequests();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ids = rows.map((r) => r.id);
  const allSel = ids.length > 0 && ids.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((p) => {
      const s = new Set(p);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  const channelBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    rows.filter((r) => selected.has(r.id)).forEach((r) => {
      map[r.channel] = (map[r.channel] || 0) + 1;
    });
    return map;
  }, [rows, selected]);

  function confirmBulk() {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    bulkApprove.mutate(
      { ids: Array.from(selected), actor: currentUser.email },
      {
        onSuccess: (res) => {
          toast.success(
            `${res.approved} approved.${res.skipped ? ` ${res.skipped} skipped (maker-checker).` : ""}`,
          );
          setSelected(new Set());
          setConfirmOpen(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to approve."),
      },
    );
  }

  return (
    <div className="space-y-4">
      {bar}

      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium text-primary">
            {selected.size} request{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set(ids))}>
              Select all {ids.length} matching
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setConfirmOpen(true)}>
              <ShieldCheck className="h-3.5 w-3.5" /> Bulk Approve
            </Button>
          </div>
        </div>
      )}

      <QueueTable
        rows={rows}
        isLoading={isLoading}
        selectable
        selectedIds={selected}
        allSelected={allSel}
        onToggle={toggle}
        onToggleAll={() => setSelected(allSel ? new Set() : new Set(ids))}
        onOpen={onOpen}
        actionLabel="Review"
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Approval</DialogTitle>
            <DialogDescription>
              You are approving {selected.size} request{selected.size !== 1 ? "s" : ""}. Requests you
              submitted yourself will be skipped (maker-checker).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {Object.entries(channelBreakdown).map(([c, n]) => (
              <div key={c} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {CHANNEL_SHORT[c as keyof typeof CHANNEL_SHORT]}
                </span>
                <span className="font-semibold">{n}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2 border-t border-border/60">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 gap-1.5" onClick={confirmBulk} disabled={bulkApprove.isPending}>
              <Check className="h-4 w-4" /> Approve {selected.size}
              {bulkApprove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Approved queue + Push to Dividend Mandate ────────────────────────────────

function ApprovedQueue() {
  const { currentUser } = useStore();
  const [register, setRegister] = useState("");
  const { data: rows = [], isLoading } = useKycRequests({
    status: "APPROVED",
    registerSymbol: register || undefined,
  });
  const push = usePushToDividendMandate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ids = rows.map((r) => r.id);
  const allSel = ids.length > 0 && ids.every((id) => selected.has(id));
  const chosen = rows.filter((r) => selected.has(r.id));
  const registersAffected = new Set(chosen.map((r) => r.registerSymbol));
  const withUnpaid = chosen.filter((r) => r.hasUnpaidDividend).length;

  function toggle(id: string) {
    setSelected((p) => {
      const s = new Set(p);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function confirmPush() {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    push.mutate(
      { ids: Array.from(selected), actor: currentUser.email },
      {
        onSuccess: (res) => {
          toast.success(`${res.pushed} record(s) pushed to Dividend Mandate Processing.`);
          setSelected(new Set());
          setConfirmOpen(false);
        },
        onError: (err) => toast.error(err?.message || "Failed to push."),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <FilterSelect label="Register" value={register} onChange={setRegister} placeholder="All Registers"
          options={KYC_REGISTERS.map((r) => [r.symbol, r.symbol])} />
        <Button
          className="gap-1.5"
          disabled={selected.size === 0}
          onClick={() => setConfirmOpen(true)}
        >
          <Send className="h-4 w-4" /> Push to Dividend Mandate ({selected.size})
        </Button>
      </div>

      <QueueTable
        rows={rows}
        isLoading={isLoading}
        selectable
        selectedIds={selected}
        allSelected={allSel}
        onToggle={toggle}
        onToggleAll={() => setSelected(allSel ? new Set() : new Set(ids))}
        emptyMessage="No approved records awaiting mandate push."
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Push to Dividend Mandate Processing</DialogTitle>
            <DialogDescription>
              Verified bank/KYC details will be written to the shareholder master record and posted
              to the dividend Mandating Queue as <strong>Mandated (Verified)</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Records</span>
              <span className="font-semibold">{chosen.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registers affected</span>
              <span className="font-semibold">{registersAffected.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">With unpaid dividend entitlements</span>
              <span className="font-semibold text-amber-700">{withUnpaid}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-border/60">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 gap-1.5" onClick={confirmPush} disabled={push.isPending}>
              <Send className="h-4 w-4" /> Confirm Push
              {push.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Queue table ──────────────────────────────────────────────────────────────

function QueueTable({
  rows,
  isLoading,
  selectable,
  selectedIds,
  allSelected,
  onToggle,
  onToggleAll,
  onOpen,
  actionLabel,
  emptyMessage = "No requests in the queue.",
}: {
  rows: KycRequest[];
  isLoading: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  allSelected?: boolean;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  onOpen?: (id: string) => void;
  actionLabel?: string;
  emptyMessage?: string;
}) {
  return (
    <Card className="mrpsl-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              {selectable && (
                <th className="px-3 py-2 w-10">
                  <Checkbox checked={allSelected} onCheckedChange={() => onToggleAll?.()} />
                </th>
              )}
              <th className="px-3 py-2">REQUEST ID</th>
              <th className="px-3 py-2">CHANNEL</th>
              <th className="px-3 py-2">NAME</th>
              <th className="px-3 py-2">CHN</th>
              <th className="px-3 py-2">REGISTER</th>
              <th className="px-3 py-2">FIELDS CHANGED</th>
              <th className="px-3 py-2">SUBMITTED BY</th>
              <th className="px-3 py-2">DATE</th>
              <th className="px-3 py-2 text-center">AGEING</th>
              <th className="px-3 py-2 text-center">DOCS</th>
              <th className="px-3 py-2">STATUS</th>
              {onOpen && <th className="px-3 py-2 text-center">ACTIONS</th>}
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 12 }).map((__, j) => (
                    <td key={j} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="mrpsl-table-row">
                  {selectable && (
                    <td className="px-3 py-2">
                      <Checkbox checked={selectedIds?.has(r.id)} onCheckedChange={() => onToggle?.(r.id)} />
                    </td>
                  )}
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {r.requestId}
                    {r.batchRef && <div className="text-[11px]">Batch {r.batchRef}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={`border-0 text-[12px] ${channelBadgeClass(r.channel)}`}>
                      {CHANNEL_SHORT[r.channel]}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-medium">{r.holderName}</td>
                  <td className="px-3 py-2 font-mono">{r.chn}</td>
                  <td className="px-3 py-2 font-semibold">{r.registerSymbol}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.batchRef ? "Bulk mandate" : r.changes.map((c) => c.label).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.submittedBy}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(r.submittedDate)}</td>
                  <td className={`px-3 py-2 text-center ${ageingClass(r.ageingDays)}`}>
                    {r.ageingDays}d
                  </td>
                  <td className="px-3 py-2 text-center">{r.documents.length}</td>
                  <td className="px-3 py-2">
                    <Badge className={`border-0 text-[12px] ${requestStatusClass(r.status)}`}>
                      {requestStatusLabel(r.status)}
                    </Badge>
                  </td>
                  {onOpen && (
                    <td className="px-3 py-2 text-center">
                      <Button size="sm" onClick={() => onOpen(r.id)}>
                        {actionLabel}
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Individual / batch review ────────────────────────────────────────────────

function HodReview({ id, onBack }: { id: string; onBack: () => void }) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useKycRequest(id);
  const { data: batch } = useNibssBatch(record?.batchRef);
  const decision = useKycDecision();
  const [reason, setReason] = useState("");

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to Queue" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  function decide(kind: "APPROVE" | "REJECT" | "RETURN") {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    if (kind !== "APPROVE" && !reason.trim())
      return toast.error("A reason is required to reject or return.");
    decision.mutate(
      { id: record!.id, decision: kind, actor: currentUser.email, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            kind === "APPROVE" ? "Request approved." : kind === "REJECT" ? "Request rejected." : "Returned to officer.",
          );
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to record decision."),
      },
    );
  }

  const decisionCard = (
    <Card className="mrpsl-card p-4 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="mrpsl-label">
            Reason <span className="font-normal text-muted-foreground">(required to reject/return)</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
            rows={2}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="gap-1.5" onClick={() => decide("RETURN")} disabled={decision.isPending}>
            <Undo2 className="h-4 w-4" /> Return
          </Button>
          <Button variant="destructive" className="gap-1.5" onClick={() => decide("REJECT")} disabled={decision.isPending}>
            <X className="h-4 w-4" /> Reject
          </Button>
          <Button className="gap-1.5" onClick={() => decide("APPROVE")} disabled={decision.isPending}>
            <Check className="h-4 w-4" /> Approve
            {decision.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </div>
    </Card>
  );

  const summary = (
    <Card className="mrpsl-card p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <SummaryField label="Request ID" value={record.requestId} />
        <SummaryField label="Channel" value={CHANNEL_SHORT[record.channel]} />
        <SummaryField label="Shareholder" value={record.holderName} />
        <SummaryField label="Register" value={record.registerSymbol} />
        <SummaryField label="Submitted By" value={record.submittedBy} />
        <SummaryField label="Date" value={formatDate(record.submittedDate)} />
        {record.reason && <SummaryField label="Reason" value={record.reason} />}
        <SummaryField label="Documents" value={String(record.documents.length)} />
      </div>
    </Card>
  );

  // NIBSS bulk batch review
  if (record.batchRef && batch) {
    const active = batch.rows.filter((r) => r.rowStatus !== "REMOVED");
    return (
      <div className="space-y-5">
        <DetailHeader
          backLabel="Back to Queue"
          onBack={onBack}
          title={`Batch Review — ${batch.batchRef}`}
          subtitle={`${record.channel} bulk mandate · ${active.length} rows`}
        />
        {decisionCard}
        {summary}
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header sticky top-0">
                <tr>
                  <th className="px-3 py-2">ROW</th>
                  <th className="px-3 py-2">NAME</th>
                  <th className="px-3 py-2">NEW BANK</th>
                  <th className="px-3 py-2">NEW ACCT</th>
                  <th className="px-3 py-2">BVN</th>
                  <th className="px-3 py-2">VALIDATION</th>
                  <th className="px-3 py-2 text-center">DOC</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px] font-mono">
                {active.map((r) => (
                  <tr key={r.rowNo}>
                    <td className="px-3 py-2 text-muted-foreground">{r.rowNo}</td>
                    <td className="px-3 py-2 font-sans">{r.holderName}</td>
                    <td className="px-3 py-2 font-sans">{r.newBank}</td>
                    <td className="px-3 py-2">{r.newAccountNo}</td>
                    <td className="px-3 py-2">{r.bvn}</td>
                    <td className="px-3 py-2">
                      <Badge className={`border-0 text-[11px] ${rowValidationClass(r.validationStatus)}`}>
                        {r.validationStatus}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.documentAttached ? "Y" : "N"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // Individual review
  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to Queue"
        onBack={onBack}
        title={`Review — ${record.requestId}`}
        subtitle={`${CHANNEL_SHORT[record.channel]} · ${record.holderName} (${record.registerSymbol})`}
      />
      {decisionCard}
      {summary}
      <DiffView changes={record.changes} />
      <DocList documents={record.documents} />
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-[13px]">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
