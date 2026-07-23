"use client";

import { useState } from "react";
import {
  Play, ShieldCheck, Send, FileText, Lock,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmailPreviewModal, type OutreachShareholder } from "@/components/custom/shareholder-outreach-modals";

interface ProvisionalRecord {
  id: string;
  accountNo: string;
  holderName: string;
  unitsHeld: number;
  fractional: number;
}

const MOCK_SHAREHOLDERS: ProvisionalRecord[] = [
  { id: "1", accountNo: "ACC-00123456", holderName: "Adebayo Oluwaseun", unitsHeld: 45000, fractional: 0 },
  { id: "2", accountNo: "ACC-00234567", holderName: "Chinwe Okafor-Nwosu", unitsHeld: 120500, fractional: 0 },
  { id: "3", accountNo: "ACC-00345678", holderName: "Emeka Nwachukwu", unitsHeld: 8750, fractional: 0 },
  { id: "4", accountNo: "ACC-00456789", holderName: "Fatima Garba Abubakar", unitsHeld: 230000, fractional: 0 },
  { id: "5", accountNo: "ACC-00567890", holderName: "Yemi Olatunde-Bello", unitsHeld: 15320, fractional: 0 },
  { id: "6", accountNo: "ACC-00678901", holderName: "Ngozi Eze", unitsHeld: 62400, fractional: 0 },
  { id: "7", accountNo: "ACC-00789012", holderName: "Tunde Adewale Bakare", unitsHeld: 9100, fractional: 0 },
  { id: "8", accountNo: "ACC-00890123", holderName: "Amaka Chidinma Nnaji", unitsHeld: 500000, fractional: 0 },
  { id: "9", accountNo: "ACC-00901234", holderName: "Sunday Okonkwo", unitsHeld: 33300, fractional: 0 },
  { id: "10", accountNo: "ACC-01012345", holderName: "Halima Mohammed", unitsHeld: 7890, fractional: 0 },
];

interface ProvisionalAllotmentProps {
  offerName?: string;
  ratioLabel?: string;
  ratioDenominator?: number;
  pricePerShare?: number | null;
  qualificationDateLabel?: string;
  entitlementLabel?: string;
}

export function ProvisionalAllotment({
  offerName = "Fidelity Bank PLC Rights Issue 2024",
  ratioLabel = "1 new share for every 10 held",
  ratioDenominator = 10,
  pricePerShare = 9.25,
  qualificationDateLabel = "31 Jul 2024",
  entitlementLabel = "Rights Due",
}: ProvisionalAllotmentProps) {
  const [computed, setComputed] = useState(false);
  const [validated, setValidated] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [computing, setComputing] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  type SortKey = "holderName" | "unitsHeld" | "entitlementDue";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3.5 w-3.5 ml-1 text-primary" />
      : <ChevronDown className="h-3.5 w-3.5 ml-1 text-primary" />;
  };

  const outreachShareholders: OutreachShareholder[] = MOCK_SHAREHOLDERS.map((r) => ({
    id: r.id,
    accountNumber: r.accountNo,
    name: r.holderName,
    address: "Lagos, Nigeria",
    holdings: r.unitsHeld,
  }));

  const shareholders = MOCK_SHAREHOLDERS.map((r) => ({
    ...r,
    entitlementDue: Math.floor(r.unitsHeld / ratioDenominator),
  })).sort((a, b) => {
    if (!sortKey) return 0;
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "holderName") return a.holderName.localeCompare(b.holderName) * dir;
    return (a[sortKey] - b[sortKey]) * dir;
  });
  const totalEntitlementDue = shareholders.reduce((s, r) => s + r.entitlementDue, 0);
  const totalHeld = shareholders.reduce((s, r) => s + r.unitsHeld, 0);
  const totalValue = pricePerShare != null ? totalEntitlementDue * pricePerShare : null;

  const handleCompute = async () => {
    setComputing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setComputing(false);
    setComputed(true);
    toast.success(`Provisional allotment computed for ${MOCK_SHAREHOLDERS.length} qualifying shareholders.`);
  };

  const handleValidate = () => {
    setValidated(true);
    toast.success("Provisional allotment schedule validated. Pre-list generated.");
  };

  const handleDispatch = () => setEmailOpen(true);

  const handleSendEmail = () => {
    setDispatched(true);
    setEmailOpen(false);
    toast.success(`Circular dispatched to ${MOCK_SHAREHOLDERS.length} eligible shareholders.`);
  };

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
              <p className="font-medium mt-0.5">{ratioLabel}</p>
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
                The system will calculate each qualifying shareholder's entitlement based on
                holdings at the qualification date ({qualificationDateLabel}).
              </p>
            </div>
            <Button onClick={handleCompute} disabled={computing} className="shrink-0 ml-4">
              {computing ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Computing…
                </span>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Compute Provisional Rights
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
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-green-100 text-green-800 border-0">Rights Computed</Badge>
        {validated && <Badge className="bg-blue-100 text-blue-800 border-0">Pre-List Generated</Badge>}
        {dispatched && <Badge className="bg-purple-100 text-purple-800 border-0">Circulars Dispatched</Badge>}
        <div className="flex-1" />
        {!validated && (
          <Button variant="outline" size="sm" onClick={handleValidate}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Validate & Generate Pre-List
          </Button>
        )}
        {validated && !dispatched && (
          <Button size="sm" onClick={handleDispatch}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Dispatch Circulars
          </Button>
        )}
        {dispatched && (
          <Button variant="outline" size="sm" onClick={handleDispatch}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Re-send Circular
          </Button>
        )}
        {validated && (
          <Button variant="outline" size="sm" onClick={() => toast.info("Pre-list download coming soon")}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Download Pre-List
          </Button>
        )}
      </div>

      {/* Summary stats */}
      <div className={`grid gap-3 ${totalValue != null ? "grid-cols-4" : "grid-cols-3"}`}>
        {[
          { label: "Qualifying Shareholders", value: MOCK_SHAREHOLDERS.length.toLocaleString() },
          { label: "Total Holdings (Qualification)", value: totalHeld.toLocaleString() },
          { label: `Total ${entitlementLabel}`, value: totalEntitlementDue.toLocaleString(), highlight: true },
          ...(totalValue != null
            ? [{ label: "Total Value (₦)", value: `₦${(totalValue / 1e6).toFixed(2)}M`, highlight: true }]
            : []),
        ].map(({ label, value, highlight }) => (
          <Card key={label} className="mrpsl-card p-3">
            <p className="mrpsl-label">{label}</p>
            <p className={`font-mono font-semibold text-lg mt-1 ${highlight ? "text-primary" : ""}`}>
              {value}
            </p>
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
        contactEmail="rightssubscription@meristem.com"
        shareholders={outreachShareholders}
        totalCount={MOCK_SHAREHOLDERS.length}
        mode="rights-circular"
        onSent={handleSendEmail}
      />

      {/* Provisional allotment table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Provisional Allotment Schedule — {offerName}
          </p>
          {validated && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Locked by ICU
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">#</th>
                <th className="text-left px-4 py-2.5 font-medium">Account No</th>
                <th className="text-left px-4 py-2.5 font-medium">
                  <button onClick={() => handleSort("holderName")} className="flex items-center cursor-pointer hover:text-foreground transition-colors">
                    Holder Name <SortIcon col="holderName" />
                  </button>
                </th>
                <th className="text-right px-4 py-2.5 font-medium">
                  <button onClick={() => handleSort("unitsHeld")} className="flex items-center ml-auto cursor-pointer hover:text-foreground transition-colors">
                    Units Held <SortIcon col="unitsHeld" />
                  </button>
                </th>
                <th className="text-center px-4 py-2.5 font-medium">Ratio</th>
                <th className="text-right px-4 py-2.5 font-medium">
                  <button onClick={() => handleSort("entitlementDue")} className="flex items-center ml-auto cursor-pointer hover:text-foreground transition-colors">
                    {entitlementLabel} <SortIcon col="entitlementDue" />
                  </button>
                </th>
                {pricePerShare != null && <th className="text-right px-4 py-2.5 font-medium">Value (₦)</th>}
                <th className="text-right px-4 py-2.5 font-medium">Fractional</th>
              </tr>
            </thead>
            <tbody>
              {shareholders.map((r, i) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.accountNo}</td>
                  <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.unitsHeld.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">1:{ratioDenominator}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-primary">
                    {r.entitlementDue.toLocaleString()}
                  </td>
                  {pricePerShare != null && (
                    <td className="px-4 py-2.5 text-right font-mono">
                      ₦{(r.entitlementDue * pricePerShare).toLocaleString()}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                    {r.fractional > 0 ? r.fractional : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/20">
              <tr>
                <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-muted-foreground text-right">
                  TOTALS ({shareholders.length} shareholders)
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-bold">{totalHeld.toLocaleString()}</td>
                <td />
                <td className="px-4 py-2.5 text-right font-mono font-bold text-primary">
                  {totalEntitlementDue.toLocaleString()}
                </td>
                {totalValue != null && (
                  <td className="px-4 py-2.5 text-right font-mono font-bold">
                    ₦{(totalValue / 1e6).toFixed(2)}M
                  </td>
                )}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
