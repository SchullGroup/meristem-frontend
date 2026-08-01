"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { GET_RIGHT_OFFERS } from "@/actions/offerSetUp";
import { useGetOrCreateRightsDeclaration } from "@/hooks/useRights";
import { useStore } from "@/lib/store";
import { Building2, AlertCircle, MousePointerClick, Loader2 } from "lucide-react";
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
import { toast } from "sonner";

// Rights Issue-specific components
import { ProvisionalAllotment } from "@/components/custom/rights-issue/provisional-allotment";
import { ReturnsCapture } from "@/components/custom/rights-issue/returns-capture";
import { RightsPreviewReal } from "@/components/custom/rights-issue/rights-preview-real";
import { RightsHodApproval } from "@/components/custom/rights-issue/hod-approval";
import { RightsSecReports } from "@/components/custom/rights-issue/rights-sec-reports";
import { RightsAllotmentEngine } from "@/components/custom/rights-issue/rights-allotment-engine";
import { RightsIcuApproval } from "@/components/custom/rights-issue/rights-icu-approval";
import { RightsReturnMonies } from "@/components/custom/rights-issue/rights-return-monies";
import { RightsCscsLodgement } from "@/components/custom/rights-issue/rights-cscs-lodgement";
import { RightsCscsReversals } from "@/components/custom/rights-issue/rights-cscs-reversals";
import { RightsDispatch } from "@/components/custom/rights-issue/rights-dispatch";

// Existing API-connected rights-issue components (preserved untouched)
import RightsIssueReports from "@/components/custom/rights-issue/rights-reports";


/* ─── Types & constants ─────────────────────────────────── */

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

const STATUS_COLORS: Record<RightsOfferStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ALLOTTED: "bg-blue-100 text-blue-800",
  CONCLUDED: "bg-purple-100 text-purple-800",
};

const TABS = [
  "provisional",
  "returns",
  "preview",
  "hod",
  "sec-reports",
  "allotment",
  "icu",
  "refund",
  "cscs-lodgment",
  "cscs-reversals",
  "dispatch",
  "reports",
] as const;

type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  provisional: "Provisional Allotment",
  returns: "Returns Capture",
  preview: "Rights Preview",
  hod: "HoD Approval",
  "sec-reports": "SEC Reports",
  allotment: "Allotment Rule Engine",
  icu: "ICU Approval",
  refund: "Rights Refund Processing",
  "cscs-lodgment": "CSCS Lodgement",
  "cscs-reversals": "CSCS Reversals & Error Resolution",
  dispatch: "Dispatch & Notification",
  reports: "Reports",
};


export default function RightsIssuePage() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<TabValue>("provisional");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [declarationId, setDeclarationId] = useState<string>("");

  // Real Offer-Setup rights offers to work against (replaces the demo list).
  const { data: offersRes, isLoading: offersLoading } = useQuery({
    queryKey: ["rights-offers", "admin-selector", "OPEN"],
    queryFn: () => GET_RIGHT_OFFERS({ size: 100, status: "OPEN" }),
  });

  const offers: RightsOfferSummary[] = useMemo(() => {
    const raw = offersRes?.data?.content ?? offersRes?.content ?? [];
    return raw.map(
      (o: {
        id: number | string;
        name: string;
        registerId?: string;
        ratioNumerator?: number;
        ratioDenominator?: number;
        pricePerShare?: number;
        openingDate?: string | null;
        closingDate?: string | null;
        status?: string;
      }) => ({
        id: String(o.id),
        name: o.name,
        register: o.registerId ?? "",
        ratio: `${o.ratioNumerator ?? 1} for ${o.ratioDenominator ?? 1}`,
        offerPrice: o.pricePerShare ?? 0,
        openingDate: o.openingDate ? new Date(o.openingDate) : null,
        closingDate: o.closingDate ? new Date(o.closingDate) : null,
        status: (o.status as RightsOfferStatus) ?? "DRAFT",
      }),
    ).filter((o: RightsOfferSummary) => o.status === "OPEN");
  }, [offersRes]);

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;

  // Materialise (once) the declaration that administers the selected offer.
  const getOrCreateDeclaration = useGetOrCreateRightsDeclaration();
  const handleSelectOffer = (v: string | null) => {
    setSelectedOfferId(v ?? "");
    setDeclarationId("");
    if (!v) return;
    getOrCreateDeclaration.mutate(
      { offerId: v, createdBy: currentUser?.email },
      {
        onSuccess: (decl) => setDeclarationId(String((decl as { id: number | string })?.id ?? "")),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

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
              onValueChange={handleSelectOffer}
              disabled={offersLoading}
            >
              <SelectTrigger className="mrpsl-input h-9 w-full max-w-sm">
                {offersLoading ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading rights issues…
                  </span>
                ) : (
                  <SelectValue placeholder="Select a rights issue to work with…" />
                )}
              </SelectTrigger>
              <SelectContent>
                {offers.length === 0 ? (
                  <div className="px-3 py-2 text-[13px] text-muted-foreground">
                    No open rights issues.
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
                <span className="font-medium">{selectedOffer.register}</span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Ratio:</span>
                <span className="font-mono font-semibold">
                  {selectedOffer.ratio}
                </span>
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
          {/* Provisional Allotment */}
          <TabsContent value="provisional">
            {!selectedOffer ? (
              <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center min-h-70 gap-3">
                <MousePointerClick className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-sm text-foreground">
                  No offer selected
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Select a rights issue from the dropdown above to view and
                  compute the provisional allotment schedule.
                </p>
              </Card>
            ) : (
              <ProvisionalAllotment
                declarationId={declarationId || undefined}
                offerName={selectedOffer.name}
                ratioLabel={`${selectedOffer.ratio} held`}
                ratioDenominator={parseInt(
                  selectedOffer.ratio.split(" for ")[1] ?? "10",
                )}
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

          {/* Returns Capture */}
          <TabsContent value="returns">
            <ReturnsCapture declarationId={declarationId || undefined} />
          </TabsContent>

          {/* Rights Preview */}
          <TabsContent value="preview">
            <RightsPreviewReal declarationId={declarationId || undefined} />
          </TabsContent>

          <TabsContent value="hod">
            <RightsHodApproval declarationId={declarationId || undefined} />
          </TabsContent>

          {/* SEC Reports */}
          <TabsContent value="sec-reports">
            <RightsSecReports declarationId={declarationId || undefined} />
          </TabsContent>

          {/* Allotment Rule Engine */}
          <TabsContent value="allotment">
            <RightsAllotmentEngine declarationId={declarationId || undefined} />
          </TabsContent>

          {/* ICU Approval */}
          <TabsContent value="icu">
            <RightsIcuApproval declarationId={declarationId || undefined} />
          </TabsContent>

          {/* Return Monies */}
          <TabsContent value="refund">
            <RightsReturnMonies declarationId={declarationId || undefined} />
          </TabsContent>

          {/* CSCS Lodgement */}
          <TabsContent value="cscs-lodgment">
            <RightsCscsLodgement declarationId={declarationId || undefined} />
          </TabsContent>

          {/* CSCS Reversals & Error Resolution */}
          <TabsContent value="cscs-reversals">
            <RightsCscsReversals declarationId={declarationId || undefined} />
          </TabsContent>

          {/* Dispatch & Notification */}
          <TabsContent value="dispatch">
            <RightsDispatch declarationId={declarationId || undefined} />
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <RightsIssueReports />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
