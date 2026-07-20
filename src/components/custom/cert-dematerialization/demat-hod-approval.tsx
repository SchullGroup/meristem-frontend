"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { DematRequest } from "./demat-types";
import { DematApprovalComparison } from "./demat-approval-comparison";

interface Props {
  requests: DematRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string, comment: string) => void;
}

export function DematHodApproval({ requests, onApprove, onReject }: Props) {
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedRequest, setSelectedRequest] = useState<DematRequest | null>(
    null
  );

  if (viewMode === "detail" && selectedRequest) {
    return (
      <DematApprovalComparison
        request={selectedRequest}
        approveLabel="Approve — Forward for Processing"
        onBack={() => {
          setSelectedRequest(null);
          setViewMode("list");
        }}
        onApprove={onApprove}
        onReject={onReject}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">HOD Approval</h2>
        <Badge variant="secondary">{requests.length}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Review dematerialization requests and approve or reject.
      </p>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Clock className="h-10 w-10 opacity-40" />
          <p className="text-sm">No pending requests</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    REQUEST ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    CERT NO(S)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    HOLDER
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    CHN
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    REGISTER
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                    UNITS
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                    VALUE (₦)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    CREATED
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const value = req.totalUnits * req.unitPrice;
                  const isHighValue =
                    req.totalUnits > 10_000_000 || value > 5_000_000;

                  return (
                    <tr
                      key={req.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        {req.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {Array.isArray(req.certificateNos)
                          ? req.certificateNos.join(", ")
                          : req.certificateNos}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {req.holderName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {req.holderChn}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {req.registerSymbol}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {formatNumber(req.totalUnits)}
                          {isHighValue && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1.5 py-0"
                            >
                              High Value
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        ₦{formatNumber(value)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                        {req.createdAt}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            setSelectedRequest(req);
                            setViewMode("detail");
                          }}
                        >
                          Review
                          <ChevronRight className="h-3.5 w-3.5" />
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
