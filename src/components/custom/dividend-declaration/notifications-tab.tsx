"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDividendFlows, useDividendFlow } from "@/hooks/useDividendDeclarationFlow";
import { BatchList, MetricCard } from "./batch-list";
import { DetailHeader } from "./detail-header";
import { ShareholderTable } from "./shareholder-table";
import type { ShareholderColumn } from "./shareholder-table";
import { EmailTemplateDialog } from "./email-template-dialog";

const RECIPIENT_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "email",
  "netAmount",
  "emailStatus",
  "deliveryStatus",
];

const BOUNCED_COLUMNS: ShareholderColumn[] = [
  "serial",
  "accountNumber",
  "holderName",
  "email",
  "netAmount",
  "deliveryStatus",
];

export function NotificationsTab() {
  const { data: flows = [], isLoading } = useDividendFlows({
    status: ["PARTIALLY_PAID", "PAID"],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <BatchNotifications id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Processed dividend batches — open a batch to email shareholders and view delivery reports.
        Approvers are notified automatically when a run is initiated.
      </p>
      <BatchList
        flows={flows}
        isLoading={isLoading}
        actionLabel="Open Batch"
        onOpen={(d) => setSelectedId(d.id)}
        emptyMessage="No processed batches to notify shareholders about yet."
      />
    </div>
  );
}

function BatchNotifications({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: record, isLoading } = useDividendFlow(id);
  const [tab, setTab] = useState<"recipients" | "delivery">("recipients");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailRowIds, setEmailRowIds] = useState<string[] | undefined>(undefined);

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel="Back to Notifications" onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const rows = record.prelist;
  const sent = rows.filter((r) => r.emailStatus === "SENT");
  const delivered = rows.filter((r) => r.deliveryStatus === "DELIVERED");
  const bounced = rows.filter((r) => r.deliveryStatus === "BOUNCED");

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

  function openEmail(ids?: string[]) {
    setEmailRowIds(ids);
    setEmailOpen(true);
  }

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel="Back to Notifications"
        onBack={onBack}
        title={`Notifications — ${record.paymentNumber}`}
        subtitle={`${record.registerName} (${record.registerSymbol})`}
        actions={
          <Button className="gap-1.5" onClick={() => openEmail(undefined)}>
            <Mail className="h-4 w-4" /> Send to All ({rows.length.toLocaleString()})
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Recipients" value={rows.length.toLocaleString()} />
        <MetricCard label="Emails Sent" value={sent.length.toLocaleString()} tone="text-blue-700" />
        <MetricCard label="Delivered" value={delivered.length.toLocaleString()} tone="text-green-700" />
        <MetricCard label="Not Received (Bounced)" value={bounced.length.toLocaleString()} tone="text-red-600" />
      </div>

      <div className="inline-flex rounded-lg border p-1 bg-muted/30">
        {(
          [
            { key: "recipients", label: "Recipients" },
            { key: "delivery", label: `Delivery Report (${bounced.length} not received)` },
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

      {tab === "recipients" ? (
        <>
          {selected.size > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
              <span className="text-sm font-medium text-primary">
                {selected.size} recipient{selected.size !== 1 ? "s" : ""} selected
              </span>
              <Button size="sm" className="gap-1.5" onClick={() => openEmail(Array.from(selected))}>
                <Send className="h-3.5 w-3.5" /> Send Email to Selected
              </Button>
            </div>
          )}
          <ShareholderTable
            rows={rows}
            columns={RECIPIENT_COLUMNS}
            selectable
            selectedIds={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        </>
      ) : (
        <>
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-[13px] text-muted-foreground">
            <strong className="text-foreground">{delivered.length}</strong> delivered ·{" "}
            <strong className="text-red-600">{bounced.length}</strong> not received. The list below
            shows shareholders who were emailed but did not receive it.
          </div>
          <ShareholderTable
            rows={bounced}
            columns={BOUNCED_COLUMNS}
            emptyMessage="No bounced emails — everyone received their notification (or none sent yet)."
          />
        </>
      )}

      <EmailTemplateDialog
        record={record}
        open={emailOpen}
        onOpenChange={setEmailOpen}
        rowIds={emailRowIds}
        onSent={() => setSelected(new Set())}
      />
    </div>
  );
}
