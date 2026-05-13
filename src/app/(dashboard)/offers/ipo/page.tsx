"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Upload,
  Download,
  BarChart3,
  X,
  CalendarRange,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import UploadIPOData from "@/components/custom/ipo/upload-data";

const MOCK_APPROVED = [
  {
    name: "ADEBISI FUNMILAYO",
    chn: "C00001001EL",
    broker: "Meristem",
    bank: "GTBank",
    acct: "0012345678",
    units: 50000,
    amount: 2500000,
  },
  {
    name: "OKAFOR CHUKWUEMEKA",
    chn: "C00004509EL",
    broker: "Stanbic IBTC",
    bank: "Zenith",
    acct: "2023456781",
    units: 10000,
    amount: 500000,
  },
  {
    name: "IBRAHIM FATIMA",
    chn: "C00009821EL",
    broker: "CardinalStone",
    bank: "Access",
    acct: "0987654321",
    units: 25000,
    amount: 1250000,
  },
  {
    name: "OLAWALE DAVID",
    chn: "C00002200EL",
    broker: "ARM Securities",
    bank: "UBA",
    acct: "3012345600",
    units: 100000,
    amount: 5000000,
  },
  {
    name: "NWOSU CHIDINMA",
    chn: "C00007811EL",
    broker: "FCMB Capital",
    bank: "Fidelity",
    acct: "5009871234",
    units: 5000,
    amount: 250000,
  },
  {
    name: "ALIYU SADIQ",
    chn: "C00003312EL",
    broker: "Meristem",
    bank: "First Bank",
    acct: "3098765432",
    units: 20000,
    amount: 1000000,
  },
  {
    name: "ADELEKE GRACE",
    chn: "C00005678EL",
    broker: "Vetiva",
    bank: "Sterling",
    acct: "0071234567",
    units: 15000,
    amount: 750000,
  },
  {
    name: "JAMES PATIENCE",
    chn: "C00008899EL",
    broker: "Afrinvest",
    bank: "Polaris",
    acct: "4056789012",
    units: 30000,
    amount: 1500000,
  },
];

const MOCK_DISAPPROVED = [
  {
    name: "OKORO BLESSING",
    bank: "GTBank",
    acct: "0045678901",
    amount: 250000,
    reason: "Account name mismatch",
  },
  {
    name: "HASSAN MUHAMMED",
    bank: "Zenith",
    acct: "2011223344",
    amount: 100000,
    reason: "Duplicate application",
  },
  {
    name: "AFOLABI TAIWO",
    bank: "Access",
    acct: "0067890123",
    amount: 500000,
    reason: "Incomplete KYC documentation",
  },
];

const MOCK_INVALID = [
  {
    name: "UCHENNA EMEKA",
    amount: 50000,
    reason: "Subscription below minimum threshold (₦100,000)",
  },
  {
    name: "BADMUS LATEEF",
    amount: 200000,
    reason: "Invalid CHN — not found in CSCS database",
  },
];

const REPORT_TYPES = [
  "Application Offer",
  "Application Offer Summary",
  "Full Subscription List",
  "State Summary",
  "Range Analysis",
  "Summary Batch Report",
];

export default function IPOPage() {
  const { registers } = useStore();
  const ordinaryRegisters = registers.filter(
    (r) => r.registerType === "ORDINARY" && r.status === "ACTIVE",
  );

  const [activeTab, setActiveTab] = useState("upload");

  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [icuReviewingBatch, setIcuReviewingBatch] = useState<string | null>(
    null,
  );
  const [icuTab, setIcuTab] = useState<"approved" | "disapproved" | "invalid">(
    "approved",
  );
  const [icuComment, setIcuComment] = useState("");
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);

  // Pending Approval filters
  const [authRegister, setAuthRegister] = useState("all");
  const [authDateRange, setAuthDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [authCalOpen, setAuthCalOpen] = useState(false);

  // Review dialog
  const [reviewTab, setReviewTab] = useState<
    "approved" | "disapproved" | "invalid"
  >("approved");
  const [reviewComment, setReviewComment] = useState("");

  const handleApprove = () => {
    toast.success("Batch approved and forwarded to ICU.");
    setReviewingBatch(null);
    setReviewComment("");
  };

  const handleReject = () => {
    toast.error("Batch rejected.");
    setReviewingBatch(null);
    setReviewComment("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          IPO / Public Offer Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage subscriber lists, approvals, lodgment, and allotment for
          Initial Public Offers
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="upload"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Upload Data
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approval
          </TabsTrigger>
          <TabsTrigger
            value="icu"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            ICU Approval
          </TabsTrigger>
          <TabsTrigger
            value="lodgment"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Lodgment
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Reports
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* ── Upload Data ── */}
          <TabsContent value="upload" className="space-y-6">
            {/* Batch controls */}
            <UploadIPOData tab={activeTab} />
          </TabsContent>

          {/* ── Pending Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            {reviewingBatch === null ? (
              <>
                {/* Filters */}
                <Card className="mrpsl-card p-5">
                  <div className="grid grid-cols-[1fr_1fr] gap-4 max-w-2xl">
                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Register</label>
                      <Select
                        value={authRegister}
                        onValueChange={(v) => setAuthRegister(v ?? "all")}
                      >
                        <SelectTrigger className="mrpsl-input w-full">
                          <SelectValue placeholder="All Registers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Registers</SelectItem>
                          {ordinaryRegisters.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} · {r.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="mrpsl-label">Date Range</label>
                      <Popover
                        open={authCalOpen}
                        onOpenChange={(v) => {
                          if (!v && authDateRange?.from && !authDateRange?.to)
                            return;
                          setAuthCalOpen(v);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "mrpsl-input w-full justify-start gap-2 px-3 font-normal text-sm",
                              !authDateRange && "text-muted-foreground",
                            )}
                          >
                            <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 text-left truncate">
                              {authDateRange?.from
                                ? authDateRange.to
                                  ? `${format(authDateRange.from, "dd MMM yyyy")} – ${format(authDateRange.to, "dd MMM yyyy")}`
                                  : format(authDateRange.from, "dd MMM yyyy")
                                : "Select date range"}
                            </span>
                            {authDateRange && (
                              <span
                                role="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAuthDateRange(undefined);
                                }}
                                className="ml-auto rounded-full hover:bg-muted p-0.5 shrink-0"
                              >
                                <X className="h-3 w-3 text-muted-foreground" />
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={authDateRange}
                            onSelect={(r) => {
                              setAuthDateRange(r);
                              if (r?.from && r?.to) setAuthCalOpen(false);
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </Card>

                {/* Batch list */}
                <Card className="mrpsl-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3">BATCH REF</th>
                        <th className="px-4 py-3">REGISTER</th>
                        <th className="px-4 py-3">BATCH DATE</th>
                        <th className="px-4 py-3 text-right">APPROVED</th>
                        <th className="px-4 py-3 text-right">DISAPPROVED</th>
                        <th className="px-4 py-3 text-right">INVALID</th>
                        <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          BATCH-IPO-20260429-001
                        </td>
                        <td className="px-4 py-3 font-semibold">DANGCEM</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          29 Apr 2026
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                          1,180
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-amber-600 font-semibold">
                          45
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-red-600 font-semibold">
                          15
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          ₦2,500,000,000
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
                            Pending
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setReviewTab("approved");
                              setReviewingBatch("BATCH-IPO-20260429-001");
                            }}
                          >
                            Review &amp; Approve
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              </>
            ) : (
              /* ── Detail / Review view ── */
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={() => {
                      setReviewingBatch(null);
                      setReviewComment("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Pending Approval
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {reviewingBatch}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · DANGCEM · 29 Apr 2026
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
                    Pending
                  </Badge>
                  <div className="flex-1" />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                  >
                    Reject Batch
                  </Button>
                  <Button size="sm" onClick={handleApprove}>
                    Approve &amp; Forward to ICU
                  </Button>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    {
                      label: "Total Subscribers",
                      value: "1,240",
                      color: "text-foreground",
                      tab: null,
                    },
                    {
                      label: "Approved",
                      value: "1,180",
                      color: "text-green-700",
                      tab: "approved" as const,
                    },
                    {
                      label: "Disapproved",
                      value: "45",
                      color: "text-amber-600",
                      tab: "disapproved" as const,
                    },
                    {
                      label: "Invalid",
                      value: "15",
                      color: "text-red-600",
                      tab: "invalid" as const,
                    },
                    {
                      label: "Total Amount",
                      value: "₦2.5B",
                      color: "text-foreground",
                      tab: null,
                    },
                  ].map((s) => (
                    <Card
                      key={s.label}
                      className={cn(
                        "mrpsl-card p-3",
                        s.tab &&
                          "cursor-pointer hover:border-primary/40 transition-colors",
                      )}
                      onClick={() => s.tab && setReviewTab(s.tab)}
                    >
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-xl font-mono font-bold mt-1",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                      {s.tab && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          click to view
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Authorizer comment */}
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Authorizer Comment</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add a comment (required for rejection)..."
                    rows={2}
                    className="resize-none text-sm focus-visible:ring-primary rounded-xl"
                  />
                </div>

                {/* Subscriber tabs + table */}
                <Card className="mrpsl-card overflow-hidden">
                  {/* Tab strip */}
                  <div className="flex items-center gap-1 border-b px-4 bg-muted/10">
                    {(["approved", "disapproved", "invalid"] as const).map(
                      (t) => (
                        <button
                          key={t}
                          onClick={() => setReviewTab(t)}
                          className={cn(
                            "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                            reviewTab === t
                              ? t === "approved"
                                ? "border-green-600 text-green-700"
                                : t === "disapproved"
                                  ? "border-amber-500 text-amber-700"
                                  : "border-red-500 text-red-700"
                              : "border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {t === "approved"
                            ? `Approved (${MOCK_APPROVED.length.toLocaleString()})`
                            : t === "disapproved"
                              ? `Disapproved (${MOCK_DISAPPROVED.length})`
                              : `Invalid (${MOCK_INVALID.length})`}
                        </button>
                      ),
                    )}
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="my-1.5 mr-1"
                      onClick={() =>
                        toast.success(`Exporting ${reviewTab} list...`)
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export{" "}
                      {reviewTab.charAt(0).toUpperCase() + reviewTab.slice(1)}
                    </Button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    {reviewTab === "approved" && (
                      <table className="w-full text-left text-xs">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">NAME</th>
                            <th className="px-4 py-2.5">CHN</th>
                            <th className="px-4 py-2.5">BROKER</th>
                            <th className="px-4 py-2.5">BANK</th>
                            <th className="px-4 py-2.5">ACCOUNT NO</th>
                            <th className="px-4 py-2.5 text-right">UNITS</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT (₦)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_APPROVED.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 font-mono">{r.chn}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {r.broker}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {r.bank}
                              </td>
                              <td className="px-4 py-2.5 font-mono">
                                {r.acct}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {r.units.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-green-700 font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-xs">
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS (showing {MOCK_APPROVED.length} of 1,180)
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_APPROVED.reduce(
                                (s, r) => s + r.units,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-700">
                              ₦
                              {MOCK_APPROVED.reduce(
                                (s, r) => s + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}

                    {reviewTab === "disapproved" && (
                      <table className="w-full text-left text-xs">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">NAME</th>
                            <th className="px-4 py-2.5">BANK</th>
                            <th className="px-4 py-2.5">ACCOUNT NO</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT (₦)
                            </th>
                            <th className="px-4 py-2.5">REASON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_DISAPPROVED.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {r.bank}
                              </td>
                              <td className="px-4 py-2.5 font-mono">
                                {r.acct}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-amber-700 font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-normal">
                                  {r.reason}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-xs">
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS (showing {MOCK_DISAPPROVED.length} of 45)
                            </td>
                            <td className="px-4 py-2.5 text-right text-amber-700">
                              ₦
                              {MOCK_DISAPPROVED.reduce(
                                (s, r) => s + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    )}

                    {reviewTab === "invalid" && (
                      <table className="w-full text-left text-xs">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">NAME</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT (₦)
                            </th>
                            <th className="px-4 py-2.5">REASON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_INVALID.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-red-700 font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge className="bg-red-100 text-red-800 border-0 text-[10px] font-normal">
                                  {r.reason}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            {icuReviewingBatch === null ? (
              <Card className="mrpsl-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">BATCH REF</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">BATCH DATE</th>
                      <th className="px-4 py-3 text-right">APPROVED</th>
                      <th className="px-4 py-3 text-right">DISAPPROVED</th>
                      <th className="px-4 py-3 text-right">INVALID</th>
                      <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                      <th className="px-4 py-3">OPS APPROVAL</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        BATCH-IPO-20260429-001
                      </td>
                      <td className="px-4 py-3 font-semibold">DANGCEM</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        29 Apr 2026
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                        1,180
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-amber-600 font-semibold">
                        45
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-red-600 font-semibold">
                        15
                      </td>
                      <td className="px-4 py-3 font-mono text-right">
                        ₦2,500,000,000
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium">Adaeze Okafor</div>
                        <div className="text-[10px] text-muted-foreground">
                          Ops Manager · 29 Apr 2026, 14:32
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                          Awaiting ICU
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setIcuTab("approved");
                            setIcuReviewingBatch("BATCH-IPO-20260429-001");
                          }}
                        >
                          ICU Review
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={() => {
                      setIcuReviewingBatch(null);
                      setIcuComment("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to ICU Queue
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {icuReviewingBatch}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · DANGCEM · 29 Apr 2026
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                    Awaiting ICU
                  </Badge>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success(`Exporting ${icuTab} list...`)}
                  >
                    <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export{" "}
                    {icuTab.charAt(0).toUpperCase() + icuTab.slice(1)}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      toast.error("Batch returned to Operations.");
                      setIcuReviewingBatch(null);
                      setIcuComment("");
                    }}
                  >
                    Return to Ops
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success(
                        "ICU approved. Batch cleared for lodgment.",
                      );
                      setIcuReviewingBatch(null);
                      setIcuComment("");
                    }}
                  >
                    ICU Approve &amp; Clear for Lodgment
                  </Button>
                </div>

                {/* Ops approval audit trail */}
                <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Operations Approval Record
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <div className="mrpsl-section-title">Approved By</div>
                      <div className="font-semibold mt-0.5">Adaeze Okafor</div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Role</div>
                      <div className="mt-0.5">Operations Manager</div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">
                        Approval Date &amp; Time
                      </div>
                      <div className="font-mono mt-0.5">
                        29 Apr 2026, 14:32:07
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Comment</div>
                      <div className="text-muted-foreground mt-0.5 italic">
                        &quot;All documents verified. Approved for ICU
                        review.&quot;
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    {
                      label: "Total Subscribers",
                      value: "1,240",
                      color: "text-foreground",
                      tab: null,
                    },
                    {
                      label: "Approved",
                      value: "1,180",
                      color: "text-green-700",
                      tab: "approved" as const,
                    },
                    {
                      label: "Disapproved",
                      value: "45",
                      color: "text-amber-600",
                      tab: "disapproved" as const,
                    },
                    {
                      label: "Invalid",
                      value: "15",
                      color: "text-red-600",
                      tab: "invalid" as const,
                    },
                    {
                      label: "Total Amount",
                      value: "₦2.5B",
                      color: "text-foreground",
                      tab: null,
                    },
                  ].map((s) => (
                    <Card
                      key={s.label}
                      className={cn(
                        "mrpsl-card p-3",
                        s.tab &&
                          "cursor-pointer hover:border-primary/40 transition-colors",
                      )}
                      onClick={() => s.tab && setIcuTab(s.tab)}
                    >
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-xl font-mono font-bold mt-1",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                      {s.tab && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          click to view
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* ICU comment */}
                <div className="space-y-1.5">
                  <label className="mrpsl-label">ICU Comment</label>
                  <Textarea
                    value={icuComment}
                    onChange={(e) => setIcuComment(e.target.value)}
                    placeholder="Add ICU review comment (required for return to Ops)..."
                    rows={2}
                    className="resize-none text-sm focus-visible:ring-primary rounded-xl"
                  />
                </div>

                {/* Subscriber tabs + table */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="flex items-center gap-1 border-b px-4 bg-muted/10">
                    {(["approved", "disapproved", "invalid"] as const).map(
                      (t) => (
                        <button
                          key={t}
                          onClick={() => setIcuTab(t)}
                          className={cn(
                            "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                            icuTab === t
                              ? t === "approved"
                                ? "border-green-600 text-green-700"
                                : t === "disapproved"
                                  ? "border-amber-500 text-amber-700"
                                  : "border-red-500 text-red-700"
                              : "border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {t === "approved"
                            ? `Approved (${MOCK_APPROVED.length.toLocaleString()})`
                            : t === "disapproved"
                              ? `Disapproved (${MOCK_DISAPPROVED.length})`
                              : `Invalid (${MOCK_INVALID.length})`}
                        </button>
                      ),
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    {icuTab === "approved" && (
                      <table className="w-full text-left text-xs">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">NAME</th>
                            <th className="px-4 py-2.5">CHN</th>
                            <th className="px-4 py-2.5">BROKER</th>
                            <th className="px-4 py-2.5">BANK</th>
                            <th className="px-4 py-2.5">ACCOUNT NO</th>
                            <th className="px-4 py-2.5 text-right">UNITS</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT (₦)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_APPROVED.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 font-mono">{r.chn}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {r.broker}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {r.bank}
                              </td>
                              <td className="px-4 py-2.5 font-mono">
                                {r.acct}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {r.units.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-green-700 font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-xs">
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS (showing {MOCK_APPROVED.length} of 1,180)
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_APPROVED.reduce(
                                (s, r) => s + r.units,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-700">
                              ₦
                              {MOCK_APPROVED.reduce(
                                (s, r) => s + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                    {icuTab === "disapproved" && (
                      <table className="w-full text-left text-xs">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">NAME</th>
                            <th className="px-4 py-2.5">BANK</th>
                            <th className="px-4 py-2.5">ACCOUNT NO</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT (₦)
                            </th>
                            <th className="px-4 py-2.5">REASON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_DISAPPROVED.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {r.bank}
                              </td>
                              <td className="px-4 py-2.5 font-mono">
                                {r.acct}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-amber-700 font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-normal">
                                  {r.reason}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {icuTab === "invalid" && (
                      <table className="w-full text-left text-xs">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">NAME</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT (₦)
                            </th>
                            <th className="px-4 py-2.5">REASON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_INVALID.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-red-700 font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge className="bg-red-100 text-red-800 border-0 text-[10px] font-normal">
                                  {r.reason}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Lodgment ── */}
          <TabsContent value="lodgment">
            <Card className="mrpsl-card">
              <div className="p-5 border-b bg-muted/20">
                <Badge className="bg-emerald-100 text-emerald-800 border-0 mb-2">
                  ICU Approved
                </Badge>
                <h3 className="font-semibold text-base">
                  BATCH-IPO-20260428-005 — ZENITHBANK
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="mrpsl-label">Lodgment File Format</label>
                  <RadioGroup defaultValue="with_rin" className="flex gap-6">
                    <div className="flex items-center space-x-2.5">
                      <RadioGroupItem value="with_rin" id="r1" />
                      <label htmlFor="r1" className="text-sm">
                        RIN at CSCS
                      </label>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <RadioGroupItem value="no_rin" id="r2" />
                      <label htmlFor="r2" className="text-sm">
                        RIN NOT at CSCS
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden">
                  <div className="bg-muted/40 p-2 border-b text-xs tabular font-bold text-muted-foreground">
                    PREVIEW (5 ROWS)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs tabular">
                      <thead className="bg-muted/20">
                        <tr>
                          <th className="p-2 text-left">STOCKBROKER CODE</th>
                          <th className="p-2 text-left">CHN</th>
                          <th className="p-2 text-left">SHAREHOLDER NAME</th>
                          <th className="p-2 text-left">CERT NO</th>
                          <th className="p-2 text-left">CSCS ACCOUNT NO</th>
                          <th className="p-2 text-left">SYMBOL</th>
                          <th className="p-2 text-right">UNITS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C001</td>
                          <td className="p-2 font-mono">C00001001EL</td>
                          <td className="p-2">ADEBISI FUNMILAYO</td>
                          <td className="p-2 font-mono">ZB/001/2026</td>
                          <td className="p-2 font-mono">0200012345</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">50,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C045</td>
                          <td className="p-2 font-mono">C00004509EL</td>
                          <td className="p-2">OKAFOR CHUKWUEMEKA</td>
                          <td className="p-2 font-mono">ZB/002/2026</td>
                          <td className="p-2 font-mono">0200054321</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">10,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C017</td>
                          <td className="p-2 font-mono">C00009821EL</td>
                          <td className="p-2">IBRAHIM FATIMA</td>
                          <td className="p-2 font-mono">ZB/003/2026</td>
                          <td className="p-2 font-mono">0200098765</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">25,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C008</td>
                          <td className="p-2 font-mono">C00002200EL</td>
                          <td className="p-2">OLAWALE DAVID</td>
                          <td className="p-2 font-mono">ZB/004/2026</td>
                          <td className="p-2 font-mono">0200034560</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">100,000</td>
                        </tr>
                        <tr className="hover:bg-muted/20">
                          <td className="p-2 font-mono">C031</td>
                          <td className="p-2 font-mono">C00007811EL</td>
                          <td className="p-2">NWOSU CHIDINMA</td>
                          <td className="p-2 font-mono">ZB/005/2026</td>
                          <td className="p-2 font-mono">0200078112</td>
                          <td className="p-2">ZENITHBANK</td>
                          <td className="p-2 text-right font-mono">5,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => toast.info("Downloading lodgment file...")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Lodgment File
                    (.txt)
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() =>
                      toast.success("Pushed to CSCS API successfully.")
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" /> Push via CSCS API
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ── Reports (vertical layout) ── */}
          <TabsContent value="reports" className="space-y-6">
            {/* Report type selector */}
            <Card className="mrpsl-card">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Report Type
                </h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {REPORT_TYPES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedReport(r)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedReport === r
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Card>

            {/* Report viewer */}
            <Card className="mrpsl-card p-8 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[320px]">
              <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="font-semibold text-foreground text-base">
                {selectedReport}
              </h3>
              <p className="text-sm mt-1 mb-6 max-w-sm">
                Select filters and click Run Report to generate the output.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Register" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dangcem">DANGCEM</SelectItem>
                    <SelectItem value="zenith">ZENITHBANK</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => toast.info(`Generating ${selectedReport}...`)}
                >
                  Run Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info("Downloading report...")}
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
