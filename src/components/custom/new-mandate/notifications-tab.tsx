"use client";

import { useState } from "react";
import { Mail, ClipboardList } from "lucide-react";
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
import {
  useMandateBatches,
  useMandateNotificationLog,
} from "@/hooks/useMandatePaymentFlow";
import type { MandateBatch } from "@/types/mandate-payment-flow";
import { batchTotalAmount, formatNaira } from "./helpers";
import { MandateEmailDialog } from "./mandate-email-dialog";

export function NotificationsTab() {
  const { data: batches = [], isLoading } = useMandateBatches({
    status: ["PARTIALLY_PAID", "PAID"],
  });
  const { data: log = [] } = useMandateNotificationLog();
  const [emailBatch, setEmailBatch] = useState<MandateBatch | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [reportBatchId, setReportBatchId] = useState<string | null>(null);

  const shareholderLog = log.filter((l) => l.recipientType === "SHAREHOLDERS");

  function sentCountFor(batchId: string) {
    return shareholderLog
      .filter((l) => l.batchId === batchId)
      .reduce((s, l) => s + l.recipients.length, 0);
  }

  const reportEntries = reportBatchId
    ? shareholderLog.filter((l) => l.batchId === reportBatchId)
    : [];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Email dividend payment advice to shareholders of a processed mandate
        batch. Stakeholders are notified automatically as the batch moves through
        approval; shareholder dispatch is manual and tracked below.
      </p>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">BATCH REF</th>
                <th className="px-4 py-3 text-center">SHAREHOLDERS</th>
                <th className="px-4 py-3 text-center">GATEWAY</th>
                <th className="px-4 py-3 text-right">TOTAL PAYOUT</th>
                <th className="px-4 py-3 text-center">EMAILS SENT</th>
                <th className="px-4 py-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : batches.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No processed batches to notify shareholders about yet.
                  </td>
                </tr>
              ) : (
                batches.map((b) => {
                  const sent = sentCountFor(b.id);
                  return (
                    <tr key={b.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono font-semibold text-[13px]">
                        {b.batchRef}
                      </td>
                      <td className="px-4 py-3 tabular text-center">
                        {b.shareholders.length.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">{b.gateway}</td>
                      <td className="px-4 py-3 tabular text-right font-bold text-green-700">
                        {formatNaira(batchTotalAmount(b))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sent > 0 ? (
                          <Badge className="bg-green-100 text-green-800 border-0 text-[12px]">
                            {sent.toLocaleString()} sent
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-0 text-[12px]">
                            Not sent
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              setEmailBatch(b);
                              setEmailOpen(true);
                            }}
                          >
                            <Mail className="h-3.5 w-3.5" /> Send Email
                          </Button>
                          {sent > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => setReportBatchId(b.id)}
                            >
                              <ClipboardList className="h-3.5 w-3.5" /> Delivery
                              Report
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-bold mb-3">Sent Log</h3>
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">BATCH REF</th>
                  <th className="px-4 py-3">SUBJECT</th>
                  <th className="px-4 py-3">RECIPIENTS</th>
                  <th className="px-4 py-3 text-center">TRIGGER</th>
                  <th className="px-4 py-3">SENT BY</th>
                  <th className="px-4 py-3">SENT AT</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {log.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No notifications sent yet.
                    </td>
                  </tr>
                ) : (
                  log.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 font-mono">{entry.batchRef}</td>
                      <td className="px-4 py-3">{entry.subject}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.recipients.length.toLocaleString()}{" "}
                        {entry.recipientType === "STAKEHOLDERS"
                          ? "stakeholder"
                          : "shareholder"}
                        {entry.recipients.length !== 1 ? "s" : ""}
                        {entry.undelivered?.length
                          ? ` · ${entry.undelivered.length} failed`
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          className={`border-0 text-[12px] ${
                            entry.trigger === "AUTOMATIC"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {entry.trigger === "AUTOMATIC" ? "Automatic" : "Manual"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{entry.sentBy}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(entry.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <MandateEmailDialog
        batch={emailBatch}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />

      {/* Delivery report — which recipients did not receive the email (§6.9) */}
      <Dialog
        open={!!reportBatchId}
        onOpenChange={(v) => !v && setReportBatchId(null)}
      >
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>Email Delivery Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reportEntries.map((entry) => (
              <div key={entry.id} className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold">{entry.subject}</span>
                  <span className="text-muted-foreground">
                    {new Date(entry.sentAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="mrpsl-section-title">Delivered</div>
                    <div className="text-lg font-bold text-green-600 tabular mt-0.5">
                      {(
                        entry.recipients.length - (entry.undelivered?.length ?? 0)
                      ).toLocaleString()}
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="mrpsl-section-title">Not Delivered</div>
                    <div className="text-lg font-bold text-red-600 tabular mt-0.5">
                      {(entry.undelivered?.length ?? 0).toLocaleString()}
                    </div>
                  </Card>
                </div>
                {entry.undelivered && entry.undelivered.length > 0 && (
                  <div className="border border-red-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-red-50 text-[12px] font-bold uppercase tracking-wide text-red-700">
                      Undelivered Recipients
                    </div>
                    <ul className="divide-y text-[13px]">
                      {entry.undelivered.map((r) => (
                        <li key={r} className="px-3 py-2 text-red-700">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {reportEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No email has been sent for this batch yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
