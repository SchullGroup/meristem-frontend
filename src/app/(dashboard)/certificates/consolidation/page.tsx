"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ConsolidationSuggested } from "@/components/custom/certificate-consolidation/consolidation-suggested";
import { ConsolidationRequests } from "@/components/custom/certificate-consolidation/consolidation-requests";
import { ConsolidationIcu } from "@/components/custom/certificate-consolidation/consolidation-icu";
import {
  getAllConsolidationRequests,
  CertConsolidationSuggestion,
} from "@/actions/certConsolidation";

export default function ConsolidationPage() {
  const [activeTab, setActiveTab] = useState<string>("suggested");
  // A suggestion the officer chose to "Create Consolidation Request" from — handed to the create
  // form so it loads those accounts directly, with no re-search. Cleared once consumed.
  const [prefill, setPrefill] = useState<CertConsolidationSuggestion | null>(
    null,
  );

  // Real consolidation requests. Low-volume maker-checker queue, so one query feeds both the
  // Requests list and the Teamlead Approval tab (and the badge counts); mutations refetch it.
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["cert-consolidations"],
    queryFn: () => getAllConsolidationRequests({ page: 1, pageSize: 200 }),
    select: (d) => d.data?.content ?? [],
  });

  const requests = data ?? [];
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  function handleCreateFromSuggestion(suggestion: CertConsolidationSuggestion) {
    setPrefill(suggestion);
    setActiveTab("requests");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Certificate Consolidation</h1>
        <p className="text-muted-foreground">
          Combine multiple share certificates across accounts into a single
          consolidated certificate.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="suggested">System Suggestions</TabsTrigger>
          <TabsTrigger value="requests">
            Consolidation Requests
            {totalCount > 0 && <Badge className="ml-2">{totalCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="icu">
            Teamlead Approval
            {pendingCount > 0 && <Badge className="ml-2">{pendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested">
          <ConsolidationSuggested
            onCreateFromSuggestion={handleCreateFromSuggestion}
          />
        </TabsContent>

        <TabsContent value="requests">
          <ConsolidationRequests
            requests={requests}
            loading={isLoading}
            onRefetch={refetch}
            prefill={prefill}
            onPrefillConsumed={() => setPrefill(null)}
          />
        </TabsContent>

        <TabsContent value="icu">
          <ConsolidationIcu
            requests={requests.filter((r) => r.status === "PENDING")}
            loading={isLoading}
            onRefetch={refetch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
