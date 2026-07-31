"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2, AlertCircle } from "lucide-react";
import { GET_BONUS_OFFERS } from "@/actions/offerSetUp";
import { useGetOrCreateBonusDeclaration } from "@/hooks/useBonus";
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
import { useStore } from "@/lib/store";
import { toast } from "sonner";

import { BonusProvisional } from "@/components/custom/bonus-issue/bonus-provisional";
import { BonusDeclarationApproval } from "@/components/custom/bonus-issue/bonus-declaration-approval";
import { BonusIcuReview } from "@/components/custom/bonus-issue/bonus-icu-review";
import { BonusCscsLodgement } from "@/components/custom/bonus-issue/bonus-cscs-lodgement";
import { BonusCscsReversals } from "@/components/custom/bonus-issue/bonus-cscs-reversals";
import { BonusReports } from "@/components/custom/bonus-issue/bonus-reports";
import { BonusDispatch } from "@/components/custom/bonus-issue/bonus-dispatch";

/* ─── Types & constants ─────────────────────────────────── */

type BonusOfferStatus = "DRAFT" | "OPEN" | "CLOSED";

interface BonusOfferSummary {
  id: string;
  name: string;
  register: string;
  ratio: string;
  qualificationDate: Date | null;
  closureDate: Date | null;
  allotmentDate: Date | null;
  status: BonusOfferStatus;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
};

const TABS = [
  "declaration",
  "auth",
  "icu",
  "lodgement",
  "reversals",
  "allotment",
  "reports",
] as const;

type TabValue = (typeof TABS)[number];

const TAB_LABELS: Record<TabValue, string> = {
  declaration: "Provisional Allotment",
  auth: "Declaration Approval",
  icu: "ICU Approval",
  lodgement: "CSCS Lodgement",
  reversals: "CSCS Reversals & Error Resolution",
  allotment: "Dispatch & Notification",
  reports: "Reports",
};

export default function BonusIssuePage() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<TabValue>("declaration");
  const [selectedBonusOfferId, setSelectedBonusOfferId] = useState<string>("");
  const [bonusDeclarationId, setBonusDeclarationId] = useState<string>("");

  const { data: bonusOffersRes } = useQuery({
    queryKey: ["bonus-offers", "admin-selector"],
    queryFn: () => GET_BONUS_OFFERS({ size: 100 }),
  });

  const bonusOffers: BonusOfferSummary[] = useMemo(() => {
    const raw = bonusOffersRes?.data?.content ?? bonusOffersRes?.content ?? [];
    return raw.map(
      (o: {
        id: number | string;
        name: string;
        registerId?: string;
        ratioNumerator?: number;
        ratioDenominator?: number;
        qualificationDate?: string | null;
        closureDate?: string | null;
        allotmentDate?: string | null;
        status?: string;
      }) => ({
        id: String(o.id),
        name: o.name,
        register: o.registerId ?? "",
        ratio: `${o.ratioNumerator ?? 1} for ${o.ratioDenominator ?? 1}`,
        qualificationDate: o.qualificationDate ? new Date(o.qualificationDate) : null,
        closureDate: o.closureDate ? new Date(o.closureDate) : null,
        allotmentDate: o.allotmentDate ? new Date(o.allotmentDate) : null,
        status: (o.status as BonusOfferStatus) ?? "DRAFT",
      }),
    );
  }, [bonusOffersRes]);

  const selectedBonusOffer = bonusOffers.find((o) => o.id === selectedBonusOfferId) ?? null;

  const getOrCreateDeclaration = useGetOrCreateBonusDeclaration();
  const handleSelectBonusOffer = (id: string | null) => {
    setSelectedBonusOfferId(id ?? "");
    setBonusDeclarationId("");
    if (!id) return;
    getOrCreateDeclaration.mutate(
      { offerId: id, createdBy: currentUser?.email },
      {
        onSuccess: (res) => setBonusDeclarationId(String(res?.data?.id ?? "")),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bonus Issue Administration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compute bonus entitlements, approve, allot and lodge bonus share issues.
        </p>
      </div>

      {/* Active bonus issue selector */}
      <Card className="mrpsl-card p-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Active Bonus Issue</span>
          </div>
          <div className="flex-1 min-w-60">
            <Select value={selectedBonusOfferId} onValueChange={handleSelectBonusOffer}>
              <SelectTrigger className="mrpsl-input h-9 w-full max-w-sm">
                <SelectValue placeholder="Select a bonus issue to work with…" />
              </SelectTrigger>
              <SelectContent>
                {bonusOffers.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedBonusOffer && (
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="mrpsl-label mr-1">Register:</span>
                <span className="font-medium">{selectedBonusOffer.register}</span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Ratio:</span>
                <span className="font-mono font-semibold">{selectedBonusOffer.ratio}</span>
              </div>
              <div>
                <span className="mrpsl-label mr-1">Qualification:</span>
                <span>
                  {selectedBonusOffer.qualificationDate
                    ? format(selectedBonusOffer.qualificationDate, "dd MMM yyyy")
                    : "—"}
                </span>
              </div>
              <Badge className={`border-0 text-[11px] ${STATUS_COLORS[selectedBonusOffer.status] ?? STATUS_COLORS.DRAFT}`}>
                {selectedBonusOffer.status}
              </Badge>
            </div>
          )}
          {!selectedBonusOffer && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Select a bonus issue above before computing or processing data.
            </div>
          )}
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab((v as TabValue) || "declaration")} className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-full gap-0.5 flex-wrap justify-start">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={!selectedBonusOffer && tab !== "declaration"}
              className="flex-none rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="declaration">
            <BonusProvisional
              declarationId={bonusDeclarationId || undefined}
              offerName={selectedBonusOffer?.name}
              ratioLabel={selectedBonusOffer?.ratio}
            />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <BonusDeclarationApproval />
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <BonusIcuReview />
          </TabsContent>

          <TabsContent value="lodgement" className="space-y-4">
            <BonusCscsLodgement />
          </TabsContent>

          <TabsContent value="reversals" className="space-y-4">
            <BonusCscsReversals declarationId={bonusDeclarationId || undefined} />
          </TabsContent>

          <TabsContent value="allotment" className="space-y-4">
            <BonusDispatch declarationId={bonusDeclarationId || undefined} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <BonusReports
              declarationId={bonusDeclarationId || undefined}
              registerId={selectedBonusOffer?.register}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
