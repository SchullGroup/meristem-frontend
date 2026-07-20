"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, UserCheck } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { DematRequest } from "./demat-types";
import { DematApprovalComparison } from "./demat-approval-comparison";

interface Props {
  requests: DematRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, comment: string) => void;
}

export function DematIcuApproval({ requests, onApprove, onReject }: Props) {
  const [selectedRequest, setSelectedRequest] = useState<DematRequest | null>(
    null,
  );

  if (selectedRequest) {
    return (
      <DematApprovalComparison
        request={selectedRequest}
        approveLabel="ICU Approve — Ready for Lodgment"
        onBack={() => setSelectedRequest(null)}
        onApprove={onApprove}
        onReject={onReject}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ICU Approval</h2>
          <p className="text-sm text-muted-foreground">
            Final internal review before submission to CSCS for lodgment.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {requests.length} pending
        </Badge>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  REQUEST ID
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  CERT NO(S)
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  HOLDER
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  CHN
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  REGISTER
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  UNITS
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  VALUE (&#8358;)
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  CREATED
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                      <p>No requests pending ICU approval.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      {request.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {request.certificateNos.map((certNo) => (
                          <span
                            key={certNo}
                            className="font-mono text-xs text-muted-foreground"
                          >
                            {certNo}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{request.holderName}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {request.holderChn}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{request.registerSymbol}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNumber(request.totalUnits)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatNumber(request.totalUnits * request.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.createdAt}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRequest(request)}
                        className="flex items-center gap-1"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Review
                      </Button>
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
