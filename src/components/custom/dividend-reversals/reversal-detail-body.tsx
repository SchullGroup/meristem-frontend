"use client";

import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReversalRequest } from "@/types/dividend-reversal-flow";
import {
  REVERSAL_TYPE_LABEL,
  formatDate,
  formatNaira,
  reversalStatusBadgeClass,
  reversalTypeBadgeClass,
} from "./helpers";

// Shared read-only body of a reversal request — reused by the HOP review modal
// and the read-only detail modal (Pending View / History View).
export function ReversalDetailBody({
  request,
  showDecision = false,
}: {
  request: ReversalRequest;
  showDecision?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge
          className={`border-0 text-[12px] ${reversalTypeBadgeClass(request.reversalType)}`}
        >
          {REVERSAL_TYPE_LABEL[request.reversalType]}
        </Badge>
        <Badge
          className={`border-0 text-[12px] ${reversalStatusBadgeClass(request.status)}`}
        >
          {request.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4 border border-border/60 text-sm">
        <Field label="Holder Name" value={request.holderName} />
        <Field label="Register" value={request.registerSymbol} />
        <Field label="Account Number" value={request.accountNumber} mono />
        <Field label="Dividend Number" value={request.dividendNumber} mono />
        <Field label="Amount" value={formatNaira(request.amount)} />
        <Field label="Requested By" value={request.requestedBy} />
        <Field label="Date Requested" value={formatDate(request.dateRequested)} />
        <Field label="Request Ref" value={request.id} mono />
      </div>

      <div>
        <div className="mrpsl-section-title">Reason for Reversal</div>
        <p className="text-sm mt-1">{request.reason}</p>
      </div>

      <div>
        <div className="mrpsl-section-title mb-1">Supporting Document</div>
        {request.supportingDocName ? (
          <div className="inline-flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2 bg-background">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{request.supportingDocName}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No document attached.
          </p>
        )}
      </div>

      {showDecision && request.status !== "PENDING" && (
        <div className="rounded-xl border border-border/60 p-4 space-y-3">
          <div className="mrpsl-section-title">Decision</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field
              label="Outcome"
              value={request.status === "APPROVED" ? "Approved" : "Rejected"}
            />
            <Field label="Decided By" value={request.decidedBy ?? "—"} />
            <Field
              label="Decision Date"
              value={formatDate(request.decisionDate)}
            />
          </div>
          {request.decisionComment && (
            <div>
              <div className="mrpsl-section-title">Decision Comment</div>
              <p className="text-sm mt-1">{request.decisionComment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mrpsl-section-title">{label}</div>
      <div className={`font-medium mt-0.5 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
