"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ConsolidationSuggested } from "@/components/custom/certificate-consolidation/consolidation-suggested";
import { ConsolidationRequests } from "@/components/custom/certificate-consolidation/consolidation-requests";
import { ConsolidationIcu } from "@/components/custom/certificate-consolidation/consolidation-icu";
import {
  SEED_CONSOLIDATION_REQUESTS,
  ConsolidationRequest,
  ConsolidationStatus,
  SuggestedConsolidation,
  MOCK_HOLDERS,
  MockHolder,
} from "@/components/custom/certificate-consolidation/consolidation-mock";

export default function ConsolidationPage() {
  const [requests, setRequests] = useState<ConsolidationRequest[]>(SEED_CONSOLIDATION_REQUESTS);
  const [activeTab, setActiveTab] = useState<string>("suggested");
  const [prefillHolder, setPrefillHolder] = useState<MockHolder | null>(null);
  const [prefillRegister, setPrefillRegister] = useState<string>("");

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const icuPendingCount = pendingCount;

  function createRequest(req: ConsolidationRequest) {
    setRequests((prev) => [...prev, req]);
  }

  function editRequest(id: string, updates: Partial<ConsolidationRequest>) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...updates, status: "PENDING" as ConsolidationStatus } : r
      )
    );
  }

  function approveRequest(id: string) {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: "APPROVED" as ConsolidationStatus,
          approvedBy: "ICU Manager",
          approvedAt: "16 Jul 2026",
          certificates: r.certificates.map((c) => ({ ...c, status: "DEACTIVATED" as const })),
        };
      })
    );
  }

  function rejectRequest(id: string, comment: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "REJECTED" as ConsolidationStatus,
              rejectionComment: comment,
              rejectedBy: "ICU Manager",
              rejectedAt: "16 Jul 2026",
            }
          : r
      )
    );
  }

  function handleCreateFromSuggestion(suggestion: SuggestedConsolidation) {
    const holder = MOCK_HOLDERS.find((h) => h.bvn === suggestion.bvn) || null;
    setPrefillHolder(holder);
    setPrefillRegister(suggestion.register);
    setActiveTab("requests");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Certificate Consolidation</h1>
        <p className="text-muted-foreground">
          Combine multiple share certificates across accounts into a single consolidated certificate.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="suggested">System Suggestions</TabsTrigger>
          <TabsTrigger value="requests">
            Consolidation Requests
            {requests.length > 0 && (
              <Badge className="ml-2">{requests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="icu">
            ICU Approval
            {icuPendingCount > 0 && (
              <Badge className="ml-2">{icuPendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested">
          <ConsolidationSuggested onCreateFromSuggestion={handleCreateFromSuggestion} />
        </TabsContent>

        <TabsContent value="requests">
          <ConsolidationRequests
            requests={requests}
            onCreateRequest={createRequest}
            onEditRequest={editRequest}
            prefillHolder={prefillHolder}
            prefillRegister={prefillRegister}
            onPrefillConsumed={() => {
              setPrefillHolder(null);
              setPrefillRegister("");
            }}
          />
        </TabsContent>

        <TabsContent value="icu">
          <ConsolidationIcu
            requests={requests.filter((r) => r.status === "PENDING")}
            allRequests={requests}
            onApprove={approveRequest}
            onReject={rejectRequest}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
