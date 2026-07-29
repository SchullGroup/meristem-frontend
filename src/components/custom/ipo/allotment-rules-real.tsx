"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GET_IPO_OFFERS } from "@/actions/offerSetUp";
import {
  useGetIpoAllotmentRules,
  useSaveIpoAllotmentRules,
  useIpoAllotmentSummary,
  useExecuteIpoAllotment,
  usePreviewIpoAllotment,
} from "@/hooks/useIPO";
import {
  AllotmentRulesEngine,
  type AllotmentRuleBandInput,
} from "@/components/custom/offer-administration/allotment-rules-engine";

export default function IpoAllotmentRulesReal({
  offerId: offerIdProp,
}: { offerId?: string } = {}) {
  const [internalOffer, setInternalOffer] = useState("");
  // Driven by the page's Active Offer when provided; otherwise self-select (standalone use).
  const offerId = offerIdProp ?? internalOffer;
  const showSelector = !offerIdProp;

  const { data: offersData } = useQuery({
    queryKey: ["ipo-offers", "allotment-rules-selector"],
    queryFn: () => GET_IPO_OFFERS({ size: 100 }),
    enabled: showSelector,
  });
  const offers: { id: string; name: string }[] = (offersData?.data?.content ?? []).map(
    (o: { id: string; name: string }) => ({ id: o.id, name: o.name }),
  );

  const { data: rulesData } = useGetIpoAllotmentRules(offerId || undefined);
  const { data: summary } = useIpoAllotmentSummary(offerId || undefined);
  const saveRules = useSaveIpoAllotmentRules();
  const executeAllotment = useExecuteIpoAllotment(offerId);
  const previewAllotment = usePreviewIpoAllotment();

  async function handlePreview(
    bands: AllotmentRuleBandInput[],
  ) {
    const res = await previewAllotment.mutateAsync({ offerId, bands });
    return res.bands;
  }

  function handleExecute() {
    executeAllotment.mutate(undefined, {
      onSuccess: () =>
        toast.success("Allotment algorithm executed. Allotted ledger and return-monies queue populated."),
      onError: (err) => toast.error(err.message),
    });
  }

  const initialBands: AllotmentRuleBandInput[] = (rulesData?.data ?? []).map((r) => ({
    minUnits: r.minUnits,
    maxUnits: r.maxUnits,
    flatAllotment: r.flatAllotment ?? 0,
    proRataPercent: r.proRataPercent ?? 0,
  }));

  function handleSave(bands: AllotmentRuleBandInput[]) {
    if (!offerId) {
      toast.error("Select an offer first.");
      return;
    }
    saveRules.mutate(
      { offerId, bands },
      {
        onSuccess: (res) => toast.success(`${res.data?.length ?? 0} allotment band(s) saved.`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="space-y-4">
      {showSelector && (
        <Card className="mrpsl-card p-4">
          <div className="space-y-1.5 w-72">
            <label className="mrpsl-label">Offer</label>
            <Select value={internalOffer} onValueChange={(v) => setInternalOffer(v ?? "")}>
              <SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select an offer to configure bands for" /></SelectTrigger>
              <SelectContent>
                {offers.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {offerId ? (
        <AllotmentRulesEngine
          key={offerId + ":" + initialBands.length}
          initialBands={initialBands}
          onSaveRules={handleSave}
          isSaving={saveRules.isPending}
          summary={summary}
          onExecute={handleExecute}
          isExecuting={executeAllotment.isPending}
          onPreview={handlePreview}
        />
      ) : (
        <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
          Select an offer above to define and save its allotment-rule bands.
        </Card>
      )}
    </div>
  );
}
