"use client";

import { useMemo, useState } from "react";
import { Play, ShieldCheck, Send, FileText, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  EmailPreviewModal,
  type OutreachShareholder,
} from "@/components/custom/shareholder-outreach-modals";
import {
  useComputeEntitlements,
  useGetRightsIssueShareholders,
  useEmailShareholders,
} from "@/hooks/useRights";
import { downloadRightsDeclarationReport } from "@/actions/rightsActions";

interface ProvisionalAllotmentProps {
  declarationId?: string;
  offerName?: string;
  ratioLabel?: string;
  ratioDenominator?: number;
  pricePerShare?: number | null;
  qualificationDateLabel?: string;
  entitlementLabel?: string;
}

export function ProvisionalAllotment({
  declarationId,
  offerName = "Rights Issue",
  ratioLabel = "",
  ratioDenominator = 10,
  pricePerShare = null,
  qualificationDateLabel = "",
  entitlementLabel = "Rights Due",
}: ProvisionalAllotmentProps) {
  const [computed, setComputed] = useState(false);
  const [validated, setValidated] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const compute = useComputeEntitlements();
  const email = useEmailShareholders();

  const { data: sh, isFetching, refetch } = useGetRightsIssueShareholders({
    params: { id: declarationId, page: 0, pageSize: 2000 },
    options: { enabled: computed && !!declarationId },
  });

  const rows = useMemo(() => sh?.content ?? [], [sh]);
  const stats = sh?.stats;

  const totalHeld = stats?.totalUnitsHeld ?? 0;
  const totalDue = stats?.totalRightsDue ?? 0;
  const totalValue = stats?.totalAmountDue ?? (pricePerShare != null ? totalDue * pricePerShare : null);
  const qualifying = stats?.totalShareholders ?? rows.length;

  const outreach: OutreachShareholder[] = useMemo(
    () =>
      rows.map((r) => ({
        id: r.shareholderId ?? r.accountNumber,
        accountNumber: r.accountNumber,
        name: r.name,
        address: r.address ?? "",
        holdings: r.unitsHeld,
      })),
    [rows],
  );

  function handleCompute() {
    if (!declarationId) {
      toast.error("Select a rights issue first.");
      return;
    }
    compute.mutate(declarationId, {
      onSuccess: () => {
        setComputed(true);
        refetch();
        toast.success("Provisional rights computed from the shareholder register.");
      },
      onError: (err) => toast.error((err as Error).message),
    });
  }

  async function handleDownloadPrelist() {
    if (!declarationId) return;
    setDownloading(true);
    try {
      const blob = await downloadRightsDeclarationReport(declarationId, "rights-prelist", "excel");
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rights_prelist_${declarationId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error((err as Error).message || "Failed to download pre-list.");
    } finally {
      setDownloading(false);
    }
  }

  function handleSendEmail() {
    if (!declarationId) return;
    email.mutate(declarationId, {
      onSuccess: () => {
        setDispatched(true);
        setEmailOpen(false);
        toast.success("Rights circular dispatched to eligible shareholders.");
      },
      onError: (err) => toast.error((err as Error).message),
    });
  }

  if (!declarationId) {
    return (
      <Card className="mrpsl-card p-8 text-center text-sm text-muted-foreground">
        Select a rights issue above to compute provisional allotments.
      </Card>
    );
  }

  if (!computed) {
    return (
      <div className="space-y-4">
        <Card className="mrpsl-card p-5">
          <div className={`grid gap-4 text-sm mb-5 ${pricePerShare != null ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <p className="mrpsl-label">Offer</p>
              <p className="font-medium mt-0.5">{offerName}</p>
            </div>
            <div>
              <p className="mrpsl-label">Ratio</p>
              <p className="font-medium mt-0.5">{ratioLabel || `1:${ratioDenominator}`}</p>
            </div>
            {pricePerShare != null && (
              <div>
                <p className="mrpsl-label">Offer Price per Share</p>
                <p className="font-mono font-semibold mt-0.5">₦{pricePerShare.toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Ready to compute provisional allotment</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The system calculates each qualifying shareholder&apos;s entitlement from the holder
                register as at the qualification date{qualificationDateLabel ? ` (${qualificationDateLabel})` : ""}.
              </p>
            </div>
            <Button onClick={handleCompute} disabled={compute.isPending} className="shrink-0 ml-4">
              {compute.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Computing…
                </span>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" /> Compute Provisional Rights
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-green-100 text-green-800 border-0">Rights Computed</Badge>
        {validated && <Badge className="bg-blue-100 text-blue-800 border-0">Pre-List Generated</Badge>}
        {dispatched && <Badge className="bg-purple-100 text-purple-800 border-0">Circulars Dispatched</Badge>}
        <div className="flex-1" />
        {!validated && (
          <Button variant="outline" size="sm" onClick={() => { setValidated(true); toast.success("Pre-list generated."); }}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Validate &amp; Generate Pre-List
          </Button>
        )}
        {validated && !dispatched && (
          <Button size="sm" onClick={() => setEmailOpen(true)} disabled={email.isPending}>
            <Send className="h-3.5 w-3.5 mr-1.5" /> Dispatch Circulars
          </Button>
        )}
        {dispatched && (
          <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)} disabled={email.isPending}>
            <Send className="h-3.5 w-3.5 mr-1.5" /> Re-send Circular
          </Button>
        )}
        {validated && (
          <Button variant="outline" size="sm" onClick={handleDownloadPrelist} disabled={downloading}>
            {downloading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1.5" />}
            Download Pre-List
          </Button>
        )}
      </div>

      <div className={`grid gap-3 ${totalValue != null ? "grid-cols-4" : "grid-cols-3"}`}>
        {[
          { label: "Qualifying Shareholders", value: qualifying.toLocaleString() },
          { label: "Total Holdings (Qualification)", value: totalHeld.toLocaleString() },
          { label: `Total ${entitlementLabel}`, value: totalDue.toLocaleString(), highlight: true },
          ...(totalValue != null
            ? [{ label: "Total Value (₦)", value: `₦${(totalValue / 1e6).toFixed(2)}M`, highlight: true }]
            : []),
        ].map(({ label, value, highlight }) => (
          <Card key={label} className="mrpsl-card p-3">
            <p className="mrpsl-label">{label}</p>
            <p className={`font-mono font-semibold text-lg mt-1 ${highlight ? "text-primary" : ""}`}>{value}</p>
          </Card>
        ))}
      </div>

      <EmailPreviewModal
        open={emailOpen}
        onOpenChange={setEmailOpen}
        offerType="rights"
        companyName={offerName}
        offerName={offerName}
        ratio={`1:${ratioDenominator}`}
        closeDate={qualificationDateLabel}
        issuePrice={pricePerShare != null ? String(pricePerShare) : undefined}
        contactEmail="rightssubscription@meristemregistrars.com"
        shareholders={outreach}
        totalCount={qualifying}
        mode="rights-circular"
        onSent={handleSendEmail}
      />

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Provisional Allotment Schedule — {offerName}
          </p>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">#</th>
                <th className="text-left px-4 py-2.5 font-medium">Account No</th>
                <th className="text-left px-4 py-2.5 font-medium">Holder Name</th>
                <th className="text-right px-4 py-2.5 font-medium">Units Held</th>
                <th className="text-center px-4 py-2.5 font-medium">Ratio</th>
                <th className="text-right px-4 py-2.5 font-medium">{entitlementLabel}</th>
                {pricePerShare != null && <th className="text-right px-4 py-2.5 font-medium">Value (₦)</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={pricePerShare != null ? 7 : 6} className="px-4 py-10 text-center text-muted-foreground">
                    {isFetching ? "Loading entitlements…" : "No qualifying shareholders found."}
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.shareholderId ?? r.accountNumber ?? i} className="mrpsl-table-row">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.accountNumber}</td>
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.unitsHeld?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{r.rightsRatio || `1:${ratioDenominator}`}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">{r.rightsDue?.toLocaleString()}</td>
                    {pricePerShare != null && (
                      <td className="px-4 py-2.5 text-right font-mono">₦{(r.amountPayable ?? 0).toLocaleString()}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="border-t-2 border-border bg-muted/20">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-muted-foreground text-right">
                    TOTALS ({qualifying.toLocaleString()} shareholders)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{totalHeld.toLocaleString()}</td>
                  <td />
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-primary">{totalDue.toLocaleString()}</td>
                  {totalValue != null && (
                    <td className="px-4 py-2.5 text-right font-mono font-bold">₦{(totalValue / 1e6).toFixed(2)}M</td>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
