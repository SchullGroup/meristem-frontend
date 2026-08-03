"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileDown,
  History,
  Loader2,
  Undo2,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AgentCommissionApprovalDialog } from "./agent-commission-approval-dialog";
import {
  COMMISSION_STATUS_LABELS,
  COMMISSION_STATUS_STYLES,
  type AgentCommissionRecord,
} from "./agent-commission-types";

// Awaiting the agent-commission backend endpoint; the panel renders empty until it is wired up.
const INITIAL_COMMISSIONS: AgentCommissionRecord[] = [];

export function AgentCommissionPanel() {
  const [records, setRecords] =
    useState<AgentCommissionRecord[]>(INITIAL_COMMISSIONS);
  const [generatingFile, setGeneratingFile] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const currentUser = useStore((state) => state.currentUser);

  const byStatus = (...statuses: AgentCommissionRecord["status"][]) =>
    records.filter((r) => statuses.includes(r.status));

  const awaitingOps = byStatus("PENDING_OPS_REVIEW");
  const awaitingIcu = byStatus("PENDING_ICU_REVIEW");
  const approvedRecords = byStatus("APPROVED_FOR_PAYMENT");
  const rejectedRecords = byStatus("OPS_REJECTED", "ICU_REJECTED");

  const sum = (rows: AgentCommissionRecord[]) =>
    rows.reduce((s, r) => s + r.commissionAmount, 0);

  const totalApprovedForPayment = sum(approvedRecords);
  const totalAwaitingApproval = sum([...awaitingOps, ...awaitingIcu]);
  const totalCommissionPaid = sum(byStatus("PAID"));

  const reviewRecord = records.find((r) => r.id === reviewId) ?? null;

  const appendTrail = (
    record: AgentCommissionRecord,
    entry: AgentCommissionRecord["approvalTrail"][number],
  ) => ({ ...record, approvalTrail: [...record.approvalTrail, entry] });

  const handleDecision = (
    approved: boolean,
    remark: string,
    actor: string,
  ) => {
    if (!reviewRecord) return;
    const isOpsStage = reviewRecord.status === "PENDING_OPS_REVIEW";
    const stage = isOpsStage ? "OPS" : "ICU";

    const nextStatus: AgentCommissionRecord["status"] = approved
      ? isOpsStage
        ? "PENDING_ICU_REVIEW"
        : "APPROVED_FOR_PAYMENT"
      : isOpsStage
        ? "OPS_REJECTED"
        : "ICU_REJECTED";

    setRecords((prev) =>
      prev.map((r) =>
        r.id === reviewRecord.id
          ? {
              ...appendTrail(r, {
                stage,
                actor,
                action: approved ? "APPROVED" : "REJECTED",
                remark: remark || undefined,
                date: new Date().toISOString(),
              }),
              status: nextStatus,
            }
          : r,
      ),
    );

    toast.success(
      approved
        ? `${reviewRecord.agentName} approved at ${isOpsStage ? "first approval" : "ICU"} — ${
            isOpsStage ? "now awaiting ICU approval." : "now approved for payment."
          }`
        : `${reviewRecord.agentName} rejected at ${isOpsStage ? "first approval" : "ICU"}.`,
    );
  };

  const handleResubmit = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...appendTrail(r, {
                stage: "OPS",
                actor: currentUser.email,
                action: "RESUBMITTED",
                date: new Date().toISOString(),
              }),
              status: "PENDING_OPS_REVIEW",
            }
          : r,
      ),
    );
    toast.success(`${record.agentName} returned for first approval.`);
  };

  const handleMarkPaid = (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    // Belt and braces — the button is only rendered for approved rows.
    if (record.status !== "APPROVED_FOR_PAYMENT") {
      toast.error(
        "This commission must clear first approval and ICU approval before it can be paid.",
      );
      return;
    }
    if (!currentUser?.email) {
      toast.error("Your session has expired. Please login again.");
      return;
    }
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...appendTrail(r, {
                stage: "PAYMENT",
                actor: currentUser.email,
                action: "MARKED_PAID",
                date: new Date().toISOString(),
              }),
              status: "PAID",
            }
          : r,
      ),
    );
    toast.success(`Commission for ${record.agentName} marked as paid.`);
  };

  const handleGenerateFile = async () => {
    // Only fully approved commissions belong in a payment file.
    if (approvedRecords.length === 0) {
      toast.info(
        "No approved commissions to pay. Commissions must clear first approval and ICU approval first.",
      );
      return;
    }
    setGeneratingFile(true);
    await new Promise((r) => setTimeout(r, 900));
    setGeneratingFile(false);
    toast.success(
      `Commission payment file generated for ${approvedRecords.length} agents (₦${totalApprovedForPayment.toLocaleString()} total).`,
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Agents", value: records.length.toString() },
          {
            label: "Awaiting Approval",
            value: `₦${totalAwaitingApproval.toLocaleString()}`,
            sub: `${awaitingOps.length} first · ${awaitingIcu.length} ICU`,
          },
          {
            label: "Approved for Payment",
            value: `₦${totalApprovedForPayment.toLocaleString()}`,
            sub: `${approvedRecords.length} agents`,
            highlight: true,
          },
          {
            label: "Paid Commission",
            value: `₦${totalCommissionPaid.toLocaleString()}`,
          },
          {
            label: "Rejected",
            value: rejectedRecords.length.toString(),
          },
        ].map(({ label, value, sub, highlight }) => (
          <Card key={label} className="mrpsl-card p-3">
            <p className="mrpsl-label">{label}</p>
            <p
              className={`font-mono font-bold text-lg mt-1 ${highlight ? "text-primary" : ""}`}
            >
              {value}
            </p>
            {sub && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Info note */}
      <Card className="mrpsl-card p-3 bg-muted/30 border-dashed">
        <p className="text-xs text-muted-foreground">
          Commission is calculated on the value of each agent&apos;s
          applications that resulted in a refund. Rates are configured per agent
          in Offer Setup → Receiving Agents &amp; Stockbrokers. Every commission
          must clear <span className="font-semibold">first approval</span> and{" "}
          <span className="font-semibold">ICU approval</span> before it can be
          included in a payment file or marked as paid.
        </p>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerateFile}
          disabled={generatingFile || approvedRecords.length === 0}
        >
          {generatingFile ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 mr-2" /> Generate Commission Payment
              File
            </>
          )}
        </Button>
      </div>

      {/* Commission table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Agent Commission
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">
                  Agent Name
                </th>
                <th className="text-left px-4 py-2.5 font-medium">Type</th>
                <th className="text-right px-4 py-2.5 font-medium">
                  Applications
                </th>
                <th className="text-right px-4 py-2.5 font-medium">
                  Value Submitted
                </th>
                <th className="text-right px-4 py-2.5 font-medium">
                  Value Refunded
                </th>
                <th className="text-right px-4 py-2.5 font-medium">Rate (%)</th>
                <th className="text-right px-4 py-2.5 font-medium">
                  Commission Owed
                </th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const isRejected =
                  r.status === "OPS_REJECTED" || r.status === "ICU_REJECTED";
                const awaitingReview =
                  r.status === "PENDING_OPS_REVIEW" ||
                  r.status === "PENDING_ICU_REVIEW";
                const lastRemark = [...r.approvalTrail]
                  .reverse()
                  .find((e) => e.action === "REJECTED")?.remark;

                return (
                  <tr key={r.id} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 font-medium">{r.agentName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {r.agentType}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {r.totalApplications.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      ₦{(r.totalValueSubmitted / 1e6).toFixed(1)}M
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      ₦{(r.totalValueRefunded / 1e6).toFixed(1)}M
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {r.commissionRate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                      ₦{r.commissionAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={COMMISSION_STATUS_STYLES[r.status]}>
                        {COMMISSION_STATUS_LABELS[r.status]}
                      </Badge>
                      {isRejected && lastRemark && (
                        <p className="text-[11px] text-muted-foreground mt-1 max-w-56">
                          {lastRemark}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {awaitingReview && (
                        <Button
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setReviewId(r.id)}
                        >
                          {r.status === "PENDING_OPS_REVIEW"
                            ? "Review"
                            : "ICU Review"}
                        </Button>
                      )}
                      {r.status === "APPROVED_FOR_PAYMENT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => handleMarkPaid(r.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      {isRejected && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => handleResubmit(r.id)}
                        >
                          <Undo2 className="h-3 w-3 mr-1" />
                          Resubmit
                        </Button>
                      )}
                      {!awaitingReview && r.approvalTrail.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 ml-1"
                          onClick={() => setReviewId(r.id)}
                          aria-label={`Approval trail for ${r.agentName}`}
                        >
                          <History className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/35 mx-auto mb-3" />
                    <h3 className="font-semibold text-sm text-foreground">
                      No agent commissions
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-80 mx-auto">
                      Commission is computed per receiving agent once an
                      offer&apos;s refunds are processed. Configure agents and
                      their rates in Offer Setup → Receiving Agents &amp;
                      Stockbrokers.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AgentCommissionApprovalDialog
        open={reviewId !== null}
        onOpenChange={(v) => !v && setReviewId(null)}
        record={reviewRecord}
        onDecision={handleDecision}
      />
    </div>
  );
}
