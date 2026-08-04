"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  X,
  ArrowLeft,
  FileCheck,
  Loader2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  approveConsolidationRequest,
  rejectConsolidationRequest,
} from "@/actions/certConsolidation";
import { useStore } from "@/lib/store";
import type { CertificateConsolidation } from "@/types/cscs";
import { formatNumber } from "@/lib/utils/format";
import { toast } from "sonner";

interface Props {
  requests: CertificateConsolidation[]; // already filtered to PENDING by the parent
  loading?: boolean;
  onRefetch: () => void; // call after a successful approve/reject
}

export function ConsolidationIcu({ requests, loading, onRefetch }: Props) {
  const currentUser = useStore((state) => state.currentUser);
  const [selectedRequest, setSelectedRequest] =
    useState<CertificateConsolidation | null>(null);
  const [comment, setComment] = useState("");

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      approveConsolidationRequest(id, {
        comment,
        authorisedBy: currentUser?.email ?? "",
      }),
    onSuccess: () => {
      toast.success("Consolidation approved. New certificate issued.");
      setSelectedRequest(null);
      setComment("");
      onRefetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      rejectConsolidationRequest(id, {
        comment,
        authorisedBy: currentUser?.email ?? "",
      }),
    onSuccess: () => {
      toast.success("Consolidation request rejected.");
      setSelectedRequest(null);
      setComment("");
      onRefetch();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    if (!comment.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    rejectMutation.mutate(id);
  };

  if (selectedRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRequest(null);
              setComment("");
            }}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="font-mono font-bold text-sm">
            {selectedRequest.id}
          </span>
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending Teamlead Review
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-base">
              Holder &amp; Certificate Details
            </h3>

            <div className="space-y-1">
              <p className="font-bold text-lg">{selectedRequest.holderName}</p>
              <p className="text-sm text-muted-foreground">
                Account No: {selectedRequest.accountNumber}
              </p>
              <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-200">
                {selectedRequest.registerSymbol}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                      Cert No
                    </th>
                    <th className="text-right py-2 pr-4 font-medium text-muted-foreground">
                      Units
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      Issue Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.certificates.map((cert) => (
                    <tr
                      key={cert.certNumber}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-4 font-mono">
                        {cert.certNumber}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatNumber(cert.units)}
                      </td>
                      <td className="py-2 text-right">{cert.issueDate}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td className="py-2 pr-4 font-bold">
                      {selectedRequest.certificates.length} certificates
                    </td>
                    <td className="py-2 pr-4 text-right font-bold tabular-nums">
                      {formatNumber(selectedRequest.totalUnits)}
                    </td>
                    <td className="py-2 text-right font-bold text-muted-foreground text-xs">
                      total units
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              After approval, these certificates will be deactivated and
              replaced by a single consolidated certificate.
            </div>
          </Card>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-base">
                New Consolidated Certificate
              </h3>

              <div className="rounded-md bg-muted p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  New Certificate Number
                </p>
                <p className="font-mono font-bold text-lg">
                  {selectedRequest.newCertNumber ?? "— (minted on approval)"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Total Units
                </p>
                <p className="font-bold text-xl tabular-nums">
                  {formatNumber(selectedRequest.totalUnits)}
                </p>
              </div>

              <div className="rounded-md border-l-4 border-muted-foreground/30 bg-muted/40 p-3">
                <p className="text-sm italic text-muted-foreground">
                  &ldquo;{selectedRequest.reason}&rdquo;
                </p>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Submitted by: </span>
                  <span className="font-medium">
                    {selectedRequest.submittedBy}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Date: </span>
                  <span>
                    {new Date(selectedRequest.submittedAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-base">Approval Action</h3>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment for approval, required for rejection"
                rows={4}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  disabled={isPending}
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-1"
                  onClick={() => handleReject(selectedRequest.id)}
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button
                  className="flex-1 gap-1"
                  disabled={isPending}
                  onClick={() => handleApprove(selectedRequest.id)}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Teamlead Approval</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve or reject pending consolidation requests
            submitted for Teamlead authorisation.
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 shrink-0">
          {requests.length} pending
        </Badge>
      </div>

      {loading && requests.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="font-medium">Loading…</p>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <FileCheck className="h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">No pending consolidation requests.</p>
          <p className="text-sm text-muted-foreground">
            All consolidation requests have been reviewed or none have been
            submitted for Teamlead approval yet.
          </p>
        </Card>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Holder Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Register
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Certificates
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Total Units
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Submitted By
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-xs">
                      {req.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold whitespace-nowrap">
                      {req.holderName}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {req.registerSymbol}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        {req.certCount}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap">
                      {formatNumber(req.totalUnits)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {req.submittedBy}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(req);
                          setComment("");
                        }}
                      >
                        Review &amp; Decide
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
