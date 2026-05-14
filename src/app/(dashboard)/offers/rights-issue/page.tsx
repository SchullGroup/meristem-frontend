"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  FileSpreadsheet,
  Mail,
  CloudUpload,
  ArrowLeft,
  CalendarRange,
  X,
  Download,
  Printer,
  FileCheck2,
  FileX2,
  AlertCircle,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import {
  StickyLabelModal,
  EmailPreviewModal,
} from "@/components/custom/shareholder-outreach-modals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import type { Shareholder } from "@/lib/types";

/* ─── module-level constants & helpers ─── */

const MOCK_CHNS = [
  "C00001001EL",
  "C00004509EL",
  "C00009821EL",
  "C00002200EL",
  "C00007811EL",
  "C00003312EL",
  "C00005678EL",
  "C00008899EL",
  "C00006123EL",
  "C00001745EL",
];
const MOCK_BROKERS = [
  "MST",
  "ZEN",
  "CSC",
  "ARM",
  "FCM",
  "VET",
  "AFI",
  "STN",
  "GTI",
  "UBA",
];
const MOCK_BANKS = [
  "Zenith Bank",
  "GTBank",
  "Access Bank",
  "UBA",
  "First Bank",
  "Fidelity Bank",
  "Sterling Bank",
  "Polaris Bank",
  "Wema Bank",
  "Stanbic IBTC",
];
const MOCK_ACCTS = [
  "0012345678",
  "2023456781",
  "0987654321",
  "3012345600",
  "5009871234",
  "3098765432",
  "0071234567",
  "4056789012",
  "0034561289",
  "2019876543",
];
const MOCK_ADDRS = [
  "14 Broad St, Lagos",
  "22 Adeola Odeku, VI",
  "5 Allen Ave, Ikeja",
  "11 Ring Road, Ibadan",
  "3 Ahmadu Bello Way, Abuja",
  "9 Yakubu Gowon Cres, PHC",
  "7 Zaria Rd, Kano",
  "18 Marina St, Lagos",
  "2 Okonkwo Cl, Enugu",
  "33 Nnamdi Azikiwe, Onitsha",
];

const MOCK_ALLOT_APPROVED = [
  {
    name: "ADEBISI FUNMILAYO",
    chn: "C00001001EL",
    broker: "MST",
    unitsHeld: 50000,
    rightsDue: 25000,
    certShares: 25000,
  },
  {
    name: "OKAFOR CHUKWUEMEKA",
    chn: "C00004509EL",
    broker: "ZEN",
    unitsHeld: 10000,
    rightsDue: 5000,
    certShares: 5000,
  },
  {
    name: "IBRAHIM FATIMA",
    chn: "C00009821EL",
    broker: "CSC",
    unitsHeld: 25000,
    rightsDue: 12500,
    certShares: 12500,
  },
  {
    name: "OLAWALE DAVID",
    chn: "C00002200EL",
    broker: "ARM",
    unitsHeld: 100000,
    rightsDue: 50000,
    certShares: 50000,
  },
  {
    name: "NWOSU CHIDINMA",
    chn: "C00007811EL",
    broker: "FCM",
    unitsHeld: 5000,
    rightsDue: 2500,
    certShares: 2500,
  },
  {
    name: "ALIYU SADIQ",
    chn: "C00003312EL",
    broker: "MST",
    unitsHeld: 20000,
    rightsDue: 10000,
    certShares: 10000,
  },
  {
    name: "ADELEKE GRACE",
    chn: "C00005678EL",
    broker: "VET",
    unitsHeld: 15000,
    rightsDue: 7500,
    certShares: 7500,
  },
  {
    name: "JAMES PATIENCE",
    chn: "C00008899EL",
    broker: "AFI",
    unitsHeld: 30000,
    rightsDue: 15000,
    certShares: 15000,
  },
];

const MOCK_ALLOT_DISAPPROVED = [
  {
    name: "OKORO BLESSING",
    chn: "C00012345EL",
    bank: "GTBank",
    acct: "0045678901",
    amount: 250000,
    reason: "Account name mismatch",
  },
  {
    name: "HASSAN MUHAMMED",
    chn: "C00067890EL",
    bank: "Zenith Bank",
    acct: "2011223344",
    amount: 100000,
    reason: "Duplicate application",
  },
  {
    name: "AFOLABI TAIWO",
    chn: "C00034512EL",
    bank: "Access Bank",
    acct: "0067890123",
    amount: 500000,
    reason: "Incomplete KYC documentation",
  },
];

const MOCK_ALLOT_INVALID = [
  {
    name: "UCHENNA EMEKA",
    chn: "C00098765EL",
    amount: 50000,
    reason: "Subscription below minimum threshold",
  },
  {
    name: "BADMUS LATEEF",
    chn: "C00076543EL",
    amount: 200000,
    reason: "Invalid CHN — not found in CSCS database",
  },
];

const RIGHTS_REPORT_TYPES = [
  "Rights Entitlement List",
  "Acceptance Summary",
  "Non-Acceptance List",
  "Traded Rights Report",
  "Allotment Report",
  "State Analysis",
  "Range Analysis",
];

type TradedEntry = {
  id: string;
  regacno: string;
  chn: string;
  name: string;
  volume: number;
  mcode: string;
};

function getVisiblePages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function PaginationBar({
  page,
  total,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: {
  page: number;
  total: number;
  onPageChange: (p: number) => void;
  pageSize: number;
  onPageSizeChange?: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visible = getVisiblePages(page, totalPages);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 text-[13px]">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">
          Showing {start}–{end} of {total.toLocaleString()}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-6 w-16 text-[13px] px-2 py-0 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-[13px]">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">rows</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[13px]"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {visible.map((p, idx) =>
          p === "…" ? (
            <span
              key={`e${idx}`}
              className="px-1.5 text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={page === p ? "default" : "outline"}
              size="sm"
              className="h-7 w-7 p-0 text-[13px]"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[13px]"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/* ─── shared shareholder table body ─── */
function ShholderRows({
  rows,
  pageStart,
}: {
  rows: ReturnType<typeof Array.prototype.slice>;
  pageStart: number;
}) {
  return (
    <>
      {rows.map((s: any, i: number) => {
        const gi = pageStart + i;
        const rights = Math.floor(s.holdings / 2);
        return (
          <tr key={s.id} className="mrpsl-table-row">
            <td className="px-3 py-2.5 text-muted-foreground">{gi + 1}</td>
            <td className="px-3 py-2.5 font-medium">
              {s.firstName} {s.lastName}
            </td>
            <td className="px-3 py-2.5 font-mono text-[13px]">
              {MOCK_CHNS[gi % MOCK_CHNS.length]}
            </td>
            <td className="px-3 py-2.5 font-mono">
              {MOCK_BROKERS[gi % MOCK_BROKERS.length]}
            </td>
            <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[160px]">
              {MOCK_ADDRS[gi % MOCK_ADDRS.length]}
            </td>
            <td className="px-3 py-2.5">
              {MOCK_BANKS[gi % MOCK_BANKS.length]}
            </td>
            <td className="px-3 py-2.5 font-mono">
              {MOCK_ACCTS[gi % MOCK_ACCTS.length]}
            </td>
            <td className="px-3 py-2.5 text-right font-mono">
              {s.holdings.toLocaleString()}
            </td>
            <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">
              1:2
            </td>
            <td className="px-3 py-2.5 text-right font-mono font-semibold text-blue-600">
              {rights.toLocaleString()}
            </td>
            <td className="px-3 py-2.5 text-right font-mono font-bold">
              ₦{(rights * 50).toLocaleString()}
            </td>
          </tr>
        );
      })}
    </>
  );
}

function ShholderTableHead() {
  return (
    <thead className="mrpsl-table-header">
      <tr>
        <th className="px-3 py-2.5">#</th>
        <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
        <th className="px-3 py-2.5">CHN</th>
        <th className="px-3 py-2.5">STOCKBROKER CODE</th>
        <th className="px-3 py-2.5">ADDRESS</th>
        <th className="px-3 py-2.5">BANK NAME</th>
        <th className="px-3 py-2.5">BANK ACCOUNT NO</th>
        <th className="px-3 py-2.5 text-right">UNITS HELD</th>
        <th className="px-3 py-2.5 text-center">RIGHTS RATIO</th>
        <th className="px-3 py-2.5 text-right">RIGHTS DUE</th>
        <th className="px-3 py-2.5 text-right">AMOUNT DUE (₦)</th>
      </tr>
    </thead>
  );
}

function ShholderTfoot({ rows, total }: { rows: any[]; total: number }) {
  return (
    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
      <tr>
        <td
          colSpan={9}
          className="px-3 py-2.5 text-right text-muted-foreground"
        >
          PAGE TOTALS ({total.toLocaleString()} total shareholders)
        </td>
        <td className="px-3 py-2.5 text-right text-blue-600">
          {rows
            .reduce((a: number, r: any) => a + Math.floor(r.holdings / 2), 0)
            .toLocaleString()}
        </td>
        <td className="px-3 py-2.5 text-right">
          ₦
          {rows
            .reduce(
              (a: number, r: any) => a + Math.floor(r.holdings / 2) * 50,
              0,
            )
            .toLocaleString()}
        </td>
      </tr>
    </tfoot>
  );
}

/* ─── main component ─── */

export default function RightsIssuePage() {
  const { registers, shareholders } = useStore();
  const activeRegisters = registers.filter((r) => r.status === "ACTIVE");

  const [activeTab, setActiveTab] = useState("declaration");

  // Declaration
  const [computed, setComputed] = useState(false);
  const [declPage, setDeclPage] = useState(1);
  const [date1, setDate1] = useState<Date>();
  const [date2, setDate2] = useState<Date>();
  const [date3, setDate3] = useState<Date>();

  // Pending Approval
  const [authReviewingBatch, setAuthReviewingBatch] = useState<string | null>(
    null,
  );
  const [authPage, setAuthPage] = useState(1);
  const [authComment, setAuthComment] = useState("");
  const [authDateRange, setAuthDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [authCalOpen, setAuthCalOpen] = useState(false);
  const [authRegister, setAuthRegister] = useState("all");

  // Allotment
  const [allotmentDone, setAllotmentDone] = useState(false);
  const [allotTab, setAllotTab] = useState<
    "approved" | "disapproved" | "invalid"
  >("approved");
  const [allotPage, setAllotPage] = useState(1);
  const [allotApprovedFile, setAllotApprovedFile] = useState<string | null>(
    null,
  );
  const [allotDisapprovedFile, setAllotDisapprovedFile] = useState<
    string | null
  >(null);
  const [allotInvalidFile, setAllotInvalidFile] = useState<string | null>(null);

  // Traded Rights Lodgment
  const [tradedRegister, setTradedRegister] = useState("");
  const [tradedBatchDate, setTradedBatchDate] = useState<Date>(new Date());
  const [tradedCalOpen, setTradedCalOpen] = useState(false);
  const [tradedSearch, setTradedSearch] = useState("");
  const [tradedSelectedSh, setTradedSelectedSh] = useState<Shareholder | null>(
    null,
  );
  const [tradedVolume, setTradedVolume] = useState("");
  const [tradedMcode, setTradedMcode] = useState("");
  const [tradedEntries, setTradedEntries] = useState<TradedEntry[]>([]);
  const [tradedSearchOpen, setTradedSearchOpen] = useState(false);

  // Rejection flow
  const [rejectedDecl, setRejectedDecl] = useState<{
    ref: string;
    comment: string;
  } | null>(null);
  const [pendingBatchDismissed, setPendingBatchDismissed] = useState(false);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<{
    action: "approve" | "reject";
  } | null>(null);
  const [modalComment, setModalComment] = useState("");

  // Page size (shared across all tables)
  const [pageSize, setPageSize] = useState(10);

  // Reports
  const [selectedReport, setSelectedReport] = useState(RIGHTS_REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("all");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportPage, setReportPage] = useState(1);

  // Outreach modals
  const [stickyLabelOpen, setStickyLabelOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  const closeModal = () => {
    setApprovalModal(null);
    setModalComment("");
  };

  /* handlers */
  const handleCompute = () => {
    toast.info("Computing rights entitlements...");
    setTimeout(() => {
      setComputed(true);
      setDeclPage(1);
      toast.success("Computation complete.");
    }, 800);
  };

  const handleSubmit = () => {
    toast.success(
      "Rights declaration submitted. Authorizer has been notified.",
    );
    setComputed(false);
  };

  const handleApprove = () => {
    toast.success("Declaration approved. Allotment is now enabled.");
    setAuthReviewingBatch(null);
    setAuthComment("");
    closeModal();
  };

  const handleReject = () => {
    setRejectedDecl({ ref: authReviewingBatch!, comment: modalComment });
    setPendingBatchDismissed(true);
    toast.error("Declaration rejected and returned to submitter.");
    setAuthReviewingBatch(null);
    setAuthComment("");
    closeModal();
  };

  const handleRunAllotment = () => {
    if (!allotApprovedFile) {
      toast.error("Please upload the Approved List before processing.");
      return;
    }
    toast.info("Processing allotment files...");
    setTimeout(() => {
      setAllotmentDone(true);
      setAllotTab("approved");
      setAllotPage(1);
      toast.success(
        "Allotment processed. Sticky labels and email dispatch are now available.",
      );
    }, 800);
  };

  const handleRunReport = () => {
    setReportGenerated(true);
    setReportPage(1);
    toast.success(`${selectedReport} generated.`);
  };

  const handlePageSizeChange = (s: number) => {
    setPageSize(s);
    setDeclPage(1);
    setAuthPage(1);
    setAllotPage(1);
    setReportPage(1);
  };

  /* derived pagination slices */
  const declStart = (declPage - 1) * pageSize;
  const declRows = shareholders.slice(declStart, declStart + pageSize);

  const authStart = (authPage - 1) * pageSize;
  const authRows = shareholders.slice(authStart, authStart + pageSize);

  const allotStart = (allotPage - 1) * pageSize;
  const allotRows = shareholders.slice(allotStart, allotStart + pageSize);

  const reportStart = (reportPage - 1) * pageSize;
  const reportRows = shareholders.slice(reportStart, reportStart + pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Rights Issue Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage rights offerings, compute entitlements, and process traded
          rights
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          {[
            ["declaration", "Declaration"],
            ["auth", "Pending Approval"],
            ["allotment", "Allotment"],
            ["lodgment", "Traded Rights Lodgment"],
            ["reports", "Reports"],
          ].map(([v, label]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {/* ── Declaration ── */}
          <TabsContent value="declaration" className="space-y-6">
            {rejectedDecl && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">
                      Declaration Rejected — Ref: {rejectedDecl.ref}
                    </p>
                    <p className="text-[13px] text-red-700 mt-0.5">
                      Authorizer comment:{" "}
                      {rejectedDecl.comment || "No comment provided."}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      Please review the entitlement data and resubmit for
                      approval.
                    </p>
                  </div>
                  <button
                    onClick={() => setRejectedDecl(null)}
                    className="rounded-full hover:bg-red-100 p-0.5"
                  >
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </button>
                </div>
              </Card>
            )}

            <Card className="mrpsl-card p-6">
              <h2 className="font-semibold text-lg border-b pb-2 mb-4">
                New Rights Declaration
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Register *</label>
                    <Select>
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue placeholder="Select Register" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeRegisters.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Rights Issue Name *</label>
                    <Input
                      placeholder="e.g. Zenith Bank 2026 Rights Issue 1-for-2"
                      className="mrpsl-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="mrpsl-label">Rights Ratio</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      defaultValue="1"
                      className="w-20 font-mono mrpsl-input"
                    />
                    <span className="text-sm font-medium">for</span>
                    <Input
                      type="number"
                      defaultValue="2"
                      className="w-20 font-mono mrpsl-input"
                    />
                    <span className="text-sm text-muted-foreground ml-2 italic">
                      1 new share for every 2 held
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    ["Record Date", date1, setDate1],
                    ["Acceptance Open", date2, setDate2],
                    ["Acceptance Close", date3, setDate3],
                  ].map(([lbl, val, setter]: any) => (
                    <div key={lbl} className="space-y-2">
                      <label className="mrpsl-label">{lbl}</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full mrpsl-input justify-start text-left font-normal"
                          >
                            {val ? (
                              format(val, "PPP")
                            ) : (
                              <span className="text-muted-foreground">
                                Pick a date
                              </span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={val}
                            onSelect={setter}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Issue Price (₦) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mrpsl-input font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">
                      Offer Circular Reference
                    </label>
                    <Input className="mrpsl-input" />
                  </div>
                </div>

                <Button className="mt-2" onClick={handleCompute}>
                  Compute Rights Due
                </Button>
              </div>
            </Card>

            {computed && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Rights Declared",
                      value: "12,500,000",
                      color: "",
                    },
                    {
                      label: "Eligible Shareholders",
                      value: "180,248",
                      color: "text-blue-600",
                    },
                    {
                      label: "Total Amount Due (₦)",
                      value: "₦6.25B",
                      color: "",
                    },
                    {
                      label: "Fractional Shares",
                      value: "1,204.5",
                      color: "text-amber-600",
                    },
                  ].map((s) => (
                    <Card key={s.label} className="mrpsl-card p-4">
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-2xl font-mono mt-1 font-bold",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="mrpsl-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <ShholderTableHead />
                      <tbody className="divide-y">
                        <ShholderRows rows={declRows} pageStart={declStart} />
                      </tbody>
                      <ShholderTfoot
                        rows={declRows}
                        total={shareholders.length}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={declPage}
                    total={shareholders.length}
                    onPageChange={setDeclPage}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </Card>

                <div className="flex justify-between items-center border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.info("Downloading entitlement list...")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Excel
                  </Button>
                  <Button size="lg" onClick={handleSubmit}>
                    Submit Declaration for Approval
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Pending Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            {authReviewingBatch === null ? (
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
                          {activeRegisters.map((r) => (
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
                                className="ml-auto rounded-full hover:bg-muted p-0.5"
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
                        <th className="px-4 py-3">DECLARATION REF</th>
                        <th className="px-4 py-3">REGISTER</th>
                        <th className="px-4 py-3">RIGHTS ISSUE</th>
                        <th className="px-4 py-3">RECORD DATE</th>
                        <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                        <th className="px-4 py-3 text-right">
                          RIGHTS DECLARED
                        </th>
                        <th className="px-4 py-3 text-right">
                          TOTAL AMOUNT DUE
                        </th>
                        <th className="px-4 py-3">SUBMITTED BY</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {!pendingBatchDismissed ? (
                        <tr className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                            RIGHTS-20260429-001
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            ZENITHBANK
                          </td>
                          <td className="px-4 py-3 text-sm">
                            Zenith Bank 2026 Rights Issue
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-[13px]">
                            22 Apr 2026
                          </td>
                          <td className="px-4 py-3 font-mono text-right">
                            180,248
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-blue-600 font-semibold">
                            12,500,000
                          </td>
                          <td className="px-4 py-3 font-mono text-right">
                            ₦625,000,000
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[13px] font-medium">
                              Chukwuemeka Obi
                            </div>
                            <div className="text-[13px] text-muted-foreground">
                              29 Apr 2026, 09:14
                            </div>
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
                                setAuthPage(1);
                                setAuthReviewingBatch("RIGHTS-20260429-001");
                              }}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
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
                      setAuthReviewingBatch(null);
                      setAuthComment("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Pending Approval
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {authReviewingBatch}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · ZENITHBANK · Zenith Bank 2026 Rights Issue
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                    Pending
                  </Badge>
                  <div className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Downloading declaration...")}
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Download
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Eligible Shareholders",
                      value: "180,248",
                      color: "text-foreground",
                    },
                    {
                      label: "Rights Declared",
                      value: "12,500,000",
                      color: "text-blue-600",
                    },
                    {
                      label: "Total Amount Due (₦)",
                      value: "₦625M",
                      color: "text-foreground",
                    },
                    {
                      label: "Fractional Shares",
                      value: "1,204.5",
                      color: "text-amber-600",
                    },
                  ].map((s) => (
                    <Card key={s.label} className="mrpsl-card p-3">
                      <div className="mrpsl-section-title">{s.label}</div>
                      <div
                        className={cn(
                          "text-xl font-mono font-bold mt-1",
                          s.color,
                        )}
                      >
                        {s.value}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Shareholder table */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <ShholderTableHead />
                      <tbody className="divide-y">
                        <ShholderRows rows={authRows} pageStart={authStart} />
                      </tbody>
                      <ShholderTfoot
                        rows={authRows}
                        total={shareholders.length}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={authPage}
                    total={shareholders.length}
                    onPageChange={setAuthPage}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </Card>

                {/* Approve / Reject */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={() => setApprovalModal({ action: "reject" })}
                  >
                    Reject Declaration
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={() => setApprovalModal({ action: "approve" })}
                  >
                    Approve &amp; Enable Allotment
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Allotment ── */}
          <TabsContent value="allotment" className="space-y-6">
            {/* SEC approval context card — always visible */}
            <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
              <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                SEC-Approved Declaration
              </p>
              <div className="flex items-center gap-8 text-sm flex-wrap">
                <div>
                  <div className="mrpsl-section-title">Declaration Ref</div>
                  <div className="font-mono font-semibold mt-0.5">
                    RIGHTS-20260429-001
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Register</div>
                  <div className="font-semibold mt-0.5">ZENITHBANK</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Rights Issue</div>
                  <div className="mt-0.5">Zenith Bank 2026 Rights Issue</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Rights Ratio</div>
                  <div className="font-mono mt-0.5">1 : 2</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Issue Price</div>
                  <div className="font-mono mt-0.5">₦50.00</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">SEC Approval</div>
                  <div className="font-mono mt-0.5">01 May 2026</div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-0 self-end mb-0.5">
                  SEC Approved
                </Badge>
              </div>
            </Card>

            {!allotmentDone ? (
              <>
                {/* 3-card upload grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Approved List */}
                  <Card className="mrpsl-card p-6 border-t-4 border-t-green-500">
                    <div className="flex justify-center mb-3">
                      <FileCheck2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground text-center">
                      Approved List
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-1 text-center">
                      Additional certificate — shareholders who exercised their
                      rights
                    </p>
                    <div className="mt-4">
                      {allotApprovedFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                          <FileCheck2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-[13px] font-medium text-green-800 flex-1 truncate">
                            {allotApprovedFile}
                          </span>
                          <button
                            onClick={() => setAllotApprovedFile(null)}
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
                              setAllotApprovedFile(
                                e.target.files?.[0]?.name ?? null,
                              )
                            }
                          />
                        </label>
                      )}
                    </div>
                  </Card>

                  {/* Disapproved List */}
                  <Card className="mrpsl-card p-6 border-t-4 border-t-amber-500">
                    <div className="flex justify-center mb-3">
                      <FileX2 className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="font-semibold text-foreground text-center">
                      Disapproved List
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-1 text-center">
                      Return money — rejected applications
                    </p>
                    <div className="mt-4 space-y-3">
                      {allotDisapprovedFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <FileX2 className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-[13px] font-medium text-amber-800 flex-1 truncate">
                            {allotDisapprovedFile}
                          </span>
                          <button
                            onClick={() => setAllotDisapprovedFile(null)}
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
                              setAllotDisapprovedFile(
                                e.target.files?.[0]?.name ?? null,
                              )
                            }
                          />
                        </label>
                      )}
                    </div>
                  </Card>

                  {/* Invalid Subscription */}
                  <Card className="mrpsl-card p-6 border-t-4 border-t-red-500">
                    <div className="flex justify-center mb-3">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="font-semibold text-foreground text-center">
                      Invalid Subscription
                    </h3>
                    <p className="text-[13px] text-muted-foreground mt-1 text-center">
                      Return money — failed or invalid applications
                    </p>
                    <div className="mt-4 space-y-3">
                      {allotInvalidFile ? (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-[13px] font-medium text-red-800 flex-1 truncate">
                            {allotInvalidFile}
                          </span>
                          <button
                            onClick={() => setAllotInvalidFile(null)}
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
                              setAllotInvalidFile(
                                e.target.files?.[0]?.name ?? null,
                              )
                            }
                          />
                        </label>
                      )}
                    </div>
                  </Card>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRunAllotment}
                >
                  Process Allotment
                </Button>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {/* Stats */}
                <div className="grid grid-cols-5 gap-3">
                  {[
                    {
                      label: "Total Processed",
                      value: "180,248",
                      color: "text-foreground",
                    },
                    {
                      label: "Approved (Certificates)",
                      value: "174,640",
                      color: "text-green-700",
                      tab: "approved" as const,
                    },
                    {
                      label: "Disapproved (Return)",
                      value: "3,802",
                      color: "text-amber-600",
                      tab: "disapproved" as const,
                    },
                    {
                      label: "Invalid (Return)",
                      value: "1,806",
                      color: "text-red-600",
                      tab: "invalid" as const,
                    },
                    {
                      label: "Total Return Amount",
                      value: "₦28.0M",
                      color: "text-foreground",
                    },
                  ].map((s) => (
                    <Card
                      key={s.label}
                      className={cn(
                        "mrpsl-card p-3",
                        "tab" in s &&
                          "cursor-pointer hover:border-primary/40 transition-colors",
                      )}
                      onClick={() => "tab" in s && s.tab && setAllotTab(s.tab)}
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
                      {"tab" in s && s.tab && (
                        <div className="text-[13px] text-muted-foreground mt-0.5">
                          click to view
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Tabbed results table */}
                <Card className="mrpsl-card overflow-hidden">
                  {/* Tab strip */}
                  <div className="flex items-center gap-1 border-b px-4 bg-muted/10">
                    {(["approved", "disapproved", "invalid"] as const).map(
                      (t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setAllotTab(t);
                            setAllotPage(1);
                          }}
                          className={cn(
                            "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                            allotTab === t
                              ? t === "approved"
                                ? "border-green-600 text-green-700"
                                : t === "disapproved"
                                  ? "border-amber-500 text-amber-700"
                                  : "border-red-500 text-red-700"
                              : "border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {t === "approved"
                            ? `Approved (${MOCK_ALLOT_APPROVED.length.toLocaleString()})`
                            : t === "disapproved"
                              ? `Disapproved (${MOCK_ALLOT_DISAPPROVED.length})`
                              : `Invalid (${MOCK_ALLOT_INVALID.length})`}
                        </button>
                      ),
                    )}
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="my-1.5 mr-1"
                      onClick={() =>
                        toast.success(`Exporting ${allotTab} list...`)
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export{" "}
                      {allotTab.charAt(0).toUpperCase() + allotTab.slice(1)}
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    {allotTab === "approved" && (
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">SHAREHOLDER NAME</th>
                            <th className="px-4 py-2.5">CHN</th>
                            <th className="px-4 py-2.5">STOCKBROKER CODE</th>
                            <th className="px-4 py-2.5 text-right">
                              UNITS HELD
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              RIGHTS DUE
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              ADDITIONAL CERTIFICATE
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_ALLOT_APPROVED.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 font-mono">{r.chn}</td>
                              <td className="px-4 py-2.5 font-mono">
                                {r.broker}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {r.unitsHeld.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-blue-600">
                                {r.rightsDue.toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">
                                {r.certShares.toLocaleString()}
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
                              TOTALS (showing {MOCK_ALLOT_APPROVED.length} of
                              174,640)
                            </td>
                            <td className="px-4 py-2.5 text-right text-blue-600">
                              {MOCK_ALLOT_APPROVED.reduce(
                                (a, r) => a + r.rightsDue,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-700">
                              {MOCK_ALLOT_APPROVED.reduce(
                                (a, r) => a + r.certShares,
                                0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}

                    {allotTab === "disapproved" && (
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">SHAREHOLDER NAME</th>
                            <th className="px-4 py-2.5">CHN</th>
                            <th className="px-4 py-2.5">BANK NAME</th>
                            <th className="px-4 py-2.5">ACCOUNT NO</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT TO RETURN (₦)
                            </th>
                            <th className="px-4 py-2.5">REASON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_ALLOT_DISAPPROVED.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 font-mono">{r.chn}</td>
                              <td className="px-4 py-2.5">{r.bank}</td>
                              <td className="px-4 py-2.5 font-mono">
                                {r.acct}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold text-amber-700">
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
                              colSpan={5}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS (showing {MOCK_ALLOT_DISAPPROVED.length} of
                              3,802)
                            </td>
                            <td className="px-4 py-2.5 text-right text-amber-700">
                              ₦
                              {MOCK_ALLOT_DISAPPROVED.reduce(
                                (a, r) => a + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    )}

                    {allotTab === "invalid" && (
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">SHAREHOLDER NAME</th>
                            <th className="px-4 py-2.5">CHN</th>
                            <th className="px-4 py-2.5 text-right">
                              AMOUNT TO RETURN (₦)
                            </th>
                            <th className="px-4 py-2.5">REASON</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {MOCK_ALLOT_INVALID.map((r, i) => (
                            <tr key={i} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {r.name}
                              </td>
                              <td className="px-4 py-2.5 font-mono">{r.chn}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-700">
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
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td
                              colSpan={3}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS (showing {MOCK_ALLOT_INVALID.length} of
                              1,806)
                            </td>
                            <td className="px-4 py-2.5 text-right text-red-700">
                              ₦
                              {MOCK_ALLOT_INVALID.reduce(
                                (a, r) => a + r.amount,
                                0,
                              ).toLocaleString()}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </Card>

                {/* Post-allotment actions */}
                <div className="flex flex-wrap gap-3 pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => toast.info("Downloading allotment file...")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStickyLabelOpen(true)}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print Sticky Labels
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEmailPreviewOpen(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Email Shareholders
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.success("Allotment data pushed to CSCS API.")
                    }
                  >
                    <CloudUpload className="mr-2 h-4 w-4" /> Push via CSCS API
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Traded Rights Lodgment ── */}
          <TabsContent value="lodgment" className="space-y-6">
            {/* Batch header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="mrpsl-label">Register *</label>
                <Select
                  value={tradedRegister}
                  onValueChange={(v) => setTradedRegister(v || "")}
                >
                  <SelectTrigger className="mrpsl-input w-full">
                    <SelectValue placeholder="Select Register" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRegisters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} · {r.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="mrpsl-label">Lodgment Date</label>
                <Popover open={tradedCalOpen} onOpenChange={setTradedCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mrpsl-input justify-start text-left font-normal"
                    >
                      {format(tradedBatchDate, "PPP")}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={tradedBatchDate}
                      onSelect={(d) => {
                        if (d) {
                          setTradedBatchDate(d);
                          setTradedCalOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="mrpsl-label">Batch Reference</label>
                <Input
                  disabled
                  value={`TR-${format(tradedBatchDate, "yyyyMMdd")}-001`}
                  className="mrpsl-input bg-muted/50 font-mono text-sm"
                />
              </div>
            </div>

            {/* Entry form */}
            <Card className="mrpsl-card p-5">
              <h3 className="font-semibold text-sm mb-4">
                Add Shareholder Entry
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
                {/* Shareholder search */}
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Shareholder</label>
                  <Popover
                    open={tradedSearchOpen}
                    onOpenChange={setTradedSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full mrpsl-input justify-start text-left font-normal gap-2"
                      >
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        {tradedSelectedSh ? (
                          <span className="flex-1 truncate">
                            {tradedSelectedSh.firstName}{" "}
                            {tradedSelectedSh.lastName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex-1">
                            Search by name or account no...
                          </span>
                        )}
                        {tradedSelectedSh && (
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTradedSelectedSh(null);
                              setTradedSearch("");
                            }}
                            className="ml-auto rounded-full hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[320px]" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search shareholders..."
                          value={tradedSearch}
                          onValueChange={setTradedSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No shareholders found.</CommandEmpty>
                          <CommandGroup>
                            {shareholders
                              .filter(
                                (s) =>
                                  tradedSearch.length >= 2 &&
                                  (`${s.firstName} ${s.lastName}`
                                    .toLowerCase()
                                    .includes(tradedSearch.toLowerCase()) ||
                                    s.accountNumber
                                      .toLowerCase()
                                      .includes(tradedSearch.toLowerCase())),
                              )
                              .slice(0, 10)
                              .map((s) => (
                                <CommandItem
                                  key={s.id}
                                  value={`${s.firstName} ${s.lastName}`}
                                  onSelect={() => {
                                    setTradedSelectedSh(s);
                                    setTradedSearch("");
                                    setTradedSearchOpen(false);
                                  }}
                                >
                                  <div>
                                    <div className="font-medium text-sm">
                                      {s.firstName} {s.lastName}
                                    </div>
                                    <div className="text-[13px] text-muted-foreground font-mono">
                                      {s.accountNumber}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Volume */}
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Volume (units)</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 5000"
                    value={tradedVolume}
                    onChange={(e) => setTradedVolume(e.target.value)}
                    className="mrpsl-input w-36 font-mono"
                  />
                </div>

                {/* MCODE */}
                <div className="space-y-1.5">
                  <label className="mrpsl-label">Stockbroker Code</label>
                  <Input
                    placeholder="e.g. MST"
                    value={tradedMcode}
                    onChange={(e) =>
                      setTradedMcode(e.target.value.toUpperCase())
                    }
                    className="mrpsl-input w-28 font-mono uppercase"
                    maxLength={5}
                  />
                </div>

                {/* Add button */}
                <Button
                  size="xl"
                  disabled={
                    !tradedSelectedSh ||
                    !tradedVolume ||
                    !tradedMcode ||
                    !tradedRegister
                  }
                  onClick={() => {
                    if (!tradedSelectedSh) return;
                    const entry: TradedEntry = {
                      id: `${tradedSelectedSh.id}-${Date.now()}`,
                      regacno: tradedSelectedSh.accountNumber,
                      chn: MOCK_CHNS[
                        Math.floor(Math.random() * MOCK_CHNS.length)
                      ],
                      name: `${tradedSelectedSh.firstName} ${tradedSelectedSh.lastName}`,
                      volume: Number(tradedVolume),
                      mcode: tradedMcode,
                    };
                    setTradedEntries((prev) => [...prev, entry]);
                    setTradedSelectedSh(null);
                    setTradedVolume("");
                    setTradedMcode("");
                    setTradedSearch("");
                    toast.success("Shareholder entry added.");
                  }}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Add Entry
                </Button>
              </div>
            </Card>

            {/* Entries table */}
            {tradedEntries.length > 0 ? (
              <Card className="mrpsl-card overflow-hidden">
                <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">
                    Batch Entries ({tradedEntries.length})
                  </span>
                  <span className="text-[13px] text-muted-foreground font-mono">
                    Total Volume:{" "}
                    {tradedEntries
                      .reduce((a, e) => a + e.volume, 0)
                      .toLocaleString()}{" "}
                    units
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">REG AC NO</th>
                        <th className="px-3 py-2.5">CHN</th>
                        <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
                        <th className="px-3 py-2.5 text-right">VOLUME</th>
                        <th className="px-3 py-2.5">MCODE</th>
                        <th className="px-3 py-2.5 text-right">REMOVE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tradedEntries.map((e, i) => (
                        <tr key={e.id} className="mrpsl-table-row">
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2.5 font-mono">{e.regacno}</td>
                          <td className="px-3 py-2.5 font-mono">{e.chn}</td>
                          <td className="px-3 py-2.5 font-medium">{e.name}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold">
                            {e.volume.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 font-mono">{e.mcode}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() =>
                                setTradedEntries((prev) =>
                                  prev.filter((x) => x.id !== e.id),
                                )
                              }
                              className="rounded p-1 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-2.5 text-right text-muted-foreground"
                        >
                          BATCH TOTAL
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {tradedEntries
                            .reduce((a, e) => a + e.volume, 0)
                            .toLocaleString()}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex gap-3 p-4 border-t">
                  <Button
                    className="flex-1"
                    disabled={!tradedRegister}
                    onClick={() => {
                      toast.success(
                        `Traded rights batch processed — ${tradedEntries.length} entries.`,
                      );
                      setTradedEntries([]);
                    }}
                  >
                    Process Lodgment
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!tradedRegister}
                    onClick={() => toast.success("Pushed to CSCS API.")}
                  >
                    <CloudUpload className="mr-2 h-4 w-4" /> Push via CSCS API
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No entries yet — search for a shareholder above and add their
                traded rights subscription.
              </div>
            )}
          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports" className="space-y-6">
            {/* Report type pills */}
            <Card className="mrpsl-card">
              <div className="p-4 border-b bg-muted/20">
                <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  Report Type
                </p>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {RIGHTS_REPORT_TYPES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedReport(r);
                      setReportGenerated(false);
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
            </Card>

            {/* Filters */}
            <Card className="mrpsl-card p-5">
              <label className="mrpsl-label">Register</label>
              <div className="flex items-center gap-3 mt-1.5">
                <Select
                  value={reportRegister}
                  onValueChange={(v) => {
                    setReportRegister(v ?? "all");
                    setReportGenerated(false);
                  }}
                >
                  <SelectTrigger className="mrpsl-input w-64">
                    <SelectValue placeholder="All Registers" />
                  </SelectTrigger>
                  <SelectContent className="w-max">
                    <SelectItem value="all">All Registers</SelectItem>
                    {activeRegisters.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} · {r.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="xl"
                  className="px-6 font-semibold shrink-0"
                  onClick={handleRunReport}
                >
                  Generate Report
                </Button>
              </div>
            </Card>

            {reportGenerated && (
              <div className="space-y-4 animate-in fade-in">
                {/* Export bar */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    {selectedReport} — {shareholders.length.toLocaleString()}{" "}
                    records
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("Downloading Excel...")}
                    >
                      <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("Generating PDF...")}
                    >
                      <Download className="mr-1.5 h-4 w-4" /> PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("Sending to printer...")}
                    >
                      <Printer className="mr-1.5 h-4 w-4" /> Print
                    </Button>
                  </div>
                </div>

                {selectedReport === "Rights Entitlement List" ||
                selectedReport === "Non-Acceptance List" ? (
                  <Card className="mrpsl-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <ShholderTableHead />
                        <tbody className="divide-y">
                          <ShholderRows
                            rows={reportRows}
                            pageStart={reportStart}
                          />
                        </tbody>
                        <ShholderTfoot
                          rows={reportRows}
                          total={shareholders.length}
                        />
                      </table>
                    </div>
                    <PaginationBar
                      page={reportPage}
                      total={shareholders.length}
                      onPageChange={setReportPage}
                      pageSize={pageSize}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </Card>
                ) : selectedReport === "Acceptance Summary" ||
                  selectedReport === "State Analysis" ? (
                  <Card className="mrpsl-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-3">
                              {selectedReport === "State Analysis"
                                ? "STATE"
                                : "STOCKBROKER"}
                            </th>
                            <th className="px-4 py-3 text-right">
                              ELIGIBLE SHs
                            </th>
                            <th className="px-4 py-3 text-right">RIGHTS DUE</th>
                            <th className="px-4 py-3 text-right">ACCEPTED</th>
                            <th className="px-4 py-3 text-right">WAIVED</th>
                            <th className="px-4 py-3 text-right">
                              AMOUNT COLLECTED (₦)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] font-mono">
                          {(selectedReport === "State Analysis"
                            ? [
                                "Lagos",
                                "Abuja",
                                "Kano",
                                "Rivers",
                                "Oyo",
                                "Enugu",
                                "Kogi",
                              ]
                            : [
                                "Meristem",
                                "Zenith Securities",
                                "ARM Securities",
                                "CardinalStone",
                                "Stanbic IBTC",
                                "Afrinvest",
                                "Vetiva",
                              ]
                          ).map((name, i) => {
                            const eligible =
                              Math.floor(180248 / 7) + (i % 3) * 1000;
                            const due = eligible * 50;
                            const accepted = Math.floor(eligible * 0.92);
                            return (
                              <tr key={name} className="mrpsl-table-row">
                                <td className="px-4 py-2.5 font-sans font-medium">
                                  {name}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {eligible.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right text-blue-600">
                                  {(eligible * 25).toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right text-green-700">
                                  {accepted.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right text-amber-700">
                                  {(eligible - accepted).toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  ₦{(accepted * 50).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : selectedReport === "Range Analysis" ? (
                  <Card className="mrpsl-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-3">UNITS RANGE</th>
                            <th className="px-4 py-3 text-right">NO. OF SHs</th>
                            <th className="px-4 py-3 text-right">RIGHTS DUE</th>
                            <th className="px-4 py-3 text-right">
                              AMOUNT DUE (₦)
                            </th>
                            <th className="px-4 py-3 text-right">% OF TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] font-mono">
                          {[
                            [
                              "1 – 500",
                              "24,812",
                              "6,203,000",
                              "310,150,000",
                              "13.8%",
                            ],
                            [
                              "501 – 1,000",
                              "38,445",
                              "19,222,500",
                              "961,125,000",
                              "21.3%",
                            ],
                            [
                              "1,001 – 5,000",
                              "52,600",
                              "131,500,000",
                              "6,575,000,000",
                              "29.2%",
                            ],
                            [
                              "5,001 – 10,000",
                              "31,240",
                              "156,200,000",
                              "7,810,000,000",
                              "17.3%",
                            ],
                            [
                              "10,001 – 50,000",
                              "22,908",
                              "573,650,000",
                              "28,682,500,000",
                              "12.7%",
                            ],
                            [
                              "50,001 – 100,000",
                              "7,210",
                              "450,625,000",
                              "22,531,250,000",
                              "4.0%",
                            ],
                            [
                              "Above 100,000",
                              "3,033",
                              "911,000,000",
                              "45,550,000,000",
                              "1.7%",
                            ],
                          ].map(([range, ...rest]) => (
                            <tr key={range} className="mrpsl-table-row">
                              <td className="px-4 py-2.5 font-sans">{range}</td>
                              {rest.map((v, i) => (
                                <td key={i} className="px-4 py-2.5 text-right">
                                  {v}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : (
                  /* Allotment Report / Traded Rights Report */
                  <Card className="mrpsl-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-3 py-2.5">#</th>
                            <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
                            <th className="px-3 py-2.5">CHN</th>
                            <th className="px-3 py-2.5">STOCKBROKER CODE</th>
                            <th className="px-3 py-2.5 text-right">
                              UNITS HELD
                            </th>
                            <th className="px-3 py-2.5 text-right">
                              RIGHTS DUE
                            </th>
                            <th className="px-3 py-2.5 text-right">
                              SHARES ALLOTTED
                            </th>
                            <th className="px-3 py-2.5 text-center">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reportRows.map((s: any, i: number) => {
                            const gi = reportStart + i;
                            const rights = Math.floor(s.holdings / 2);
                            const waived = (gi + 1) % 7 === 0;
                            return (
                              <tr key={s.id} className="mrpsl-table-row">
                                <td className="px-3 py-2.5 text-muted-foreground">
                                  {gi + 1}
                                </td>
                                <td className="px-3 py-2.5 font-medium">
                                  {s.firstName} {s.lastName}
                                </td>
                                <td className="px-3 py-2.5 font-mono">
                                  {MOCK_CHNS[gi % MOCK_CHNS.length]}
                                </td>
                                <td className="px-3 py-2.5 font-mono">
                                  {MOCK_BROKERS[gi % MOCK_BROKERS.length]}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono">
                                  {s.holdings.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-blue-600">
                                  {rights.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono font-semibold">
                                  {waived ? "—" : rights.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Badge
                                    className={cn(
                                      "border-0 text-[13px]",
                                      waived
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-green-100 text-green-800",
                                    )}
                                  >
                                    {waived ? "Waived" : "Allotted"}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      page={reportPage}
                      total={shareholders.length}
                      onPageChange={setReportPage}
                      pageSize={pageSize}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Outreach modals ── */}
      <StickyLabelModal
        open={stickyLabelOpen}
        onOpenChange={setStickyLabelOpen}
        offerType="rights"
        companyName="Neimeth International Pharmaceuticals Plc"
        shareholders={shareholders.slice(0, 6).map((s) => ({
          id: s.id,
          accountNumber: s.accountNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          address: s.address,
          state: s.state,
          holdings: s.holdings,
        }))}
        totalCount={shareholders.length}
      />

      <EmailPreviewModal
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        offerType="rights"
        companyName="Neimeth International Pharmaceuticals Plc"
        offerName="Rights Issue"
        ratio="1 : 7"
        closeDate="25 May 2026"
        issuePrice="4.00"
        contactEmail="NeimethRights@meristemregistrars.com"
        shareholders={shareholders.slice(0, 5).map((s) => ({
          id: s.id,
          accountNumber: s.accountNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          address: s.address,
          state: s.state,
          holdings: s.holdings,
        }))}
        totalCount={shareholders.length}
      />

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
              {approvalModal?.action === "approve"
                ? "Approve Declaration"
                : "Reject Declaration"}
            </DialogTitle>
            <DialogDescription>
              {approvalModal?.action === "approve"
                ? "Add an optional comment before enabling allotment."
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
                  approvalModal?.action === "approve"
                    ? handleApprove()
                    : handleReject();
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
