"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Upload, Download, BarChart3 } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import UploadIPOData from "@/components/custom/ipo/upload-data";
import PendingApprovalIPO from "@/components/custom/ipo/pending-approval";
import IcuApprovalIPO from "@/components/custom/ipo/icu-approval";
import { useStore } from "@/lib/store";

const REPORT_TYPES = [
  "Application Offer",
  "Application Offer Summary",
  "Full Subscription List",
  "State Summary",
  "Range Analysis",
  "Summary Batch Report",
];

export default function IPOPage() {
  const { registers, currentUser } = useStore();
  const ordinaryRegisters = registers.filter(
    (r) => r.registerType === "ORDINARY" && r.status === "ACTIVE",
  );
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("");
  const [reportRun, setReportRun] = useState(false);

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

  const MOCK_BROKER_SUMMARY = [
    {
      broker: "Meristem",
      applications: 180,
      approved: 175,
      disapproved: 3,
      invalid: 2,
      units: 850000,
      amount: 42500000,
    },
    {
      broker: "Stanbic IBTC",
      applications: 220,
      approved: 210,
      disapproved: 8,
      invalid: 2,
      units: 1100000,
      amount: 55000000,
    },
    {
      broker: "CardinalStone",
      applications: 95,
      approved: 90,
      disapproved: 4,
      invalid: 1,
      units: 460000,
      amount: 23000000,
    },
    {
      broker: "ARM Securities",
      applications: 310,
      approved: 298,
      disapproved: 9,
      invalid: 3,
      units: 1550000,
      amount: 77500000,
    },
    {
      broker: "FCMB Capital",
      applications: 145,
      approved: 138,
      disapproved: 5,
      invalid: 2,
      units: 700000,
      amount: 35000000,
    },
    {
      broker: "Vetiva",
      applications: 175,
      approved: 165,
      disapproved: 8,
      invalid: 2,
      units: 825000,
      amount: 41250000,
    },
    {
      broker: "Afrinvest",
      applications: 115,
      approved: 104,
      disapproved: 8,
      invalid: 3,
      units: 555000,
      amount: 27750000,
    },
  ];

  const MOCK_ALL_APPLICATIONS = [
    ...MOCK_APPROVED.map((r) => ({
      ...r,
      status: "Approved" as const,
      reason: "",
    })),
    ...MOCK_DISAPPROVED.map((r) => ({
      ...r,
      chn: "—",
      broker: "—",
      units: 0,
      status: "Disapproved" as const,
    })),
    ...MOCK_INVALID.map((r) => ({
      ...r,
      chn: "—",
      broker: "—",
      bank: "—",
      acct: "—",
      units: 0,
      status: "Invalid" as const,
    })),
  ];

  const MOCK_ALLOTMENT = [
    {
      name: "ADEBISI FUNMILAYO",
      chn: "C00001001EL",
      broker: "Meristem",
      acct: "0200012345",
      subscribed: 50000,
      allotted: 50000,
      amount: 2500000,
      cert: "IPO/001/2026",
    },
    {
      name: "OKAFOR CHUKWUEMEKA",
      chn: "C00004509EL",
      broker: "Stanbic IBTC",
      acct: "0200054321",
      subscribed: 10000,
      allotted: 10000,
      amount: 500000,
      cert: "IPO/002/2026",
    },
    {
      name: "IBRAHIM FATIMA",
      chn: "C00009821EL",
      broker: "CardinalStone",
      acct: "0200098765",
      subscribed: 25000,
      allotted: 25000,
      amount: 1250000,
      cert: "IPO/003/2026",
    },
    {
      name: "OLAWALE DAVID",
      chn: "C00002200EL",
      broker: "ARM Securities",
      acct: "0200034560",
      subscribed: 100000,
      allotted: 80000,
      amount: 4000000,
      cert: "IPO/004/2026",
    },
    {
      name: "NWOSU CHIDINMA",
      chn: "C00007811EL",
      broker: "FCMB Capital",
      acct: "0200078112",
      subscribed: 5000,
      allotted: 5000,
      amount: 250000,
      cert: "IPO/005/2026",
    },
    {
      name: "ALIYU SADIQ",
      chn: "C00003312EL",
      broker: "Meristem",
      acct: "0200033120",
      subscribed: 20000,
      allotted: 20000,
      amount: 1000000,
      cert: "IPO/006/2026",
    },
    {
      name: "ADELEKE GRACE",
      chn: "C00005678EL",
      broker: "Vetiva",
      acct: "0200056780",
      subscribed: 15000,
      allotted: 15000,
      amount: 750000,
      cert: "IPO/007/2026",
    },
    {
      name: "JAMES PATIENCE",
      chn: "C00008899EL",
      broker: "Afrinvest",
      acct: "0200088990",
      subscribed: 30000,
      allotted: 30000,
      amount: 1500000,
      cert: "IPO/008/2026",
    },
  ];

  const MOCK_STATE_SUMMARY = [
    {
      state: "Lagos",
      subscribers: 420,
      units: 2100000,
      amount: 105000000,
      pct: 33.9,
    },
    {
      state: "Abuja (FCT)",
      subscribers: 215,
      units: 1075000,
      amount: 53750000,
      pct: 17.3,
    },
    {
      state: "Rivers",
      subscribers: 180,
      units: 900000,
      amount: 45000000,
      pct: 14.5,
    },
    {
      state: "Kano",
      subscribers: 98,
      units: 490000,
      amount: 24500000,
      pct: 7.9,
    },
    {
      state: "Oyo",
      subscribers: 87,
      units: 435000,
      amount: 21750000,
      pct: 7.0,
    },
    {
      state: "Delta",
      subscribers: 75,
      units: 375000,
      amount: 18750000,
      pct: 6.1,
    },
    {
      state: "Enugu",
      subscribers: 58,
      units: 290000,
      amount: 14500000,
      pct: 4.7,
    },
    {
      state: "Others",
      subscribers: 107,
      units: 535000,
      amount: 26750000,
      pct: 8.6,
    },
  ];

  const MOCK_RANGE_ANALYSIS = [
    {
      range: "₦50,000 – ₦100,000",
      count: 95,
      pct: 7.7,
      units: 190000,
      amount: 9500000,
    },
    {
      range: "₦100,001 – ₦500,000",
      count: 412,
      pct: 33.2,
      units: 2060000,
      amount: 103000000,
    },
    {
      range: "₦500,001 – ₦1,000,000",
      count: 338,
      pct: 27.3,
      units: 3380000,
      amount: 169000000,
    },
    {
      range: "₦1,000,001 – ₦5,000,000",
      count: 270,
      pct: 21.8,
      units: 5400000,
      amount: 270000000,
    },
    {
      range: "₦5,000,001 – ₦10,000,000",
      count: 85,
      pct: 6.9,
      units: 4250000,
      amount: 212500000,
    },
    {
      range: "Above ₦10,000,000",
      count: 40,
      pct: 3.2,
      units: 8000000,
      amount: 400000000,
    },
  ];

  const MOCK_BATCH_SUMMARY = [
    {
      ref: "BATCH-IPO-20260429-001",
      register: "DANGCEM",
      date: "29 Apr 2026",
      approved: 1180,
      disapproved: 45,
      invalid: 15,
      amount: 2500000000,
      status: "ICU Approved",
    },
    {
      ref: "BATCH-IPO-20260428-002",
      register: "DANGCEM",
      date: "28 Apr 2026",
      approved: 890,
      disapproved: 30,
      invalid: 8,
      amount: 1750000000,
      status: "Lodged",
    },
    {
      ref: "BATCH-IPO-20260427-003",
      register: "ZENITHBANK",
      date: "27 Apr 2026",
      approved: 645,
      disapproved: 22,
      invalid: 5,
      amount: 980000000,
      status: "Lodged",
    },
    {
      ref: "BATCH-IPO-20260425-004",
      register: "ZENITHBANK",
      date: "25 Apr 2026",
      approved: 1020,
      disapproved: 55,
      invalid: 12,
      amount: 2100000000,
      status: "Lodged",
    },
  ];

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
            <PendingApprovalIPO tab={activeTab} />
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            <IcuApprovalIPO tab={activeTab} />
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
            <TabsContent value="reports" className="space-y-4">
              {/* Type + filters bar */}
              <Card className="mrpsl-card p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {REPORT_TYPES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedReport(r);
                        setReportRun(false);
                      }}
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
                <div className="border-t pt-4">
                  <label className="mrpsl-label">Register</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Select
                      value={reportRegister}
                      onValueChange={(v) => {
                        setReportRegister(v ?? "");
                        setReportRun(false);
                      }}
                    >
                      <SelectTrigger className="mrpsl-input w-64">
                        <SelectValue placeholder="All Registers" />
                      </SelectTrigger>
                      <SelectContent className="w-max">
                        <SelectItem value="all">All Registers</SelectItem>
                        {ordinaryRegisters.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} · {r.symbol}
                          </SelectItem>
                        ))}
                        <SelectItem value="dangcem">DANGCEM</SelectItem>
                        <SelectItem value="zenith">ZENITHBANK</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="xl"
                      className="px-6 font-semibold shrink-0"
                      onClick={() => {
                        setReportRun(true);
                        toast.success(`${selectedReport} generated.`);
                      }}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" /> Run Report
                    </Button>
                    {reportRun && (
                      <Button
                        size="xl"
                        variant="outline"
                        className="px-5 shrink-0"
                        onClick={() => toast.info("Downloading report...")}
                      >
                        <Download className="mr-2 h-4 w-4" /> Export
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Report output */}
              {!reportRun ? (
                <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[280px]">
                  <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium text-foreground">
                    {selectedReport}
                  </p>
                  <p className="text-sm mt-1">
                    Select a register and click Run Report to generate the
                    output.
                  </p>
                </Card>
              ) : (
                <Card className="mrpsl-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                    <span className="font-semibold text-sm">
                      {selectedReport}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      Generated {format(new Date(), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>

                  {/* ── Application Offer ── */}
                  {selectedReport === "Application Offer" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
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
                            <th className="px-4 py-2.5">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_ALL_APPLICATIONS.map((r, i) => (
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
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.units > 0 ? r.units.toLocaleString() : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge
                                  className={cn(
                                    "border-0 text-[13px] font-normal",
                                    r.status === "Approved"
                                      ? "bg-green-100 text-green-800"
                                      : r.status === "Disapproved"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-700",
                                  )}
                                >
                                  {r.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS ({MOCK_ALL_APPLICATIONS.length}{" "}
                              applications)
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_APPROVED.reduce(
                                (s, r) => s + r.units,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              ₦
                              {[
                                ...MOCK_APPROVED,
                                ...MOCK_DISAPPROVED,
                                ...MOCK_INVALID,
                              ]
                                .reduce((s, r) => s + r.amount, 0)
                                .toLocaleString()}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* ── Application Offer Summary ── */}
                  {selectedReport === "Application Offer Summary" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">STOCKBROKER</th>
                            <th className="px-4 py-2.5 text-right">
                              APPLICATIONS
                            </th>
                            <th className="px-4 py-2.5 text-right">APPROVED</th>
                            <th className="px-4 py-2.5 text-right">
                              DISAPPROVED
                            </th>
                            <th className="px-4 py-2.5 text-right">INVALID</th>
                            <th className="px-4 py-2.5 text-right">
                              TOTAL UNITS
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              TOTAL AMOUNT (₦)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_BROKER_SUMMARY.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 font-medium">
                                {r.broker}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.applications.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-green-700 font-semibold">
                                {r.approved.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-amber-600 font-semibold">
                                {r.disapproved}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-red-600 font-semibold">
                                {r.invalid}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.units.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td className="px-4 py-2.5">TOTAL</td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_BROKER_SUMMARY.reduce(
                                (s, r) => s + r.applications,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-700">
                              {MOCK_BROKER_SUMMARY.reduce(
                                (s, r) => s + r.approved,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-amber-600">
                              {MOCK_BROKER_SUMMARY.reduce(
                                (s, r) => s + r.disapproved,
                                0,
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right text-red-600">
                              {MOCK_BROKER_SUMMARY.reduce(
                                (s, r) => s + r.invalid,
                                0,
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_BROKER_SUMMARY.reduce(
                                (s, r) => s + r.units,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              ₦
                              {MOCK_BROKER_SUMMARY.reduce(
                                (s, r) => s + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* ── Full Subscription List ── */}
                  {selectedReport === "Full Subscription List" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">NAME</th>
                            <th className="px-4 py-2.5">CHN</th>
                            <th className="px-4 py-2.5">STOCKBROKER</th>
                            <th className="px-4 py-2.5">CSCS ACCOUNT NO</th>
                            <th className="px-4 py-2.5 text-right">
                              UNITS SUBSCRIBED
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              UNITS ALLOTTED
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT (₦)
                            </th>
                            <th className="px-4 py-2.5">CERT NO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_ALLOTMENT.map((r, i) => (
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
                              <td className="px-4 py-2.5 font-mono">
                                {r.acct}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.subscribed.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">
                                {r.allotted.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-muted-foreground">
                                {r.cert}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS ({MOCK_ALLOTMENT.length} allottees)
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_ALLOTMENT.reduce(
                                (s, r) => s + r.subscribed,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-700">
                              {MOCK_ALLOTMENT.reduce(
                                (s, r) => s + r.allotted,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              ₦
                              {MOCK_ALLOTMENT.reduce(
                                (s, r) => s + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* ── State Summary ── */}
                  {selectedReport === "State Summary" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">STATE</th>
                            <th className="px-4 py-2.5 text-right">
                              SUBSCRIBERS
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              % OF TOTAL
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              TOTAL UNITS
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              TOTAL AMOUNT (₦)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_STATE_SUMMARY.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 font-medium">
                                {r.state}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.subscribers.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full"
                                      style={{ width: `${r.pct}%` }}
                                    />
                                  </div>
                                  <span className="font-mono tabular w-10 text-right">
                                    {r.pct}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.units.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td className="px-4 py-2.5">TOTAL</td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_STATE_SUMMARY.reduce(
                                (s, r) => s + r.subscribers,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">100%</td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_STATE_SUMMARY.reduce(
                                (s, r) => s + r.units,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              ₦
                              {MOCK_STATE_SUMMARY.reduce(
                                (s, r) => s + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* ── Range Analysis ── */}
                  {selectedReport === "Range Analysis" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">SUBSCRIPTION RANGE</th>
                            <th className="px-4 py-2.5 text-right">
                              SUBSCRIBERS
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              % OF TOTAL
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              TOTAL UNITS
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              TOTAL AMOUNT (₦)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_RANGE_ANALYSIS.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 font-medium">
                                {r.range}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.count.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full"
                                      style={{
                                        width: `${(r.pct / 35) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="font-mono tabular w-10 text-right">
                                    {r.pct}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.units.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {r.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td className="px-4 py-2.5">TOTAL</td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_RANGE_ANALYSIS.reduce(
                                (s, r) => s + r.count,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">100%</td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_RANGE_ANALYSIS.reduce(
                                (s, r) => s + r.units,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              ₦
                              {MOCK_RANGE_ANALYSIS.reduce(
                                (s, r) => s + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* ── Summary Batch Report ── */}
                  {selectedReport === "Summary Batch Report" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">BATCH REF</th>
                            <th className="px-4 py-2.5">REGISTER</th>
                            <th className="px-4 py-2.5">DATE PROCESSED</th>
                            <th className="px-4 py-2.5 text-right">APPROVED</th>
                            <th className="px-4 py-2.5 text-right">
                              DISAPPROVED
                            </th>
                            <th className="px-4 py-2.5 text-right">INVALID</th>
                            <th className="px-4 py-2.5 text-right">TOTAL</th>
                            <th className="px-4 py-2.5 text-right">
                              TOTAL AMOUNT (₦)
                            </th>
                            <th className="px-4 py-2.5">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_BATCH_SUMMARY.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 font-mono text-muted-foreground">
                                {r.ref}
                              </td>
                              <td className="px-4 py-2.5 font-semibold">
                                {r.register}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {r.date}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-green-700 font-semibold">
                                {r.approved.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-amber-600 font-semibold">
                                {r.disapproved}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-red-600 font-semibold">
                                {r.invalid}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {(
                                  r.approved +
                                  r.disapproved +
                                  r.invalid
                                ).toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                {(r.amount / 1000000).toFixed(0)}M
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge
                                  className={cn(
                                    "border-0 text-[13px] font-normal",
                                    r.status === "Lodged"
                                      ? "bg-green-100 text-green-800"
                                      : r.status === "ICU Approved"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-amber-100 text-amber-800",
                                  )}
                                >
                                  {r.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS ({MOCK_BATCH_SUMMARY.length} batches)
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-700">
                              {MOCK_BATCH_SUMMARY.reduce(
                                (s, r) => s + r.approved,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-amber-600">
                              {MOCK_BATCH_SUMMARY.reduce(
                                (s, r) => s + r.disapproved,
                                0,
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right text-red-600">
                              {MOCK_BATCH_SUMMARY.reduce(
                                (s, r) => s + r.invalid,
                                0,
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {MOCK_BATCH_SUMMARY.reduce(
                                (s, r) =>
                                  s + r.approved + r.disapproved + r.invalid,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {(
                                MOCK_BATCH_SUMMARY.reduce(
                                  (s, r) => s + r.amount,
                                  0,
                                ) / 1000000000
                              ).toFixed(1)}
                              B
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
