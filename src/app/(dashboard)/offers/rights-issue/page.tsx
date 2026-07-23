"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  AlertCircle,
  MousePointerClick,
  Download,
  Upload,
  CheckCircle2,
  FileText,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Rights Issue-specific components
import { ProvisionalAllotment } from "@/components/custom/rights-issue/provisional-allotment";
import { ReturnsCapture } from "@/components/custom/rights-issue/returns-capture";

// Shared offer-administration components
import { AllotmentRulesEngine } from "@/components/custom/offer-administration/allotment-rules-engine";

// Existing API-connected rights-issue components (preserved untouched)
import RightsIssueReports from "@/components/custom/rights-issue/rights-reports";
import { RightsRefundProcessing } from "@/components/custom/rights-issue/rights-refund-processing";

// Email modal
import { EmailPreviewModal } from "@/components/custom/shareholder-outreach-modals";

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
  "returns",
  "preview",
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
  "sec-reports": "SEC Reports",
  allotment: "Allotment Rule Engine",
  icu: "ICU Approval",
  refund: "Rights Refund Processing",
  "cscs-lodgment": "CSCS Lodgement",
  "cscs-reversals": "CSCS Reversals & Error Resolution",
  dispatch: "Dispatch & Notification",
  reports: "Reports",
};

const RIGHTS_ALLOTMENT_BANNER =
  "Accepted Rights (guaranteed) are excluded from banding — only Additional Shares Applied and Traded/Bought Rights are subject to the bands below.";

/* ─── Mock data for inline tabs ─────────────────────────── */

interface PreviewRow {
  id: string;
  holderName: string;
  chn: string;
  agent: string;
  units: number;
  amountPaid: number;
  status: "PENDING";
}

const PREVIEW_SEED: PreviewRow[] = [
  { id: "p1", holderName: "NGOZI CHIDINMA OKAFOR", chn: "C0023456BK", agent: "Meristem Stockbrokers Ltd", units: 5000, amountPaid: 92500, status: "PENDING" },
  { id: "p2", holderName: "AMAKA NGOZI OKONKWO", chn: "C0067890FK", agent: "Coronation Registrars", units: 12000, amountPaid: 222000, status: "PENDING" },
  { id: "p3", holderName: "CHUKWUEMEKA IFEANYI NWOSU", chn: "C0089012GK", agent: "Meristem Stockbrokers Ltd", units: 3000, amountPaid: 55500, status: "PENDING" },
  { id: "p4", holderName: "ADAEZE OBIORA NNAMDI", chn: "C0112345HK", agent: "CardinalStone Partners", units: 8500, amountPaid: 157250, status: "PENDING" },
  { id: "p5", holderName: "UCHE OKONKWO JAMES", chn: "C0234567IK", agent: "Stanbic IBTC Stockbrokers", units: 7000, amountPaid: 129500, status: "PENDING" },
  { id: "p6", holderName: "DAMILOLA ADEKUNLE SEUN", chn: "C0345678JK", agent: "Chapel Hill Denham", units: 3500, amountPaid: 64750, status: "PENDING" },
  { id: "p7", holderName: "GRACE NWACHUKWU ANAMBRA", chn: "C0456789KK", agent: "Meristem Stockbrokers Ltd", units: 9000, amountPaid: 166500, status: "PENDING" },
  { id: "p8", holderName: "OLUWAFEMI AKINLADE IBADAN", chn: "C0567890LK", agent: "Access Bank PLC", units: 6000, amountPaid: 111000, status: "PENDING" },
];

const ICU_ALLOTTED: Array<{ name: string; chn: string; rightsDue: number; additionalApplied: number; additionalAllotted: number; totalAllotted: number }> = [
  { name: "NGOZI CHIDINMA OKAFOR", chn: "C0023456BK", rightsDue: 5000, additionalApplied: 5000, additionalAllotted: 2500, totalAllotted: 7500 },
  { name: "AMAKA NGOZI OKONKWO", chn: "C0067890FK", rightsDue: 12000, additionalApplied: 12000, additionalAllotted: 6000, totalAllotted: 18000 },
  { name: "CHUKWUEMEKA IFEANYI NWOSU", chn: "C0089012GK", rightsDue: 3000, additionalApplied: 3000, additionalAllotted: 1500, totalAllotted: 4500 },
  { name: "ADAEZE OBIORA NNAMDI", chn: "C0112345HK", rightsDue: 8500, additionalApplied: 8500, additionalAllotted: 4000, totalAllotted: 12500 },
  { name: "UCHE OKONKWO JAMES", chn: "C0234567IK", rightsDue: 7000, additionalApplied: 7000, additionalAllotted: 3500, totalAllotted: 10500 },
  { name: "DAMILOLA ADEKUNLE SEUN", chn: "C0345678JK", rightsDue: 3500, additionalApplied: 3500, additionalAllotted: 1500, totalAllotted: 5000 },
  { name: "GRACE NWACHUKWU ANAMBRA", chn: "C0456789KK", rightsDue: 9000, additionalApplied: 9000, additionalAllotted: 4230, totalAllotted: 13230 },
  { name: "OLUWAFEMI AKINLADE IBADAN", chn: "C0567890LK", rightsDue: 6000, additionalApplied: 6000, additionalAllotted: 3000, totalAllotted: 9000 },
  { name: "ABUBAKAR SADIQ KANO", chn: "C0678901MK", rightsDue: 15000, additionalApplied: 15000, additionalAllotted: 7500, totalAllotted: 22500 },
  { name: "CHIOMA OBI ENUGU", chn: "C0789012NK", rightsDue: 8000, additionalApplied: 8000, additionalAllotted: 4000, totalAllotted: 12000 },
];

const ICU_NOT_ALLOTTED: Array<{ name: string; chn: string; additionalApplied: number; amountPaid: number }> = [
  { name: "TUNDE OLATUNJI LAGOS", chn: "C0890123OK", additionalApplied: 2000, amountPaid: 18500 },
  { name: "NNEKA OKAFOR ANAMBRA", chn: "C0901234PK", additionalApplied: 5000, amountPaid: 46250 },
  { name: "BASHIR IBRAHIM KADUNA", chn: "C1012345QK", additionalApplied: 1500, amountPaid: 13875 },
  { name: "FUNKE ADEYEMI OYO", chn: "C1123456RK", additionalApplied: 3000, amountPaid: 27750 },
  { name: "EMEKA OKONKWO DELTA", chn: "C1234567SK", additionalApplied: 1200, amountPaid: 11100 },
];

const CSCS_LODGMENT_ROWS: Array<{ name: string; chn: string; cscs: string; regAcct: string; rightsAllotted: number; additionalAllotted: number; totalAllotted: number }> = [
  { name: "NGOZI CHIDINMA OKAFOR", chn: "C0023456BK", cscs: "CSCS-000234561", regAcct: "REG-00123456", rightsAllotted: 5000, additionalAllotted: 2500, totalAllotted: 7500 },
  { name: "AMAKA NGOZI OKONKWO", chn: "C0067890FK", cscs: "CSCS-000678903", regAcct: "REG-00678901", rightsAllotted: 12000, additionalAllotted: 6000, totalAllotted: 18000 },
  { name: "CHUKWUEMEKA IFEANYI NWOSU", chn: "C0089012GK", cscs: "CSCS-000890124", regAcct: "REG-00890123", rightsAllotted: 3000, additionalAllotted: 1500, totalAllotted: 4500 },
  { name: "ADAEZE OBIORA NNAMDI", chn: "C0112345HK", cscs: "CSCS-001123456", regAcct: "REG-01123456", rightsAllotted: 8500, additionalAllotted: 4000, totalAllotted: 12500 },
  { name: "UCHE OKONKWO JAMES", chn: "C0234567IK", cscs: "CSCS-002345678", regAcct: "REG-02345678", rightsAllotted: 7000, additionalAllotted: 3500, totalAllotted: 10500 },
  { name: "DAMILOLA ADEKUNLE SEUN", chn: "C0345678JK", cscs: "CSCS-003456789", regAcct: "REG-03456789", rightsAllotted: 3500, additionalAllotted: 1500, totalAllotted: 5000 },
  { name: "GRACE NWACHUKWU ANAMBRA", chn: "C0456789KK", cscs: "CSCS-004567890", regAcct: "REG-04567890", rightsAllotted: 9000, additionalAllotted: 4230, totalAllotted: 13230 },
  { name: "OLUWAFEMI AKINLADE IBADAN", chn: "C0567890LK", cscs: "CSCS-005678901", regAcct: "REG-05678901", rightsAllotted: 6000, additionalAllotted: 3000, totalAllotted: 9000 },
  { name: "ABUBAKAR SADIQ KANO", chn: "C0678901MK", cscs: "CSCS-006789012", regAcct: "REG-06789012", rightsAllotted: 15000, additionalAllotted: 7500, totalAllotted: 22500 },
  { name: "CHIOMA OBI ENUGU", chn: "C0789012NK", cscs: "CSCS-007890123", regAcct: "REG-07890123", rightsAllotted: 8000, additionalAllotted: 4000, totalAllotted: 12000 },
];

const CSCS_SUCCESS_ROWS = [
  { name: "NGOZI CHIDINMA OKAFOR", account: "REG-00123456", unitsCredited: 7500 },
  { name: "AMAKA NGOZI OKONKWO", account: "REG-00678901", unitsCredited: 18000 },
  { name: "CHUKWUEMEKA IFEANYI NWOSU", account: "REG-00890123", unitsCredited: 4500 },
  { name: "ADAEZE OBIORA NNAMDI", account: "REG-01123456", unitsCredited: 12500 },
  { name: "UCHE OKONKWO JAMES", account: "REG-02345678", unitsCredited: 10500 },
  { name: "DAMILOLA ADEKUNLE SEUN", account: "REG-03456789", unitsCredited: 5000 },
  { name: "GRACE NWACHUKWU ANAMBRA", account: "REG-04567890", unitsCredited: 13230 },
  { name: "OLUWAFEMI AKINLADE IBADAN", account: "REG-05678901", unitsCredited: 9000 },
];

const CSCS_ERROR_ROWS = [
  { id: "e1", name: "ABUBAKAR SADIQ KANO", account: "REG-06789012", chn: "C0678901MK", reason: "CSCS account mismatch" },
  { id: "e2", name: "CHIOMA OBI ENUGU", account: "REG-07890123", chn: "C0789012NK", reason: "Duplicate transaction reference" },
  { id: "e3", name: "TUNDE OLATUNJI LAGOS", account: "REG-08901234", chn: "C0890123OK", reason: "Invalid CHN format" },
  { id: "e4", name: "FUNKE ADEYEMI OYO", account: "REG-11234567", chn: "C1123456RK", reason: "Insufficient clearing balance" },
];

const DISPATCH_ALLOTTED: Array<{ name: string; chn: string; cscs: string; totalAllotted: number; certStatus: "CSCS" | "CERT" }> = [
  { name: "NGOZI CHIDINMA OKAFOR", chn: "C0023456BK", cscs: "CSCS-000234561", totalAllotted: 7500, certStatus: "CSCS" },
  { name: "AMAKA NGOZI OKONKWO", chn: "C0067890FK", cscs: "CSCS-000678903", totalAllotted: 18000, certStatus: "CSCS" },
  { name: "CHUKWUEMEKA IFEANYI NWOSU", chn: "C0089012GK", cscs: "CSCS-000890124", totalAllotted: 4500, certStatus: "CERT" },
  { name: "ADAEZE OBIORA NNAMDI", chn: "C0112345HK", cscs: "CSCS-001123456", totalAllotted: 12500, certStatus: "CSCS" },
  { name: "UCHE OKONKWO JAMES", chn: "C0234567IK", cscs: "CSCS-002345678", totalAllotted: 10500, certStatus: "CSCS" },
  { name: "DAMILOLA ADEKUNLE SEUN", chn: "C0345678JK", cscs: "CSCS-003456789", totalAllotted: 5000, certStatus: "CERT" },
  { name: "GRACE NWACHUKWU ANAMBRA", chn: "C0456789KK", cscs: "CSCS-004567890", totalAllotted: 13230, certStatus: "CSCS" },
  { name: "OLUWAFEMI AKINLADE IBADAN", chn: "C0567890LK", cscs: "CSCS-005678901", totalAllotted: 9000, certStatus: "CSCS" },
  { name: "ABUBAKAR SADIQ KANO", chn: "C0678901MK", cscs: "CSCS-006789012", totalAllotted: 22500, certStatus: "CSCS" },
  { name: "CHIOMA OBI ENUGU", chn: "C0789012NK", cscs: "CSCS-007890123", totalAllotted: 12000, certStatus: "CSCS" },
];

const SEC_REPORTS = [
  "Additional Investors",
  "Agent Summary",
  "Full Subscription List With Additional",
  "Full Subscription List Without Additional",
  "Holders With CHN",
  "Holders Without CHN",
  "Global Subscription List",
  "Holders With X Percent And Above",
  "Holders With X Units and Above",
  "Listing By Batch",
  "Listing by Agent",
  "Partial Subscription",
  "Processed Rights",
  "Processed Rights By Batch",
  "Processed Rights Certificates",
  "Right Range Analysis",
  "Right Summary",
  "Rights PreList",
  "Rights with Membercode and/or CHN",
  "Subscription by Agent",
  "Unauthorized Batch",
];

/* ─── Inline tab components ─────────────────────────────── */

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

function RightsPreviewTab() {
  const [sentToHOD, setSentToHOD] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.ceil(PREVIEW_SEED.length / pageSize);
  const paged = PREVIEW_SEED.slice((page - 1) * pageSize, page * pageSize);

  const handlePageSizeChange = (val: string | null) => {
    if (!val) return;
    setPageSize(Number(val));
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex-1">
            Rights Acceptances
            <Badge className="ml-2 bg-muted text-muted-foreground border-0 normal-case text-[11px] font-normal">{PREVIEW_SEED.length} records</Badge>
          </p>
          <Button variant="outline" size="sm" onClick={() => toast.success("Rights preview downloaded.")}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download as CSV
          </Button>
          <Button
            size="sm"
            disabled={sentToHOD}
            onClick={() => {
              setSentToHOD(true);
              toast.success("Sent to Head of Department for approval.");
            }}
          >
            {sentToHOD ? "Sent to Head of Department" : "Send to Head of Department for Approval"}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">#</th>
                <th className="text-left px-4 py-2.5 font-medium">HOLDER NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">AGENT</th>
                <th className="text-right px-4 py-2.5 font-medium">UNITS</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT PAID (₦)</th>
                <th className="text-center px-4 py-2.5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, idx) => (
                <tr key={r.id} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 text-muted-foreground">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium">{r.holderName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{r.agent}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.units.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.amountPaid.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">PENDING</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-7 w-16 text-xs px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(n => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, PREVIEW_SEED.length)} of {PREVIEW_SEED.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="h-7 px-2.5 text-xs"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(p)}
                className="h-7 w-7 p-0 text-xs"
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="h-7 px-2.5 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SECReportsTab() {
  const [thresholdUnits, setThresholdUnits] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState("");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {SEC_REPORTS.map((name) => {
          const needsUnits = name === "Holders With X Units and Above";
          const needsPercent = name === "Holders With X Percent And Above";
          return (
            <Card key={name} className="mrpsl-card p-4 space-y-3">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-snug">{name}</p>
              </div>
              {needsUnits && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Threshold (units)</p>
                  <Input
                    type="number"
                    className="mrpsl-input h-8 text-xs"
                    placeholder="e.g. 10000"
                    value={thresholdUnits}
                    onChange={(e) => setThresholdUnits(e.target.value)}
                  />
                </div>
              )}
              {needsPercent && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Threshold (%)</p>
                  <Input
                    type="number"
                    className="mrpsl-input h-8 text-xs"
                    placeholder="e.g. 0.5"
                    value={thresholdPercent}
                    onChange={(e) => setThresholdPercent(e.target.value)}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => toast.info(`Generating ${name}…`)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => toast.success(`Downloaded ${name}.`)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ICUApprovalTab({ onApprove }: { onApprove: () => void }) {
  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Allotted", value: "12,847", color: "text-foreground" },
          { label: "Total Additional Shares Allotted", value: "4,230", color: "text-blue-700" },
          { label: "Total Not Allotted (Additional)", value: "617", color: "text-amber-700" },
          { label: "Total Amount to Refund", value: "₦5,707,250", color: "text-red-700" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="mrpsl-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`font-mono font-bold text-xl ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Allotted shareholders */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Allotted Shareholders</p>
          <Button variant="outline" size="sm" onClick={() => toast.success("Full list downloaded.")}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Full List (CSV)
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-right px-4 py-2.5 font-medium">RIGHTS DUE</th>
                <th className="text-right px-4 py-2.5 font-medium">ADDITIONAL APPLIED</th>
                <th className="text-right px-4 py-2.5 font-medium">ADDITIONAL ALLOTTED</th>
                <th className="text-right px-4 py-2.5 font-medium">TOTAL ALLOTTED</th>
              </tr>
            </thead>
            <tbody>
              {ICU_ALLOTTED.map((r) => (
                <tr key={r.chn} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium text-sm">{r.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.chn}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.rightsDue.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.additionalApplied.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-blue-700">{r.additionalAllotted.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">{r.totalAllotted.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Not allotted */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Not Allotted — Additional Shares</p>
          <Button variant="outline" size="sm" onClick={() => toast.success("Not-allotted list downloaded.")}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Not-Allotted List (CSV)
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-right px-4 py-2.5 font-medium">ADDITIONAL APPLIED</th>
                <th className="text-right px-4 py-2.5 font-medium">AMOUNT PAID (₦)</th>
              </tr>
            </thead>
            <tbody>
              {ICU_NOT_ALLOTTED.map((r) => (
                <tr key={r.chn} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium text-sm">{r.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.chn}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.additionalApplied.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-red-700">{r.amountPaid.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          className="text-red-700 border-red-200 hover:bg-red-50"
          onClick={() => toast.error("Allotment rejected. Returned for review.")}
        >
          Reject
        </Button>
        <Button onClick={() => {
          toast.success("ICU approval granted. Proceeding to CSCS Lodgement.");
          onApprove();
        }}>
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          Approve & Proceed to CSCS Lodgement
        </Button>
      </div>
    </div>
  );
}

function CSCSLodgmentTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge className="bg-green-100 text-green-800 border-0">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          ICU Approved — Ready for Lodgement
        </Badge>
        <Button variant="outline" onClick={() => toast.success("CSCS Lodgement File downloaded.")}>
          <Download className="h-4 w-4 mr-1.5" />
          Download CSCS Lodgement File
        </Button>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ICU-Approved Allotments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">CSCS NUMBER</th>
                <th className="text-left px-4 py-2.5 font-medium">REGISTRAR ACCT NO</th>
                <th className="text-right px-4 py-2.5 font-medium">RIGHTS ALLOTTED</th>
                <th className="text-right px-4 py-2.5 font-medium">ADDITIONAL ALLOTTED</th>
                <th className="text-right px-4 py-2.5 font-medium">TOTAL ALLOTTED</th>
              </tr>
            </thead>
            <tbody>
              {CSCS_LODGMENT_ROWS.map((r) => (
                <tr key={r.chn} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium text-sm">{r.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.cscs}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.regAcct}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.rightsAllotted.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-blue-700">{r.additionalAllotted.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">{r.totalAllotted.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CSCSReversalsTab() {
  const [fileProcessed, setFileProcessed] = useState(false);
  const [reversedIds, setReversedIds] = useState<Set<string>>(new Set());

  const initiateReversal = (id: string, name: string) => {
    setReversedIds((prev) => new Set([...prev, id]));
    toast.success(`${name} reversed. Forwarded to refund flow.`);
  };

  return (
    <div className="space-y-5">
      {!fileProcessed ? (
        <Card className="mrpsl-card p-8 space-y-5">
          <div className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3">
            <Upload className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">Drag and drop CSCS response file here</p>
              <p className="text-xs text-muted-foreground mt-1">Accepts .csv, .xlsx, .txt formats</p>
            </div>
            <input type="file" className="hidden" />
            <Button variant="outline" size="sm">Browse File</Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setFileProcessed(true)}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Process CSCS Response File
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border text-sm">
            <span className="flex items-center gap-1.5 text-green-700 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {CSCS_SUCCESS_ROWS.length} holders credited
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1.5 text-red-700 font-medium">
              <AlertCircle className="h-4 w-4" />
              {CSCS_ERROR_ROWS.length} holders with errors
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Successfully lodged */}
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-green-50/50">
                <p className="text-xs font-bold uppercase tracking-widest text-green-800">Successfully Lodged</p>
              </div>
              <div className="divide-y divide-border">
                {CSCS_SUCCESS_ROWS.map((r) => (
                  <div key={r.account} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.account}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-0 text-xs font-mono">
                      {r.unitsCredited.toLocaleString()} units
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Lodgement errors */}
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-red-50/50 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-red-800">Lodgement Errors</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.success("Error list downloaded.")}>
                    <Download className="h-3 w-3 mr-1" />
                    Download Error List
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      CSCS_ERROR_ROWS.forEach((r) => {
                        setReversedIds((prev) => new Set([...prev, r.id]));
                      });
                      toast.success("All reversals initiated. Forwarded to refund flow.");
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Initiate All Reversals
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {CSCS_ERROR_ROWS.map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.account} · {r.chn}</p>
                      <p className="text-xs text-red-600 mt-0.5">{r.reason}</p>
                    </div>
                    {reversedIds.has(r.id) ? (
                      <Badge className="bg-green-100 text-green-800 border-0 text-xs shrink-0">Reversed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-700 border-red-200 hover:bg-red-50 shrink-0"
                        onClick={() => initiateReversal(r.id, r.name)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Initiate Reversal
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function DispatchTab({ offerName, offerRatio, offerPrice }: { offerName: string; offerRatio: string; offerPrice: number }) {
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* Offer summary card */}
      <Card className="mrpsl-card p-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Offer Name</p>
            <p className="font-semibold">{offerName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Rights Ratio</p>
            <p className="font-mono font-semibold">{offerRatio}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Issue Price</p>
            <p className="font-mono font-semibold">₦{offerPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total Shareholders Allotted</p>
            <p className="font-mono font-semibold">10</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total Units Allotted</p>
            <p className="font-mono font-semibold">115,230</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Status</p>
            <Badge className="bg-blue-100 text-blue-800 border-0">ALLOTTED</Badge>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => toast.success("CSCS Approved Lodgement List downloaded.")}>
          <Download className="h-4 w-4 mr-1.5" />
          Download CSCS Approved Lodgement List (Excel)
        </Button>
        <Button variant="outline" onClick={() => toast.success("Sticky labels preview ready for download.")}>
          <Download className="h-4 w-4 mr-1.5" />
          Preview & Download Sticky Labels (CSV)
        </Button>
        <Button variant="outline" onClick={() => setEmailPreviewOpen(true)}>
          Email Shareholders
        </Button>
        <Button onClick={() => toast.success("Rights allotment data pushed to CSCS API.")}>
          Push to CSCS API
        </Button>
      </div>

      {/* Allotted shareholders table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Allotted Shareholders</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="mrpsl-table-header">
                <th className="text-left px-4 py-2.5 font-medium">NAME</th>
                <th className="text-left px-4 py-2.5 font-medium">CHN</th>
                <th className="text-left px-4 py-2.5 font-medium">CSCS NO.</th>
                <th className="text-right px-4 py-2.5 font-medium">TOTAL ALLOTTED</th>
                <th className="text-center px-4 py-2.5 font-medium">CERT/CSCS STATUS</th>
              </tr>
            </thead>
            <tbody>
              {DISPATCH_ALLOTTED.map((r) => (
                <tr key={r.chn} className="mrpsl-table-row">
                  <td className="px-4 py-2.5 font-medium text-sm">{r.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.cscs}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold">{r.totalAllotted.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className={`border-0 text-[11px] ${r.certStatus === "CSCS" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                      {r.certStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <EmailPreviewModal
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        offerType="rights"
        companyName="Fidelity Bank PLC"
        offerName={offerName}
        ratio={offerRatio}
        closeDate="31 Jul 2024"
        issuePrice={`₦${offerPrice.toFixed(2)}`}
        allotDate="15 Aug 2024"
        contactEmail="registrar@meristem.com"
        shareholders={DISPATCH_ALLOTTED.slice(0, 3).map((r, i) => ({
          id: String(i + 1),
          accountNumber: r.chn,
          name: r.name,
          address: "Lagos, Nigeria",
          holdings: r.totalAllotted,
        }))}
        totalCount={DISPATCH_ALLOTTED.length}
        mode="allotment"
      />
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */

export default function RightsIssuePage() {
  const [activeTab, setActiveTab] = useState<TabValue>("provisional");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");

  const selectedOffer =
    MOCK_RIGHTS_OFFERS.find((o) => o.id === selectedOfferId) ?? null;

  const handleICUApprove = () => {
    setActiveTab("cscs-lodgment");
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
          {/* Provisional Allotment */}
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

          {/* Returns Capture */}
          <TabsContent value="returns">
            <ReturnsCapture />
          </TabsContent>

          {/* Rights Preview */}
          <TabsContent value="preview">
            <RightsPreviewTab />
          </TabsContent>

          {/* SEC Reports */}
          <TabsContent value="sec-reports">
            <SECReportsTab />
          </TabsContent>

          {/* Allotment Rule Engine */}
          <TabsContent value="allotment">
            <AllotmentRulesEngine bannerMessage={RIGHTS_ALLOTMENT_BANNER} />
          </TabsContent>

          {/* ICU Approval */}
          <TabsContent value="icu">
            <ICUApprovalTab onApprove={handleICUApprove} />
          </TabsContent>

          {/* Rights Refund Processing */}
          <TabsContent value="refund">
            <RightsRefundProcessing />
          </TabsContent>

          {/* CSCS Lodgement */}
          <TabsContent value="cscs-lodgment">
            <CSCSLodgmentTab />
          </TabsContent>

          {/* CSCS Reversals & Error Resolution */}
          <TabsContent value="cscs-reversals">
            <CSCSReversalsTab />
          </TabsContent>

          {/* Dispatch & Notification */}
          <TabsContent value="dispatch">
            {selectedOffer && (
              <DispatchTab
                offerName={selectedOffer.name}
                offerRatio={selectedOffer.ratio}
                offerPrice={selectedOffer.offerPrice}
              />
            )}
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
