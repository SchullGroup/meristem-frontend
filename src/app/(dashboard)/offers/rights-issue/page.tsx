"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Building2, AlertCircle, MousePointerClick } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// New Rights Issue-specific components (built this sprint)
import { ProvisionalAllotment } from "@/components/custom/rights-issue/provisional-allotment";
import { RightsTrading } from "@/components/custom/rights-issue/rights-trading";
import { ReturnsCapture } from "@/components/custom/rights-issue/returns-capture";

// Shared offer-administration components (reused with rights-specific config)
import { AllotmentRulesEngine } from "@/components/custom/offer-administration/allotment-rules-engine";

// Existing API-connected rights-issue components (preserved untouched)
import RightsIssueReports from "@/components/custom/rights-issue/rights-reports";
import RightsIssueAllotment from "@/components/custom/rights-issue/allotment";
import { RightsRefundProcessing } from "@/components/custom/rights-issue/rights-refund-processing";

type RightsOfferStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface RightsOfferSummary {
  id: string;
  name: string;
  register: string;
  ratio: string;
  offerPrice: number;
  openingDate: Date | null;
  closingDate: Date | null;
  status: RightsOfferStatus;
}

const MOCK_RIGHTS_OFFERS: RightsOfferSummary[] = [
  {
    id: "1",
    name: "Fidelity Bank PLC Rights Issue 2024",
    register: "Fidelity Bank Ord. Shares",
    ratio: "1 for 10",
    offerPrice: 9.25,
    openingDate: new Date("2024-07-15"),
    closingDate: new Date("2024-07-31"),
    status: "CLOSED",
  },
  {
    id: "2",
    name: "Zenith Bank PLC Rights Issue 2025",
    register: "Zenith Bank Ord. Shares",
    ratio: "1 for 5",
    offerPrice: 42.0,
    openingDate: null,
    closingDate: null,
    status: "DRAFT",
  },
];

const STATUS_COLORS: Record<RightsOfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

const TABS = [
  "provisional",
  "trading",
  "returns",
  "allotment",
  "refund",
  "dispatch",
  "reports",
] as const;

type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  provisional: "Provisional Allotment",
  trading: "Rights Trading / Renunciation",
  returns: "Returns Capture",
  allotment: "Allotment Rules Engine",
  refund: "Rights Refund Processing",
  dispatch: "Dispatch & Notifications",
  reports: "Reports",
};

const RIGHTS_ALLOTMENT_BANNER =
  "Accepted Rights (guaranteed) are excluded from banding — only Additional Shares Applied and Traded/Bought Rights are subject to the bands below.";

export default function RightsIssuePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("provisional");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");

  const selectedOffer =
    MOCK_RIGHTS_OFFERS.find((o) => o.id === selectedOfferId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Rights Issue Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compute provisional entitlements, capture returns, process traded
          rights, and manage allotment and dispatch for Rights Issues.
        </p>
      </div>

      {/* Active offer selector */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Active Offer</span>
          </div>
          <div className="flex-1 min-w-60">
            <Select
              value={selectedOfferId}
              onValueChange={(v) => setSelectedOfferId(v ?? "")}
            >
              <SelectTrigger className="mrpsl-input h-9 w-full max-w-sm">
                <SelectValue placeholder="Select a rights issue to work with…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_RIGHTS_OFFERS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedOffer && (
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="mrpsl-label mr-1">Register:</span>
                <span className="font-medium">{selectedOffer.register}</span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Ratio:</span>
                <span className="font-mono font-semibold">{selectedOffer.ratio}</span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Price:</span>
                <span className="font-mono font-semibold">
                  ₦{selectedOffer.offerPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Closing:</span>
                <span>
                  {selectedOffer.closingDate
                    ? format(selectedOffer.closingDate, "dd MMM yyyy")
                    : "—"}
                </span>
              </div>
              <Badge
                className={`border-0 text-[11px] ${STATUS_COLORS[selectedOffer.status]}`}
              >
                {selectedOffer.status}
              </Badge>
            </div>
          )}
          {!selectedOffer && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Select a rights issue above before processing data.
            </div>
          )}
        </div>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "provisional")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-full gap-0.5 flex-wrap justify-start">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={!selectedOffer}
              className="flex-none rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="provisional">
            {!selectedOffer ? (
              <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center min-h-70 gap-3">
                <MousePointerClick className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-sm text-foreground">No offer selected</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select a rights issue from the dropdown above to view and compute the provisional allotment schedule.
                </p>
              </Card>
            ) : (
              <ProvisionalAllotment
                offerName={selectedOffer.name}
                ratioLabel={`${selectedOffer.ratio} held`}
                ratioDenominator={parseInt(selectedOffer.ratio.split(" for ")[1] ?? "10")}
                pricePerShare={selectedOffer.offerPrice}
                qualificationDateLabel={
                  selectedOffer.closingDate
                    ? format(selectedOffer.closingDate, "dd MMM yyyy")
                    : ""
                }
                entitlementLabel="Rights Due"
              />
            )}
          </TabsContent>

          <TabsContent value="trading">
            <RightsTrading />
          </TabsContent>

          <TabsContent value="returns">
            <ReturnsCapture />
          </TabsContent>

          <TabsContent value="allotment">
            <AllotmentRulesEngine bannerMessage={RIGHTS_ALLOTMENT_BANNER} />
          </TabsContent>

          <TabsContent value="refund">
            <RightsRefundProcessing />
          </TabsContent>

          <TabsContent value="dispatch">
            <RightsIssueAllotment />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <RightsIssueReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
