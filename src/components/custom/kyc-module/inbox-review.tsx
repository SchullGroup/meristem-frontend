"use client";

import { useState } from "react";
import { Check, X, Loader2, Send, FileQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  useKycRequest,
  useSubmitInboxRequest,
  useRejectInboxRequest,
  useRequestAdditionalDoc,
} from "@/hooks/useKycModule";
import { CHANNEL_SHORT, requestStatusClass, requestStatusLabel } from "./helpers";
import { DetailHeader } from "./detail-header";
import { DocList } from "./doc-list";
import { DocAttach } from "./doc-attach";
import type { KycDoc } from "@/types/kyc-module";

/**
 * Shared review screen for CSCS + Mericonnect inbox items: side-by-side
 * old-vs-new with per-field accept, document viewer/attach, and
 * submit / reject / (Mericonnect) request-additional-document actions.
 */
export function InboxReview({
  id,
  onBack,
  backLabel,
  allowRequestDoc = false,
}: {
  id: string;
  onBack: () => void;
  backLabel: string;
  allowRequestDoc?: boolean;
}) {
  const { currentUser } = useStore();
  const { data: record, isLoading } = useKycRequest(id);
  const submit = useSubmitInboxRequest();
  const reject = useRejectInboxRequest();
  const requestDoc = useRequestAdditionalDoc();

  const [accepted, setAccepted] = useState<Set<string> | null>(null);
  const [extraDocs, setExtraDocs] = useState<KycDoc[]>([]);
  const [reason, setReason] = useState("");

  if (isLoading || !record) {
    return (
      <div className="space-y-4">
        <DetailHeader backLabel={backLabel} onBack={onBack} title="Loading…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const changedFields = record.changes.filter((c) => c.oldValue !== c.newValue);
  // Default: all changed fields accepted.
  const acc = accepted ?? new Set(changedFields.map((c) => c.field));
  const readOnly = record.status !== "DRAFT";

  function toggle(field: string) {
    const next = new Set(acc);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    setAccepted(next);
  }

  function doSubmit() {
    if (!currentUser?.email) return toast.error("Your session has expired. Please login again.");
    submit.mutate(
      {
        id: record!.id,
        submittedBy: currentUser.email,
        acceptedFields: Array.from(acc),
        documents: extraDocs,
      },
      {
        onSuccess: () => {
          toast.success(`${record!.requestId} submitted for approval.`);
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to submit."),
      },
    );
  }

  function doReject() {
    if (!reason.trim()) return toast.error("A reason is required to reject.");
    reject.mutate(
      { id: record!.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Request rejected." + (allowRequestDoc ? " Synced back to Mericonnect." : ""));
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to reject."),
      },
    );
  }

  function doRequestDoc() {
    if (!reason.trim()) return toast.error("Describe the additional document required.");
    requestDoc.mutate(
      { id: record!.id, note: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Additional document requested — pushed back to Mericonnect.");
          onBack();
        },
        onError: (err) => toast.error(err?.message || "Failed to request document."),
      },
    );
  }

  const busy = submit.isPending || reject.isPending || requestDoc.isPending;

  return (
    <div className="space-y-5">
      <DetailHeader
        backLabel={backLabel}
        onBack={onBack}
        title={`${CHANNEL_SHORT[record.channel]} Review — ${record.requestId}`}
        subtitle={`${record.holderName} (${record.registerSymbol}) · Ref ${record.externalRef ?? "—"}`}
        actions={
          <Badge className={`border-0 ${requestStatusClass(record.status)}`}>
            {requestStatusLabel(record.status)}
          </Badge>
        }
      />

      {!readOnly && (
        <Card className="mrpsl-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="mrpsl-label">
                Reason{" "}
                <span className="font-normal text-muted-foreground">
                  (required to reject{allowRequestDoc ? " / request document" : ""})
                </span>
              </label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="resize-none" rows={2} />
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {allowRequestDoc && (
                <Button variant="outline" className="gap-1.5" onClick={doRequestDoc} disabled={busy}>
                  <FileQuestion className="h-4 w-4" /> Request Document
                </Button>
              )}
              <Button variant="destructive" className="gap-1.5" onClick={doReject} disabled={busy}>
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button className="gap-1.5" onClick={doSubmit} disabled={busy}>
                <Send className="h-4 w-4" /> Submit for Approval
                {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Comparison with per-field accept */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/20 border-b flex items-center justify-between">
          <span className="text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            Existing Record vs {CHANNEL_SHORT[record.channel]} Record
          </span>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                className="text-[12px] text-primary hover:underline"
                onClick={() => setAccepted(new Set(changedFields.map((c) => c.field)))}
              >
                Accept all
              </button>
              <button
                className="text-[12px] text-muted-foreground hover:underline"
                onClick={() => setAccepted(new Set())}
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-2">FIELD</th>
                <th className="px-4 py-2">EXISTING RECORD</th>
                <th className="px-4 py-2">{CHANNEL_SHORT[record.channel].toUpperCase()} RECORD</th>
                {!readOnly && <th className="px-4 py-2 text-center">ACCEPT</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {record.changes.map((c) => {
                const changed = c.oldValue !== c.newValue;
                return (
                  <tr key={c.field} className={changed ? "bg-amber-50/40" : ""}>
                    <td className="px-4 py-2 font-medium">{c.label}</td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">{c.oldValue || "—"}</td>
                    <td className="px-4 py-2 font-mono">
                      <span className={changed ? "font-semibold text-amber-800" : ""}>
                        {c.newValue || "—"}
                      </span>
                      {changed && <span className="ml-2 text-[11px] text-amber-600">← changed</span>}
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-2 text-center">
                        {changed ? (
                          <Checkbox checked={acc.has(c.field)} onCheckedChange={() => toggle(c.field)} />
                        ) : (
                          <span className="text-[12px] text-muted-foreground">same</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <DocList documents={record.documents} />

      {!readOnly && (
        <Card className="mrpsl-card p-5 space-y-3">
          <h3 className="font-semibold text-sm">Attach Additional Supporting Document</h3>
          <DocAttach docs={extraDocs} onChange={setExtraDocs} />
        </Card>
      )}

      {!readOnly && (
        <div className="text-[13px] text-muted-foreground">
          <Check className="h-3.5 w-3.5 inline mr-1 text-green-600" />
          {acc.size} of {changedFields.length} changed field(s) accepted.
        </div>
      )}
    </div>
  );
}
