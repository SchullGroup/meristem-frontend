"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Building2, AlertCircle } from "lucide-react";
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
import { DataVettingDashboard } from "@/components/custom/offer-administration/data-vetting-dashboard";
import { RegulatoryReportHub } from "@/components/custom/offer-administration/regulatory-report-hub";
import { AllotmentRulesEngine } from "@/components/custom/offer-administration/allotment-rules-engine";
import { CSCSReversalsWorkspace } from "@/components/custom/offer-administration/cscs-reversals-workspace";
import { DispatchNotificationPanel } from "@/components/custom/offer-administration/dispatch-notification-panel";
import UploadIPOData from "@/components/custom/ipo/upload-data";
import PendingApprovalIPO from "@/components/custom/ipo/pending-approval";
import IcuApprovalIPO from "@/components/custom/ipo/icu-approval";
import ICULodgment from "@/components/custom/ipo/lodgment";
import IPOReports from "@/components/custom/ipo/ipo-reports";

type OfferStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface PublicOfferSummary {
  id: string;
  name: string;
  register: string;
  offerPrice: number;
  totalUnits: number;
  openingDate: Date | null;
  closingDate: Date | null;
  status: OfferStatus;
}

const MOCK_PUBLIC_OFFERS: PublicOfferSummary[] = [
  {
    id: "1",
    name: "Access Holdings PLC Public Offer 2024",
    register: "Access Holdings Ord. Shares",
    offerPrice: 22.5,
    totalUnits: 17_772_612_811,
    openingDate: new Date("2024-10-07"),
    closingDate: new Date("2024-10-21"),
    status: "CLOSED",
  },
  {
    id: "2",
    name: "Transcorp Power PLC IPO 2024",
    register: "Transcorp Power Ord. Shares",
    offerPrice: 5.0,
    totalUnits: 7_500_000_000,
    openingDate: null,
    closingDate: null,
    status: "DRAFT",
  },
];

const STATUS_COLORS: Record<OfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

const TABS = [
  "upload",
  "vetting",
  "sec-reports",
  "allotment",
  "approval",
  "lodgement",
  "reversals",
  "icu",
  "dispatch",
  "reports",
] as const;

type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  upload: "Subscription Data Upload",
  vetting: "Data Vetting & Duplicates",
  "sec-reports": "SEC Clearance Reports",
  allotment: "Allotment Rules Engine",
  approval: "Allotment Approval",
  icu: "ICU Approval",
  lodgement: "CSCS Lodgement",
  reversals: "CSCS Reversals & Error Resolution",
  dispatch: "Dispatch & Notifications",
  reports: "Reports",
};

export default function IPOPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("upload");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");

  const selectedOffer =
    MOCK_PUBLIC_OFFERS.find((o) => o.id === selectedOfferId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          IPO / Public Offer Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage subscriber lists, vetting, SEC clearance, allotment, and
          lodgement for Initial Public Offers.
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
                <SelectValue placeholder="Select an offer to work with…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PUBLIC_OFFERS.map((o) => (
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
              Select an offer above before uploading or processing data.
            </div>
          )}
        </div>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab((v as TabValue) || "upload")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-full gap-0.5 flex-wrap justify-start">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={!selectedOffer && tab !== "upload"}
              className="flex-none rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="upload" className="space-y-6">
            <UploadIPOData tab="upload" activeOffer={selectedOffer} />
          </TabsContent>

          <TabsContent value="vetting">
            <DataVettingDashboard />
          </TabsContent>

          <TabsContent value="sec-reports">
            <RegulatoryReportHub />
          </TabsContent>

          <TabsContent value="allotment">
            <AllotmentRulesEngine />
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            <PendingApprovalIPO tab="approval" />
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <IcuApprovalIPO tab="icu" />
          </TabsContent>

          <TabsContent value="lodgement" className="space-y-4">
            <ICULodgment tab="lodgement" />
          </TabsContent>

          <TabsContent value="reversals">
            <CSCSReversalsWorkspace />
          </TabsContent>

          <TabsContent value="dispatch">
            <DispatchNotificationPanel />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <IPOReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
