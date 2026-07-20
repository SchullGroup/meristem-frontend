"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DematVerification } from "@/components/custom/cert-dematerialization/demat-verification";
import { DematCertificateCapture } from "@/components/custom/cert-dematerialization/demat-certificate-capture";
import { DematHodApproval } from "@/components/custom/cert-dematerialization/demat-hod-approval";
import { DematCooApproval } from "@/components/custom/cert-dematerialization/demat-coo-approval";
import { DematIcuApproval } from "@/components/custom/cert-dematerialization/demat-icu-approval-new";
import { DematLodgment } from "@/components/custom/cert-dematerialization/demat-lodgment-new";
import { DematReversal } from "@/components/custom/cert-dematerialization/demat-reversal-new";
import {
  SEED_REQUESTS,
  DematRequest,
  DematStatus,
} from "@/components/custom/cert-dematerialization/demat-types";

export default function DematerializationPage() {
  const [requests, setRequests] = useState<DematRequest[]>(SEED_REQUESTS);

  const pendingHod = requests.filter((r) => r.status === "PENDING_HOD").length;
  const pendingCoo = requests.filter((r) => r.status === "PENDING_COO").length;
  const pendingIcu = requests.filter((r) => r.status === "PENDING_ICU").length;
  const pendingLodgment = requests.filter(
    (r) => r.status === "APPROVED",
  ).length;

  function approveHod(id: string) {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const value = r.totalUnits * r.unitPrice;
        const nextStatus: DematStatus =
          r.totalUnits > 10_000_000 || value > 5_000_000
            ? "PENDING_COO"
            : "PENDING_ICU";
        return { ...r, status: nextStatus };
      }),
    );
  }

  function approveCoo(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "PENDING_ICU" as DematStatus } : r,
      ),
    );
  }

  function approveIcu(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "APPROVED" as DematStatus } : r,
      ),
    );
  }

  function rejectRequest(id: string, comment: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "REJECTED" as DematStatus,
              rejectionComment: comment,
            }
          : r,
      ),
    );
  }

  function lodgeRequest(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "LODGED" as DematStatus } : r,
      ),
    );
  }

  function createRequest(req: DematRequest) {
    setRequests((prev) => [...prev, req]);
  }

  function editRequest(id: string, updates: Partial<DematRequest>) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, ...updates, status: "PENDING_HOD" as DematStatus }
          : r,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dematerialisation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Convert physical share certificates to electronic form.
        </p>
      </div>

      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-5">
          <TabsTrigger
            value="verification"
            className="gap-1.5 cursor-pointer px-3 py-2"
          >
            Verification
          </TabsTrigger>
          <TabsTrigger
            value="capture"
            className="gap-1.5 cursor-pointer px-3 py-2"
          >
            Certificate Capture
          </TabsTrigger>
          <TabsTrigger value="hod" className="gap-1.5 cursor-pointer px-3 py-2">
            HOD Approval
            {pendingHod > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {pendingHod}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="coo" className="gap-1.5 cursor-pointer px-3 py-2">
            COO / CEO Approval
            {pendingCoo > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {pendingCoo}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="icu" className="gap-1.5 cursor-pointer px-3 py-2">
            ICU Approval
            {pendingIcu > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {pendingIcu}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="lodgment"
            className="gap-1.5 cursor-pointer px-3 py-2"
          >
            CSCS Lodgment
            {pendingLodgment > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {pendingLodgment}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="reversal"
            className="gap-1.5 cursor-pointer px-3 py-2"
          >
            Reversal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verification">
          <DematVerification />
        </TabsContent>

        <TabsContent value="capture">
          <DematCertificateCapture
            requests={requests}
            onCreateRequest={createRequest}
            onEditRequest={editRequest}
          />
        </TabsContent>

        <TabsContent value="hod">
          <DematHodApproval
            requests={requests}
            onApprove={approveHod}
            onReject={rejectRequest}
          />
        </TabsContent>

        <TabsContent value="coo">
          <DematCooApproval
            requests={requests}
            onApprove={approveCoo}
            onReject={rejectRequest}
          />
        </TabsContent>

        <TabsContent value="icu">
          <DematIcuApproval
            requests={requests}
            onApprove={approveIcu}
            onReject={rejectRequest}
          />
        </TabsContent>

        <TabsContent value="lodgment">
          <DematLodgment requests={requests} onLodge={lodgeRequest} />
        </TabsContent>

        <TabsContent value="reversal">
          <DematReversal requests={requests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
