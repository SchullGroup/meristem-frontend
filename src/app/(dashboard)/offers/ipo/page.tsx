"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  FileCheck2,
  FileX2,
  AlertCircle,
  Upload,
  Download,
  CheckCircle,
  BarChart3,
  CalendarIcon,
  X,
  FileUp,
  CalendarRange,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

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
  { state: "Kano", subscribers: 98, units: 490000, amount: 24500000, pct: 7.9 },
  { state: "Oyo", subscribers: 87, units: 435000, amount: 21750000, pct: 7.0 },
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

const MOCK_LODGMENT_QUEUE = [
  {
    id: "sub-1",
    ref: "BATCH-IPO-20260429-001",
    register: "DANGCEM",
    date: "29 Apr 2026",
    approved: 1180,
    amount: "₦2.50B",
    icuApprover: "Ngozi Adeyemi",
    icuDate: "30 Apr 2026, 09:12",
    symbol: "DANGCEM",
  },
  {
    id: "sub-2",
    ref: "BATCH-IPO-20260428-002",
    register: "DANGCEM",
    date: "28 Apr 2026",
    approved: 890,
    amount: "₦1.75B",
    icuApprover: "Ngozi Adeyemi",
    icuDate: "29 Apr 2026, 11:30",
    symbol: "DANGCEM",
  },
  {
    id: "sub-3",
    ref: "BATCH-IPO-20260427-003",
    register: "ZENITHBANK",
    date: "27 Apr 2026",
    approved: 645,
    amount: "₦980M",
    icuApprover: "Ngozi Adeyemi",
    icuDate: "28 Apr 2026, 16:22",
    symbol: "ZENITHBANK",
  },
];

const MOCK_ICU_SUBMISSIONS = [
  {
    id: "sub-1",
    ref: "BATCH-IPO-20260429-001",
    register: "DANGCEM",
    date: "29 Apr 2026",
    approved: 1180,
    disapproved: 45,
    invalid: 15,
    amount: "₦2.50B",
    opsApprover: "Adaeze Okafor",
    opsDate: "29 Apr 2026, 14:32",
  },
  {
    id: "sub-2",
    ref: "BATCH-IPO-20260428-002",
    register: "DANGCEM",
    date: "28 Apr 2026",
    approved: 890,
    disapproved: 30,
    invalid: 8,
    amount: "₦1.75B",
    opsApprover: "Babatunde Adeleke",
    opsDate: "28 Apr 2026, 11:15",
  },
  {
    id: "sub-3",
    ref: "BATCH-IPO-20260427-003",
    register: "ZENITHBANK",
    date: "27 Apr 2026",
    approved: 645,
    disapproved: 22,
    invalid: 5,
    amount: "₦980M",
    opsApprover: "Adaeze Okafor",
    opsDate: "27 Apr 2026, 16:48",
  },
];

export default function IPOPage() {
  const { registers, currentUser } = useStore();
  const ordinaryRegisters = registers.filter(
    (r) => r.registerType === "ORDINARY" && r.status === "ACTIVE",
  );

  const [activeTab, setActiveTab] = useState("upload");
  const [selectedRegister, setSelectedRegister] = useState("");
  const [batchDate, setBatchDate] = useState<Date>(new Date());
  const batchRef = `BATCH-IPO-${format(batchDate, "yyyyMMdd")}-001`;

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "processing" | "complete"
  >("idle");
  const [progress, setProgress] = useState(0);

  const [reviewingBatch, setReviewingBatch] = useState<string | null>(null);
  const [icuReviewingBatch, setIcuReviewingBatch] = useState<string | null>(
    null,
  );
  const [icuTab, setIcuTab] = useState<"approved" | "disapproved" | "invalid">(
    "approved",
  );
  const [icuComment, setIcuComment] = useState("");

  // Multi-submission ICU state
  const [icuSubmissionStatuses, setIcuSubmissionStatuses] = useState<
    Record<string, "pending" | "approved" | "returned">
  >({ "sub-1": "pending", "sub-2": "pending", "sub-3": "pending" });
  const [icuSubTab, setIcuSubTab] = useState<
    "approved" | "disapproved" | "invalid"
  >("approved");

  // Lodgment drill-down
  const [lodgmentReviewing, setLodgmentReviewing] = useState<string | null>(
    null,
  );
  const [lodgmentProcessed, setLodgmentProcessed] = useState<
    Record<string, boolean>
  >({});
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("");
  const [reportRun, setReportRun] = useState(false);

  const [approvedFile, setApprovedFile] = useState<string | null>(null);
  const [disapprovedFile, setDisapprovedFile] = useState<string | null>(null);
  const [invalidFile, setInvalidFile] = useState<string | null>(null);

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

  // Rejection flow
  const [rejectedBatch, setRejectedBatch] = useState<{
    ref: string;
    comment: string;
  } | null>(null);
  const [pendingBatchDismissed, setPendingBatchDismissed] = useState(false);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    action: "approve" | "reject";
    section: "ops" | "icu";
  } | null>(null);
  const [modalComment, setModalComment] = useState("");

  const handleProcess = () => {
    if (!selectedRegister) {
      toast.error("Please select a register first");
      return;
    }
    setUploadStatus("processing");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploadStatus("complete");
          toast.success("Batch processed successfully");
          return 100;
        }
        return p + 20;
      });
    }, 300);
  };

  const closeModal = () => {
    setApprovalModal(null);
    setModalComment("");
  };

  const handleApprove = () => {
    toast.success("Batch approved and forwarded to ICU.");
    setReviewingBatch(null);
    setReviewComment("");
    closeModal();
  };

  const handleReject = () => {
    setRejectedBatch({ ref: reviewingBatch!, comment: modalComment });
    setPendingBatchDismissed(true);
    toast.error("Batch rejected.");
    setReviewingBatch(null);
    setReviewComment("");
    closeModal();
  };

  const handleIcuApprove = () => {
    if (icuReviewingBatch)
      setIcuSubmissionStatuses((prev) => ({
        ...prev,
        [icuReviewingBatch]: "approved",
      }));
    toast.success("ICU approved. Submission cleared for lodgment.");
    setIcuReviewingBatch(null);
    setIcuComment("");
    closeModal();
  };

  const handleIcuReturn = () => {
    if (icuReviewingBatch)
      setIcuSubmissionStatuses((prev) => ({
        ...prev,
        [icuReviewingBatch]: "returned",
      }));
    toast.error("Submission returned to Operations.");
    setIcuReviewingBatch(null);
    setIcuComment("");
    closeModal();
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
            {rejectedBatch && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                      Batch Rejected — Ref: {rejectedBatch.ref}
                    </p>
                    <p className="text-[13px] text-red-700 mt-0.5">
                      Authorizer comment:{" "}
                      {rejectedBatch.comment || "No comment provided."}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      Please review the batch data and resubmit for approval.
                    </p>
                  </div>
                  <button
                    onClick={() => setRejectedBatch(null)}
                    className="rounded-full hover:bg-red-100 p-0.5"
                  >
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </button>
                </div>
              </Card>
            )}
            {/* Batch controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="mrpsl-label">Register *</label>
                <Select
                  value={selectedRegister}
                  onValueChange={(v) => setSelectedRegister(v || "")}
                >
                  <SelectTrigger className="mrpsl-input">
                    <SelectValue placeholder="Select Ordinary Register" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordinaryRegisters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="mrpsl-label">Batch Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mrpsl-input justify-start text-left font-normal"
                    >
                      {format(batchDate, "PPP")}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={batchDate}
                      onSelect={(d) => d && setBatchDate(d)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="mrpsl-label">Batch Reference</label>
                <Input
                  disabled
                  value={batchRef}
                  className="mrpsl-input bg-muted/50 tabular text-sm"
                />
              </div>
            </div>

            {uploadStatus === "complete" ? (
              <Card className="mrpsl-card bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-green-800 mb-5">
                    <CheckCircle className="h-6 w-6 shrink-0" />
                    <h3 className="font-semibold text-lg">
                      Batch {batchRef} processed successfully
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Total Processed",
                        value: "1,240",
                        color: "text-foreground",
                      },
                      {
                        label: "Approved",
                        value: "1,180",
                        color: "text-green-700",
                      },
                      {
                        label: "Disapproved",
                        value: "45",
                        color: "text-amber-600",
                      },
                      { label: "Invalid", value: "15", color: "text-red-600" },
                    ].map((stat) => (
                      <Card
                        key={stat.label}
                        className="bg-white/60 border-green-200 p-4"
                      >
                        <div className="mrpsl-section-title text-green-700/70">
                          {stat.label}
                        </div>
                        <div
                          className={cn(
                            "text-xl tabular mt-1 font-bold",
                            stat.color,
                          )}
                        >
                          {stat.value}
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Button
                      onClick={() => {
                        setUploadStatus("idle");
                        setSelectedRegister("");
                      }}
                    >
                      Process New Batch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Approved List */}
                  <Card
                    className={cn(
                      "mrpsl-card p-6 border-t-4 border-t-green-500",
                    )}
                  >
                    <div className="flex justify-center mb-3">
                      <FileCheck2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground text-center">
                      Approved List
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-1 text-center">
                      Upload .csv file of approved subscribers
                    </p>
                    <div className="mt-4">
                      {approvedFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                          <FileCheck2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-[13px] font-medium text-green-800 flex-1 truncate">
                            {approvedFile}
                          </span>
                          <button
                            onClick={() => setApprovedFile(null)}
                            className="rounded-full hover:bg-green-100 p-0.5 transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-green-700" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors">
                          Drop CSV here or click to browse
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) =>
                              setApprovedFile(e.target.files?.[0]?.name ?? null)
                            }
                          />
                        </label>
                      )}
                    </div>
                  </Card>

                  {/* Disapproved List */}
                  <Card
                    className={cn(
                      "mrpsl-card p-6 border-t-4 border-t-amber-500",
                    )}
                  >
                    <div className="flex justify-center mb-3">
                      <FileX2 className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-foreground text-center">
                      Disapproved List
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-1 text-center">
                      Upload .csv of rejected applications (Return Money)
                    </p>
                    <div className="mt-4 space-y-3">
                      {disapprovedFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <FileX2 className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-[13px] font-medium text-amber-800 flex-1 truncate">
                            {disapprovedFile}
                          </span>
                          <button
                            onClick={() => setDisapprovedFile(null)}
                            className="rounded-full hover:bg-amber-100 p-0.5 transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-amber-700" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors">
                          Drop CSV here or click to browse
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) =>
                              setDisapprovedFile(
                                e.target.files?.[0]?.name ?? null,
                              )
                            }
                          />
                        </label>
                      )}
                    </div>
                  </Card>

                  {/* Invalid Subscription */}
                  <Card
                    className={cn("mrpsl-card p-6 border-t-4 border-t-red-500")}
                  >
                    <div className="flex justify-center mb-3">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="font-semibold text-foreground text-center">
                      Invalid Subscription
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-1 text-center">
                      Upload .csv of invalid/failed applications
                    </p>
                    <div className="mt-4 space-y-3">
                      {invalidFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-[13px] font-medium text-red-800 flex-1 truncate">
                            {invalidFile}
                          </span>
                          <button
                            onClick={() => setInvalidFile(null)}
                            className="rounded-full hover:bg-red-100 p-0.5 transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-red-700" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1.5 h-20 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-colors">
                          Drop CSV here or click to browse
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) =>
                              setInvalidFile(e.target.files?.[0]?.name ?? null)
                            }
                          />
                        </label>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="space-y-3">
                  {uploadStatus === "processing" && (
                    <Progress value={progress} className="h-2" />
                  )}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleProcess}
                    disabled={uploadStatus === "processing"}
                  >
                    {uploadStatus === "processing"
                      ? "Processing Batch..."
                      : "Process Batch"}
                  </Button>
                </div>
              </>
            )}
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
                      {!pendingBatchDismissed ? (
                        <tr className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                            BATCH-IPO-20260429-001
                          </td>
                          <td className="px-4 py-3 font-semibold">DANGCEM</td>
                          <td className="px-4 py-3 text-muted-foreground text-[13px]">
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
                            <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                              Pending
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReviewTab("approved");
                                setReviewingBatch("BATCH-IPO-20260429-001");
                              }}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                          >
                            No pending approvals
                          </td>
                        </tr>
                      )}
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
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                    Pending
                  </Badge>
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
                        <div className="text-[13px] text-muted-foreground mt-0.5">
                          click to view
                        </div>
                      )}
                    </Card>
                  ))}
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
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
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
                      <table className="w-full text-left text-[13px]">
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
                                <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px] font-normal">
                                  {r.reason}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
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
                      <table className="w-full text-left text-[13px]">
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
                                <Badge className="bg-red-100 text-red-800 border-0 text-[13px] font-normal">
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

                {/* Approve / Reject */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={() =>
                      setApprovalModal({ action: "reject", section: "ops" })
                    }
                  >
                    Reject Batch
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={() =>
                      setApprovalModal({ action: "approve", section: "ops" })
                    }
                  >
                    Approve &amp; Forward to ICU
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu" className="space-y-4">
            {icuReviewingBatch === null ? (
              /* ── Queue view ── */
              <Card className="mrpsl-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">BATCH REF</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">DATE</th>
                      <th className="px-4 py-3 text-right">APPROVED</th>
                      <th className="px-4 py-3 text-right">DISAPPROVED</th>
                      <th className="px-4 py-3 text-right">INVALID</th>
                      <th className="px-4 py-3 text-right">AMOUNT</th>
                      <th className="px-4 py-3">OPS APPROVER</th>
                      <th className="px-4 py-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {MOCK_ICU_SUBMISSIONS.map((sub) => (
                      <tr
                        key={sub.id}
                        className="mrpsl-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => {
                          setIcuReviewingBatch(sub.id);
                          setIcuSubTab("approved");
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                          {sub.ref}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {sub.register}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[13px]">
                          {sub.date}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                          {sub.approved.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-amber-600 font-semibold">
                          {sub.disapproved}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-red-600 font-semibold">
                          {sub.invalid}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          {sub.amount}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          {sub.opsApprover}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={cn(
                              "border-0 text-[13px] font-medium",
                              icuSubmissionStatuses[sub.id] === "approved"
                                ? "bg-green-100 text-green-800"
                                : icuSubmissionStatuses[sub.id] === "returned"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-800",
                            )}
                          >
                            {icuSubmissionStatuses[sub.id] === "approved"
                              ? "Approved"
                              : icuSubmissionStatuses[sub.id] === "returned"
                                ? "Returned"
                                : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              (() => {
                const sub = MOCK_ICU_SUBMISSIONS.find(
                  (s) => s.id === icuReviewingBatch,
                )!;
                return (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Back button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIcuReviewingBatch(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to ICU Queue
                    </Button>

                    {/* Ops approval record */}
                    <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
                      <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Operations Approval Record
                      </p>
                      <div className="flex items-center gap-8 text-sm flex-wrap">
                        <div>
                          <div className="mrpsl-section-title">Approved By</div>
                          <div className="font-semibold mt-0.5">
                            {sub.opsApprover}
                          </div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">Role</div>
                          <div className="mt-0.5">Operations Manager</div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">
                            Approval Date &amp; Time
                          </div>
                          <div className="font-mono mt-0.5">{sub.opsDate}</div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">Batch Date</div>
                          <div className="font-mono mt-0.5">{sub.date}</div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">
                            Total Amount
                          </div>
                          <div className="font-mono font-semibold mt-0.5">
                            {sub.amount}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        {
                          label: "Total Subscribers",
                          value: (
                            sub.approved +
                            sub.disapproved +
                            sub.invalid
                          ).toLocaleString(),
                          color: "text-foreground",
                          tab: null as null,
                        },
                        {
                          label: "Approved",
                          value: sub.approved.toLocaleString(),
                          color: "text-green-700",
                          tab: "approved" as const,
                        },
                        {
                          label: "Disapproved",
                          value: sub.disapproved.toString(),
                          color: "text-amber-600",
                          tab: "disapproved" as const,
                        },
                        {
                          label: "Invalid",
                          value: sub.invalid.toString(),
                          color: "text-red-600",
                          tab: "invalid" as const,
                        },
                      ].map((s) => (
                        <Card
                          key={s.label}
                          className={cn(
                            "mrpsl-card p-3",
                            s.tab &&
                              "cursor-pointer hover:border-primary/40 transition-colors",
                          )}
                          onClick={() => s.tab && setIcuSubTab(s.tab)}
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
                            <div className="text-[13px] text-muted-foreground mt-0.5">
                              click to view
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>

                    {/* Data sub-tabs */}
                    <Card className="mrpsl-card overflow-hidden">
                      <div className="flex items-center gap-1 border-b px-4 bg-muted/10">
                        {(["approved", "disapproved", "invalid"] as const).map(
                          (t) => (
                            <button
                              key={t}
                              onClick={() => setIcuSubTab(t)}
                              className={cn(
                                "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                                icuSubTab === t
                                  ? t === "approved"
                                    ? "border-green-600 text-green-700"
                                    : t === "disapproved"
                                      ? "border-amber-500 text-amber-700"
                                      : "border-red-500 text-red-700"
                                  : "border-transparent text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {t === "approved"
                                ? `Approved (${sub.approved.toLocaleString()})`
                                : t === "disapproved"
                                  ? `Disapproved (${sub.disapproved})`
                                  : `Invalid (${sub.invalid})`}
                            </button>
                          ),
                        )}
                        <div className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          className="my-1.5 mr-1"
                          onClick={() => toast.success("Exporting list...")}
                        >
                          <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        {icuSubTab === "approved" && (
                          <table className="w-full text-left text-[13px]">
                            <thead className="mrpsl-table-header">
                              <tr>
                                <th className="px-4 py-2.5">#</th>
                                <th className="px-4 py-2.5">NAME</th>
                                <th className="px-4 py-2.5">CHN</th>
                                <th className="px-4 py-2.5">BROKER</th>
                                <th className="px-4 py-2.5">BANK</th>
                                <th className="px-4 py-2.5">ACCOUNT NO</th>
                                <th className="px-4 py-2.5 text-right">
                                  UNITS
                                </th>
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
                                  <td className="px-4 py-2.5 font-mono">
                                    {r.chn}
                                  </td>
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
                            <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                              <tr>
                                <td
                                  colSpan={6}
                                  className="px-4 py-2.5 text-right text-muted-foreground"
                                >
                                  TOTALS (showing {MOCK_APPROVED.length} of{" "}
                                  {sub.approved.toLocaleString()})
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
                        {icuSubTab === "disapproved" && (
                          <table className="w-full text-left text-[13px]">
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
                                    <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px] font-normal">
                                      {r.reason}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {icuSubTab === "invalid" && (
                          <table className="w-full text-left text-[13px]">
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
                                    <Badge className="bg-red-100 text-red-800 border-0 text-[13px] font-normal">
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

                    {/* Actions */}
                    {icuSubmissionStatuses[icuReviewingBatch] === "pending" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="destructive"
                          size="lg"
                          className="h-12 text-base font-semibold"
                          onClick={() =>
                            setApprovalModal({
                              action: "reject",
                              section: "icu",
                            })
                          }
                        >
                          Return to Ops
                        </Button>
                        <Button
                          size="lg"
                          className="h-12 text-base font-semibold"
                          onClick={() =>
                            setApprovalModal({
                              action: "approve",
                              section: "icu",
                            })
                          }
                        >
                          ICU Approve &amp; Clear for Lodgment
                        </Button>
                      </div>
                    ) : (
                      <Card
                        className={cn(
                          "mrpsl-card p-4 flex items-center gap-3",
                          icuSubmissionStatuses[icuReviewingBatch] ===
                            "approved"
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50/60 border-red-200",
                        )}
                      >
                        {icuSubmissionStatuses[icuReviewingBatch] ===
                        "approved" ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                            <p className="text-sm font-semibold text-green-800">
                              This submission has been ICU approved and cleared
                              for lodgment.
                            </p>
                          </>
                        ) : (
                          <>
                            <FileX2 className="h-5 w-5 text-red-600 shrink-0" />
                            <p className="text-sm font-semibold text-red-800">
                              This submission was returned to Operations for
                              review.
                            </p>
                          </>
                        )}
                      </Card>
                    )}
                  </div>
                );
              })()
            )}
          </TabsContent>

          {/* ── Lodgment ── */}
          <TabsContent value="lodgment" className="space-y-4">
            {lodgmentReviewing === null ? (
              /* Queue table */
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/20">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                    ICU Approved — Ready for Lodgment
                  </p>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">BATCH REF</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">BATCH DATE</th>
                      <th className="px-4 py-3 text-right">
                        APPROVED ALLOTTEES
                      </th>
                      <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                      <th className="px-4 py-3">ICU APPROVER</th>
                      <th className="px-4 py-3">ICU APPROVAL DATE</th>
                      <th className="px-4 py-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {MOCK_LODGMENT_QUEUE.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setLodgmentReviewing(row.id)}
                        className="mrpsl-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                          {row.ref}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {row.register}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[13px]">
                          {row.date}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                          {row.approved.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {row.amount}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          {row.icuApprover}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground">
                          {row.icuDate}
                        </td>
                        <td className="px-4 py-3">
                          {lodgmentProcessed[row.id] ? (
                            <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                              Lodged
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                              Pending Lodgment
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              (() => {
                const row = MOCK_LODGMENT_QUEUE.find(
                  (r) => r.id === lodgmentReviewing,
                )!;
                return (
                  <div className="space-y-4">
                    {/* Back + breadcrumb */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 -ml-2"
                        onClick={() => setLodgmentReviewing(null)}
                      >
                        <ArrowLeft className="h-4 w-4" /> Back to Lodgment Queue
                      </Button>
                      <div className="h-5 w-px bg-border mx-1" />
                      <span className="font-mono text-sm font-semibold">
                        {row.ref}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        · {row.register} · {row.date}
                      </span>
                      {lodgmentProcessed[row.id] ? (
                        <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                          Lodged
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                          Pending Lodgment
                        </Badge>
                      )}
                    </div>

                    {/* ICU approval record */}
                    <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
                      <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        ICU Approval Record
                      </p>
                      <div className="flex items-center gap-8 text-sm flex-wrap">
                        <div>
                          <div className="mrpsl-section-title">
                            ICU Approver
                          </div>
                          <div className="font-semibold mt-0.5">
                            {row.icuApprover}
                          </div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">
                            Approval Date &amp; Time
                          </div>
                          <div className="font-mono mt-0.5">{row.icuDate}</div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">
                            Approved Allottees
                          </div>
                          <div className="font-mono font-semibold mt-0.5 text-green-700">
                            {row.approved.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="mrpsl-section-title">
                            Total Amount
                          </div>
                          <div className="font-mono font-semibold mt-0.5">
                            {row.amount}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="mrpsl-card">
                      <div className="p-5 space-y-6">
                        <div className="space-y-3">
                          <label className="mrpsl-label">
                            Lodgment File Format
                          </label>
                          <RadioGroup
                            defaultValue="with_rin"
                            className="flex gap-6"
                          >
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
                          <div className="bg-muted/40 p-2 border-b text-[13px] tabular font-bold text-muted-foreground">
                            PREVIEW (5 ROWS)
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-[13px] tabular">
                              <thead className="bg-muted/20">
                                <tr>
                                  <th className="p-2 text-left">
                                    STOCKBROKER CODE
                                  </th>
                                  <th className="p-2 text-left">CHN</th>
                                  <th className="p-2 text-left">
                                    SHAREHOLDER NAME
                                  </th>
                                  <th className="p-2 text-left">CERT NO</th>
                                  <th className="p-2 text-left">
                                    CSCS ACCOUNT NO
                                  </th>
                                  <th className="p-2 text-left">SYMBOL</th>
                                  <th className="p-2 text-right">UNITS</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {[
                                  [
                                    "C001",
                                    "C00001001EL",
                                    "ADEBISI FUNMILAYO",
                                    `${row.symbol}/001/2026`,
                                    "0200012345",
                                    row.symbol,
                                    "50,000",
                                  ],
                                  [
                                    "C045",
                                    "C00004509EL",
                                    "OKAFOR CHUKWUEMEKA",
                                    `${row.symbol}/002/2026`,
                                    "0200054321",
                                    row.symbol,
                                    "10,000",
                                  ],
                                  [
                                    "C017",
                                    "C00009821EL",
                                    "IBRAHIM FATIMA",
                                    `${row.symbol}/003/2026`,
                                    "0200098765",
                                    row.symbol,
                                    "25,000",
                                  ],
                                  [
                                    "C008",
                                    "C00002200EL",
                                    "OLAWALE DAVID",
                                    `${row.symbol}/004/2026`,
                                    "0200034560",
                                    row.symbol,
                                    "100,000",
                                  ],
                                  [
                                    "C031",
                                    "C00007811EL",
                                    "NWOSU CHIDINMA",
                                    `${row.symbol}/005/2026`,
                                    "0200078112",
                                    row.symbol,
                                    "5,000",
                                  ],
                                ].map((cols, i) => (
                                  <tr key={i} className="hover:bg-muted/20">
                                    {cols.map((c, j) => (
                                      <td
                                        key={j}
                                        className={cn(
                                          "p-2 font-mono",
                                          j === 6 && "text-right",
                                        )}
                                      >
                                        {c}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {lodgmentProcessed[row.id] ? (
                          <Card className="p-4 bg-green-50 border-green-200 flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                            <p className="text-sm font-semibold text-green-800">
                              Batch lodged successfully via CSCS API.
                            </p>
                          </Card>
                        ) : (
                          <div className="flex flex-wrap gap-4">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() =>
                                toast.info("Downloading lodgment file...")
                              }
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                              Lodgment File (.txt)
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={() => {
                                setLodgmentProcessed((prev) => ({
                                  ...prev,
                                  [row.id]: true,
                                }));
                                toast.success(
                                  "Pushed to CSCS API successfully.",
                                );
                              }}
                            >
                              <Upload className="mr-2 h-4 w-4" /> Push via CSCS
                              API
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })()
            )}
          </TabsContent>

          {/* ── Reports ── */}
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
                  Select a register and click Run Report to generate the output.
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
                          <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
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
                            <td className="px-4 py-2.5 font-mono">{r.acct}</td>
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
                            TOTALS ({MOCK_ALL_APPLICATIONS.length} applications)
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
                          <th className="px-4 py-2.5 text-right">AMOUNT (₦)</th>
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
                            <td className="px-4 py-2.5 font-mono">{r.acct}</td>
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
                          <th className="px-4 py-2.5 text-right">% OF TOTAL</th>
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
                          <th className="px-4 py-2.5 text-right">% OF TOTAL</th>
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
                                    style={{ width: `${(r.pct / 35) * 100}%` }}
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
        </div>
      </Tabs>

      {/* Approval / Rejection modal */}
      <Dialog
        open={approvalModal !== null}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalModal?.section === "ops"
                ? approvalModal.action === "approve"
                  ? "Approve Batch"
                  : "Reject Batch"
                : approvalModal?.action === "approve"
                  ? "ICU Approve Batch"
                  : "Return Batch to Operations"}
            </DialogTitle>
            <DialogDescription>
              {approvalModal?.action === "approve"
                ? "Add an optional comment before forwarding."
                : "Please provide a reason — this will be visible to the submitter."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="mrpsl-label">
                {approvalModal?.action === "approve"
                  ? "Comment (optional)"
                  : "Reason for rejection *"}
              </label>
              <Textarea
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                placeholder={
                  approvalModal?.action === "approve"
                    ? "Add a note…"
                    : "Explain the reason…"
                }
                rows={3}
                className="resize-none text-sm focus-visible:ring-primary rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant={
                  approvalModal?.action === "reject" ? "destructive" : "default"
                }
                className="flex-1"
                onClick={() => {
                  if (approvalModal?.section === "ops") {
                    approvalModal.action === "approve"
                      ? handleApprove()
                      : handleReject();
                  } else {
                    approvalModal?.action === "approve"
                      ? handleIcuApprove()
                      : handleIcuReturn();
                  }
                }}
              >
                Confirm{" "}
                {approvalModal?.action === "approve" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
