"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { DematRequest } from "./demat-types";
import { DematApprovalComparison } from "./demat-approval-comparison";

interface Props {
  requests: DematRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, comment: string) => void;
}

export function DematCooApproval({ requests, onApprove, onReject }: Props) {
  const [selectedRequest, setSelectedRequest] = useState<DematRequest | null>(
    null,
  );

  if (selectedRequest) {
    return (
      <DematApprovalComparison
        request={selectedRequest}
        approveLabel="COO/CEO Approve — Forward to ICU"
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
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">COO / CEO Approval</h3>
          <Badge variant="secondary">{requests.length}</Badge>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        High-value requests (units &gt; 10M or value &gt; ₦5M) require
        executive approval.
      </p>

      {/* Info banner */}
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
        All requests in this queue exceed threshold limits and require COO/CEO
        sign-off before ICU processing.
      </div>

      {/* Table */}
      {requests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No pending executive approvals</p>
          <p className="text-xs text-muted-foreground">
            All high-value requests have been reviewed.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">REQUEST ID</th>
                  <th className="px-4 py-3">CERT NO(S)</th>
                  <th className="px-4 py-3">HOLDER</th>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3 text-right">UNITS</th>
                  <th className="px-4 py-3 text-right">VALUE (₦)</th>
                  <th className="px-4 py-3">CREATED</th>
                  <th className="px-4 py-3">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((req) => {
                  const value = req.totalUnits * req.unitPrice;
                  return (
                    <tr
                      key={req.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium">
                        {req.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {req.certificateNos.length === 1 ? (
                          req.certificateNos[0]
                        ) : (
                          <span title={req.certificateNos.join(", ")}>
                            {req.certificateNos[0]}{" "}
                            <span className="text-muted-foreground">
                              +{req.certificateNos.length - 1} more
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{req.holderName}</span>
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0"
                          >
                            High Value
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {req.holderChn}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(req.totalUnits)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(value)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {req.createdAt}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequest(req)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
