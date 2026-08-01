"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2, AlertCircle, Loader2 } from "lucide-react";
import { GET_IPO_OFFERS } from "@/actions/offerSetUp";
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
import IpoAllotmentRulesReal from "@/components/custom/ipo/allotment-rules-real";
import UploadIPOData from "@/components/custom/ipo/upload-data";
import PendingApprovalIpoReal from "@/components/custom/ipo/pending-approval-real";
import IcuApprovalIpoReal from "@/components/custom/ipo/icu-approval-real";
import IcuLodgmentReal from "@/components/custom/ipo/lodgment-real";
import IpoCscsReversalsReal from "@/components/custom/ipo/cscs-reversals-real";
import IpoDispatchReal from "@/components/custom/ipo/dispatch-real";
import IPOReports from "@/components/custom/ipo/ipo-reports";

type OfferStatus = "DRAFT" | "OPEN" | "CLOSED" | "ALLOTTED" | "CONCLUDED";

interface PublicOfferSummary {
  id: string;
  name: string;
  registerId?: string;
  offerPrice?: number;
  totalUnits?: number;
  openingDate?: string | null;
  closingDate?: string | null;
  status: OfferStatus;
}

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

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ["ipo-offers", "ipo-admin-selector", "OPEN"],
    queryFn: () => GET_IPO_OFFERS({ size: 100, status: "OPEN" }),
  });
  // Filtered again client-side so a server that ignores `status` can't leak
  // non-open offers into the selector.
  const offers: PublicOfferSummary[] = (offersData?.data?.content ?? [])
    .map((o: PublicOfferSummary) => ({
      id: o.id,
      name: o.name,
      registerId: o.registerId,
      offerPrice: o.offerPrice,
      totalUnits: o.totalUnits,
      openingDate: o.openingDate ?? null,
      closingDate: o.closingDate ?? null,
      status: o.status,
    }))
    .filter((o: PublicOfferSummary) => o.status === "OPEN");

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;

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
              disabled={offersLoading}
            >
              <SelectTrigger className="mrpsl-input h-9 w-full max-w-sm">
                {offersLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading offers…
                  </span>
                ) : (
                  <SelectValue placeholder="Select an offer to work with…" />
                )}
              </SelectTrigger>
              <SelectContent>
                {offers.length === 0 ? (
                  <div className="px-3 py-2 text-[13px] text-muted-foreground">
                    No open offers.
                  </div>
                ) : (
                  offers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedOffer && (
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="mrpsl-label mr-1">Register:</span>
                <span className="font-medium">{selectedOffer.registerId ?? "—"}</span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Price:</span>
                <span className="font-mono font-semibold">
                  ₦{(selectedOffer.offerPrice ?? 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Closing:</span>
                <span>
                  {selectedOffer.closingDate
                    ? format(new Date(selectedOffer.closingDate), "dd MMM yyyy")
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
            <UploadIPOData
              tab="upload"
              activeOffer={
                selectedOffer
                  ? {
                      id: selectedOffer.id,
                      name: selectedOffer.name,
                      register: selectedOffer.registerId ?? "",
                      offerPrice: selectedOffer.offerPrice ?? 0,
                      status: selectedOffer.status,
                    }
                  : null
              }
            />
          </TabsContent>

          <TabsContent value="vetting">
            <DataVettingDashboard
              activeOffer={selectedOffer ? { id: selectedOffer.id, offerName: selectedOffer.name } : null}
            />
          </TabsContent>

          <TabsContent value="sec-reports">
            <RegulatoryReportHub
              activeOffer={selectedOffer ? { id: selectedOffer.id, offerName: selectedOffer.name } : null}
            />
          </TabsContent>

          <TabsContent value="allotment">
            <IpoAllotmentRulesReal offerId={selectedOffer?.id} />
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            <PendingApprovalIpoReal />
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <IcuApprovalIpoReal />
          </TabsContent>

          <TabsContent value="lodgement" className="space-y-4">
            <IcuLodgmentReal />
          </TabsContent>

          <TabsContent value="reversals">
            <IpoCscsReversalsReal />
          </TabsContent>

          <TabsContent value="dispatch">
            <IpoDispatchReal />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <IPOReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
