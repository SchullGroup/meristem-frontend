"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RightsIssue } from "@/types/rights";

// Sub-components
import { AllotmentQueueTable } from "./allotment-queue-table";
import { AllotmentUploadSection } from "./allotment-upload-section";
import { AllotmentDetailsView } from "./allotment-details-view";

export default function RightsIssueAllottment() {
  // Currently active batch being reviewed
  const [allotReviewing, setAllotReviewing] = useState<RightsIssue | null>(
    null,
  );

  if (allotReviewing === null) {
    return <AllotmentQueueTable onSelectIssue={setAllotReviewing} />;
  }

  return (
    <div className="space-y-5">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => setAllotReviewing(null)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Allotment Queue
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {allotReviewing.ref}
        </span>
        <span className="text-muted-foreground text-sm">
          · {allotReviewing.registerId} · {allotReviewing.offerName}
        </span>
        {allotReviewing.status === "ALLOTTED" ? (
          <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
            Allotted
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
            Pending Allotment
          </Badge>
        )}
      </div>

      {/* ICU approval record info card */}
      <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
        <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          ICU Approval Record
        </p>
        <div className="flex items-center gap-8 text-sm flex-wrap">
          <div>
            <div className="mrpsl-section-title">Register</div>
            <div className="font-semibold mt-0.5">
              {allotReviewing.registerId}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Rights Issue</div>
            <div className="mt-0.5">{allotReviewing.offerName}</div>
          </div>
          <div>
            <div className="mrpsl-section-title">Ratio</div>
            <div className="font-mono mt-0.5">{allotReviewing.ratio}</div>
          </div>
          <div>
            <div className="mrpsl-section-title">Issue Price</div>
            <div className="font-mono mt-0.5">{allotReviewing.issuePrice}</div>
          </div>
          <div>
            <div className="mrpsl-section-title">ICU Approver</div>
            <div className="font-semibold mt-0.5">
              {allotReviewing.icuApprovedByName}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">ICU Date</div>
            <div className="font-mono mt-0.5">
              {allotReviewing.icuApprovedAt
                ? format(new Date(allotReviewing.icuApprovedAt), "dd-MM-yyyy")
                : "----"}
            </div>
          </div>
          {/* <div>
            <div className="mrpsl-section-title">Approved Allottees</div>
            <div className="font-mono font-semibold mt-0.5 text-green-700">
              {allotReviewing.total?.toLocaleString() || "0"}
            </div>
          </div> */}
        </div>
      </Card>

      {/* Upload files vs. Processed Details dynamic views */}
      {allotReviewing.status === "ICU_APPROVED" ? (
        <AllotmentUploadSection
          allotReviewing={allotReviewing}
          onSuccess={() =>
            setAllotReviewing((prev) =>
              prev ? { ...prev, status: "ALLOTTED" } : null,
            )
          }
        />
      ) : (
        <AllotmentDetailsView allotReviewing={allotReviewing} />
      )}
    </div>
  );
}
