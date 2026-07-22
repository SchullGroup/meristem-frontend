"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDividendFlows,
  useNotificationLog,
} from "@/hooks/useDividendDeclarationFlow";
import type { DividendFlowRecord } from "@/types/dividend-declaration-flow";
import { formatNaira } from "./helpers";
import { EmailTemplateDialog } from "./email-template-dialog";

export function NotificationsTab() {
  const { data: flows = [], isLoading } = useDividendFlows({
    status: ["PARTIALLY_PAID", "PAID"],
  });
  const { data: log = [] } = useNotificationLog();
  const [selected, setSelected] = useState<DividendFlowRecord | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Send dividend payment advice to all shareholders of an initiated payment run.
          Approvers are notified automatically by the system as soon as a run is initiated —
          see the Sent Log below.
        </p>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="px-4 py-3">PAYMENT NO</th>
                <th className="px-4 py-3">REGISTER</th>
                <th className="px-4 py-3 text-center">GATEWAY</th>
                <th className="px-4 py-3 text-center">NET PAYOUT</th>
                <th className="px-4 py-3 text-center">STATUS</th>
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
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No initiated payment runs to notify shareholders about yet.
                  </td>
                </tr>
              ) : (
                flows.map((d) => (
                  <tr key={d.id} className="mrpsl-table-row">
                    <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                      {d.paymentNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold">{d.registerSymbol}</td>
                    <td className="px-4 py-3 text-center">{d.gateway}</td>
                    <td className="px-4 py-3 tabular text-center font-bold text-green-700">
                      {formatNaira(d.netLiability)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className={`border-0 text-[13px] ${
                          d.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {d.status === "PAID" ? "All Paid" : "Partially Paid"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setSelected(d);
                          setEmailOpen(true);
                        }}
                      >
                        <Mail className="h-3.5 w-3.5" /> Send Email
                      </Button>
                    </td>
                  </tr>
                ))
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
                  <th className="px-4 py-3">PAYMENT NO</th>
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
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No notifications sent yet.
                    </td>
                  </tr>
                ) : (
                  log.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 font-mono">{entry.paymentNumber}</td>
                      <td className="px-4 py-3">{entry.subject}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.recipients.length.toLocaleString()}{" "}
                        {entry.recipientType === "APPROVERS" ? "approver" : "shareholder"}
                        {entry.recipients.length !== 1 ? "s" : ""}
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

      <EmailTemplateDialog record={selected} open={emailOpen} onOpenChange={setEmailOpen} />
    </div>
  );
}
