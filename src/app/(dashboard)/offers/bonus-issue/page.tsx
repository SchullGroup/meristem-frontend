"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Info,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Printer,
  CalendarRange,
  X,
  Mail,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { EmailPreviewModal } from "@/components/custom/shareholder-outreach-modals";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CREATE_BONUS_ISSUE_DECLARATION,
  GET_DECLARATIONS,
  GET_SHAREHOLDERS_BY_DECLARATION_ID,
  GET_DECLARATION_BY_ID,
  APPROVE_DECLARATION,
} from "@/actions/bonusIssuesAction";
import { getUser } from "@/services/AuthServices";

/* ─── constants & helpers ─── */

const PAGE_SIZE = 10;

const BONUS_REPORT_TYPES = [
  "Bonus Entitlement Register",
  "Shareholder Bonus Allotment List",
  "Summary of Bonus Shares Issued",
  "Exception and Rounding Report",
];

const MOCK_DECL = {
  ref: "BONUS-20260429-001",
  register: "ZENITHBANK",
  bonusName: "2025 Bonus Issue 1-for-4",
  ratio: "1 : 4",
  qualDate: "22 Apr 2026",
  closureDate: "25 Apr 2026",
  allotDate: "30 Apr 2026",
  rounding: "Round Down",
  narrative:
    "Annual bonus issue as approved by the board at the AGM held 15 March 2026.",
  submittedBy: "Chukwuemeka Obi",
  submittedAt: "29 Apr 2026, 09:14",
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
}: {
  page: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visible = getVisiblePages(page, totalPages);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 text-[13px]">
      <span className="text-muted-foreground">
        Showing {start}–{end} of {total.toLocaleString()}
      </span>
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

/* Shareholder rows shared by Approval, ICU, and Reports */
function BonusTableHead() {
  return (
    <thead className="mrpsl-table-header">
      <tr>
        <th className="px-4 py-2.5">#</th>
        <th className="px-4 py-2.5">ACCOUNT NO</th>
        <th className="px-4 py-2.5">HOLDER NAME</th>
        <th className="px-4 py-2.5 text-right">UNITS AT QUAL DATE</th>
        <th className="px-4 py-2.5 text-right">BONUS DUE</th>
        <th className="px-4 py-2.5 text-right">FRACTION</th>
      </tr>
    </thead>
  );
}

function BonusTableRows({
  rows,
  startIdx,
}: {
  rows: {
    holdings: number;
    accountNumber: string;
    firstName: string;
    lastName: string;
    id: string;
  }[];
  startIdx: number;
}) {
  return (
    <>
      {rows.map((s, i) => {
        const bonus = Math.floor(s.holdings / 4);
        const frac = s.holdings / 4 - bonus;
        return (
          <tr key={s.id} className="mrpsl-table-row font-mono text-[13px]">
            <td className="px-4 py-2.5 text-muted-foreground">
              {startIdx + i + 1}
            </td>
            <td className="px-4 py-2.5">{s.accountNumber}</td>
            <td className="px-4 py-2.5 font-sans font-medium">
              {s.firstName} {s.lastName}
            </td>
            <td className="px-4 py-2.5 text-right">
              {s.holdings.toLocaleString()}
            </td>
            <td className="px-4 py-2.5 text-right text-green-600 font-bold">
              {bonus.toLocaleString()}
            </td>
            <td className="px-4 py-2.5 text-right text-amber-600">
              {frac.toFixed(4)}
            </td>
          </tr>
        );
      })}
    </>
  );
}

function EntitlementTableRows({
  rows,
  startIdx,
}: {
  rows: any[];
  startIdx: number;
}) {
  if (!rows) return null;
  return (
    <>
      {rows.map((s, i) => (
        <tr
          key={s.accountNumber}
          className="mrpsl-table-row font-mono text-[13px]"
        >
          <td className="px-4 py-2.5 text-muted-foreground">
            {startIdx + i + 1}
          </td>
          <td className="px-4 py-2.5">{s.accountNumber}</td>
          <td className="px-4 py-2.5 font-sans font-medium">{s.name}</td>
          <td className="px-4 py-2.5 text-right">
            {s.unitsAtQualDate?.toLocaleString()}
          </td>
          <td className="px-4 py-2.5 text-right text-green-600 font-bold">
            {s.bonusDue?.toLocaleString()}
          </td>
          <td className="px-4 py-2.5 text-right text-amber-600">
            {s.fractionalRemainder?.toFixed(4)}
          </td>
        </tr>
      ))}
    </>
  );
}

function BonusTfoot({
  rows,
  total,
}: {
  rows: { holdings: number }[];
  total: number;
}) {
  return (
    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
      <tr>
        <td
          colSpan={4}
          className="px-4 py-2.5 text-right text-muted-foreground"
        >
          PAGE TOTALS ({total.toLocaleString()} total shareholders)
        </td>
        <td className="px-4 py-2.5 text-right text-green-600">
          {rows
            .reduce(
              (a: number, s: { holdings: number }) =>
                a + Math.floor(s.holdings / 4),
              0,
            )
            .toLocaleString()}
        </td>
        <td className="px-4 py-2.5 text-right text-amber-600">
          {rows
            .reduce(
              (a: number, s: { holdings: number }) =>
                a + (s.holdings / 4 - Math.floor(s.holdings / 4)),
              0,
            )
            .toFixed(4)}
        </td>
      </tr>
    </tfoot>
  );
}

function EntitlementTfoot({ rows, total }: { rows: any[]; total: number }) {
  if (!rows) return null;
  return (
    <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
      <tr>
        <td
          colSpan={4}
          className="px-4 py-2.5 text-right text-muted-foreground"
        >
          PAGE TOTALS ({total.toLocaleString()} total shareholders)
        </td>
        <td className="px-4 py-2.5 text-right text-green-600">
          {rows
            .reduce((a: number, s: any) => a + (s.bonusDue || 0), 0)
            .toLocaleString()}
        </td>
        <td className="px-4 py-2.5 text-right text-amber-600">
          {rows
            .reduce((a: number, s: any) => a + (s.fractionalRemainder || 0), 0)
            .toFixed(4)}
        </td>
      </tr>
    </tfoot>
  );
}

/* Declaration detail card — reused in both Approval and ICU */
function DeclDetailCard({ decl }: { decl: any }) {
  if (!decl) return null;
  return (
    <Card className="mrpsl-card p-4">
      <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Declaration Details
      </p>
      <div className="grid grid-cols-4 gap-x-8 gap-y-3 text-sm">
        <div>
          <div className="mrpsl-section-title">Register</div>
          <div className="font-semibold mt-0.5">{decl.registerName}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Bonus Name</div>
          <div className="font-semibold mt-0.5">{decl.bonusName}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Bonus Ratio</div>
          <div className="font-mono mt-0.5">{decl.ratio}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Rounding Rule</div>
          <div className="mt-0.5">{decl.roundingRule}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Qualification Date</div>
          <div className="font-mono mt-0.5">{decl.qualificationDate}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Closure Date</div>
          <div className="font-mono mt-0.5">{decl.closureDate}</div>
        </div>
        <div>
          <div className="mrpsl-section-title">Allotment Date</div>
          <div className="font-mono mt-0.5">{decl.allotmentDate}</div>
        </div>
        <div className="col-span-1">
          <div className="mrpsl-section-title">Narrative</div>
          <div className="text-muted-foreground mt-0.5 italic text-[13px]">
            &quot;{decl.narrative || "No narrative provided."}&quot;
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── main component ─── */

export default function BonusIssuePage() {
  const { data: registersData } = useGetRegisters();
  const queryClient = useQueryClient();
  const user = getUser();
  const registerList = registersData?.content;

  const { registers, shareholders } = useStore();
  const activeRegisters = registers.filter((r) => r.status === "ACTIVE");

  const [activeTab, setActiveTab] = useState("declaration");

  // Declaration
  const [computed, setComputed] = useState(false);
  const [date1, setDate1] = useState<Date>();
  const [date2, setDate2] = useState<Date>();
  const [date3, setDate3] = useState<Date>();
  const [selectedRegister, setSelectedRegister] = useState<string>("");
  const [bonusName, setBonusName] = useState<string>("");
  const [ratioNumerator, setRatioNumerator] = useState<string>("1");
  const [ratioDenominator, setRatioDenominator] = useState<string>("4");
  const [roundingRule, setRoundingRule] = useState<string>("ROUND_DOWN");
  const [narrative, setNarrative] = useState<string>("");

  // Approval (2-step)
  const [authReviewing, setAuthReviewing] = useState<string | null>(null);
  const [authComment, setAuthComment] = useState("");
  const [authPage, setAuthPage] = useState(1);

  // Rejection flow
  const [rejectedDecl, setRejectedDecl] = useState<{
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

  // ICU Approval (2-step)
  const [icuReviewing, setIcuReviewing] = useState<string | null>(null);
  const [icuComment, setIcuComment] = useState("");
  const [icuPage, setIcuPage] = useState(1);

  // Allotment
  const [allotmentProcessed, setAllotmentProcessed] = useState(false);
  const [allotPage, setAllotPage] = useState(1);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  // Reports
  const [selectedReport, setSelectedReport] = useState(BONUS_REPORT_TYPES[0]);
  const [reportRegister, setReportRegister] = useState("all");
  const [reportDateRange, setReportDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [reportCalOpen, setReportCalOpen] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportPage, setReportPage] = useState(1);

  const { data: declarationsData } = useQuery({
    queryKey: ["bonus-declarations"],
    queryFn: GET_DECLARATIONS,
  });

  const declarationList = declarationsData?.data?.content;

  const { data: activeReviewData, isLoading: isActiveReviewLoading } = useQuery(
    {
      queryKey: ["bonus-declaration", authReviewing || icuReviewing],
      queryFn: () =>
        GET_DECLARATION_BY_ID((authReviewing || icuReviewing) as string),
      enabled: !!(authReviewing || icuReviewing),
    },
  );

  const activeReview = activeReviewData?.data;

  const { data: entitlementData, isLoading: isEntitlementLoading } = useQuery({
    queryKey: ["bonus-entitlements", authReviewing || icuReviewing],
    queryFn: () =>
      GET_SHAREHOLDERS_BY_DECLARATION_ID(
        (authReviewing || icuReviewing) as string,
      ),
    enabled: !!(authReviewing || icuReviewing),
  });

  const entitlementList = entitlementData?.data?.content;
  const entitlementTotal = entitlementData?.data?.totalElements || 0;

  const createDeclarationMutation = useMutation({
    mutationFn: CREATE_BONUS_ISSUE_DECLARATION,
    onSuccess: (data) => {
      console.log("Data", data);
      toast.success("Declaration created successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      // setComputed(false);
      setComputed(true);
      setSelectedRegister("");
      setBonusName("");
      setRatioNumerator("");
      setRatioDenominator("");
      setRoundingRule("");
      setDate1(undefined);
      setDate2(undefined);
      setDate3(undefined);
      setNarrative("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveDeclarationMutation = useMutation({
    mutationFn: APPROVE_DECLARATION,
    onSuccess: () => {
      toast.success("Declaration approved successfully.");
      queryClient.invalidateQueries({
        queryKey: ["bonus-declarations"],
      });
      setAuthReviewing(null);
      setAuthComment("");
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // const handleAuthApprove = () => {
  //   toast.success("Declaration approved and forwarded to ICU.");
  // };

  const handleAuthApprove = (section: "ops" | "icu") => {
    const payload = {
      decision: "APPROVE",
      comment: modalComment,
    };
    approveDeclarationMutation.mutate({
      declarationId: authReviewing || icuReviewing,
      payload,
    });
  };

  const closeModal = () => {
    setApprovalModal(null);
    setModalComment("");
  };

  /* handlers */
  const handleSubmitForApproval = () => {
    toast.info("Submitting declaration for approval...");
  };

  const handleCompute = () => {
    if (!selectedRegister) {
      toast.error("Please select a register");
      return;
    }
    if (!bonusName) {
      toast.error("Please enter a bonus name");
      return;
    }
    if (!ratioNumerator || !ratioDenominator) {
      toast.error("Please enter a bonus ratio");
      return;
    }
    if (!roundingRule) {
      toast.error("Please select a rounding rule");
      return;
    }
    if (!date1 || !date2 || !date3) {
      toast.error("Please select all dates");
      return;
    }
    const payload = {
      createdBy: user?.email,
      registerId: selectedRegister,
      bonusName,
      ratio: `${ratioNumerator}:${ratioDenominator}`,
      roundingRule,
      qualificationDate: format(date1, "yyyy-MM-dd"),
      closureDate: format(date2, "yyyy-MM-dd"),
      allotmentDate: format(date3, "yyyy-MM-dd"),
      narrative,
    };

    createDeclarationMutation.mutate(payload);
  };

  const handleAuthReject = () => {
    setRejectedDecl({ ref: authReviewing!, comment: modalComment });
    setPendingBatchDismissed(true);
    toast.error("Declaration rejected and returned to submitter.");
    setAuthReviewing(null);
    setAuthComment("");
    closeModal();
  };

  const handleIcuApprove = () => {
    toast.success(
      "ICU approved. Declaration cleared for allotment and reporting.",
    );
    setIcuReviewing(null);
    setIcuComment("");
    closeModal();
  };

  const handleIcuReturn = () => {
    toast.error("Batch returned to Operations for review.");
    setIcuReviewing(null);
    setIcuComment("");
    closeModal();
  };

  const handleProcessAllotment = () => {
    toast.info("Processing allotment…");
    setTimeout(() => {
      setAllotmentProcessed(true);
      setAllotPage(1);
      toast.success(
        "Allotment processed. Certificates and CSCS entries created.",
      );
    }, 1000);
  };

  const handleRunReport = () => {
    setReportGenerated(true);
    setReportPage(1);
    toast.success(`${selectedReport} generated.`);
  };

  /* pagination slices */
  // const authStart = (authPage - 1) * PAGE_SIZE;
  // const authRows = shareholders.slice(authStart, authStart + PAGE_SIZE);
  // const icuStart = (icuPage - 1) * PAGE_SIZE;
  // const icuRows = shareholders.slice(icuStart, icuStart + PAGE_SIZE);
  const allotStart = (allotPage - 1) * PAGE_SIZE;
  const allotRows = shareholders.slice(allotStart, allotStart + PAGE_SIZE);
  const reportStart = (reportPage - 1) * PAGE_SIZE;

  const exceptionShareholders = shareholders.filter(
    (s) => s.holdings / 4 !== Math.floor(s.holdings / 4),
  );
  const reportRows =
    selectedReport === "Exception and Rounding Report"
      ? exceptionShareholders.slice(reportStart, reportStart + PAGE_SIZE)
      : shareholders.slice(reportStart, reportStart + PAGE_SIZE);
  const reportTotal =
    selectedReport === "Exception and Rounding Report"
      ? exceptionShareholders.length
      : shareholders.length;

  /* date range label helper */
  const reportDateLabel = reportDateRange?.from
    ? reportDateRange.to
      ? `${format(reportDateRange.from, "dd MMM yyyy")} – ${format(reportDateRange.to, "dd MMM yyyy")}`
      : format(reportDateRange.from, "dd MMM yyyy")
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonus Issue Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Declare and automatically compute bonus share allotments
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
            ["auth", "Approval"],
            ["icu", "ICU Approval"],
            ["allotment", "Allotment"],
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
                      Please review the declaration and resubmit for approval.
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
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <Card className="mrpsl-card p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="mrpsl-label">Register *</label>
                        <Select
                          value={selectedRegister}
                          onValueChange={(val) =>
                            setSelectedRegister(val ?? "")
                          }
                        >
                          <SelectTrigger className="mrpsl-input">
                            <SelectValue placeholder="Select Register" />
                          </SelectTrigger>
                          <SelectContent>
                            {registerList?.map((r) => (
                              <SelectItem
                                key={r.registerId}
                                value={r.registerId}
                              >
                                {r.registerId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="mrpsl-label">Bonus Name *</label>
                        <Input
                          placeholder="e.g. 2025 Bonus Issue 1-for-4"
                          className="mrpsl-input"
                          value={bonusName}
                          onChange={(e) => setBonusName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="mrpsl-label">Bonus Ratio</label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            value={ratioNumerator}
                            onChange={(e) => setRatioNumerator(e.target.value)}
                            className="w-16 font-mono mrpsl-input"
                          />
                          <span className="text-sm font-medium">for</span>
                          <Input
                            type="number"
                            value={ratioDenominator}
                            onChange={(e) =>
                              setRatioDenominator(e.target.value)
                            }
                            className="w-16 font-mono mrpsl-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="mrpsl-label">Rounding Rule</label>
                        <Select
                          value={roundingRule}
                          onValueChange={(val) =>
                            setRoundingRule(val ?? "down")
                          }
                        >
                          <SelectTrigger className="mrpsl-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ROUND_DOWN">
                              Round Down
                            </SelectItem>
                            <SelectItem value="ROUND_UP">Round Up</SelectItem>
                            <SelectItem value="ROUND_NEAREST">
                              Round to Nearest
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {(
                        [
                          ["Qualification Date *", date1, setDate1],
                          ["Closure Date *", date2, setDate2],
                          ["Allotment Date *", date3, setDate3],
                        ] as const
                      ).map(([lbl, val, setter]) => (
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

                    <div className="space-y-2">
                      <label className="mrpsl-label">Narrative</label>
                      <Textarea
                        placeholder="Additional context..."
                        className="resize-none"
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                      />
                    </div>

                    <Button onClick={handleCompute}>
                      Compute Bonus{" "}
                      {createDeclarationMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="col-span-1">
                <Card className="bg-blue-50 border-blue-200 p-5">
                  <div className="flex items-center gap-2 mb-3 text-blue-800">
                    <Info className="h-5 w-5" />
                    <h3 className="font-semibold">System Rules</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-blue-900/80">
                    <li className="flex gap-2">
                      <span>•</span> Bonus is computed on units held as at
                      Qualification Date
                    </li>
                    <li className="flex gap-2">
                      <span>•</span> Fractional entitlements are rounded down;
                      fractions are pooled into the fractional account
                    </li>
                    <li className="flex gap-2">
                      <span>•</span> Initiator cannot authorise their own
                      declaration
                    </li>
                    <li className="flex gap-2">
                      <span>•</span> Register must be Active — blocked if
                      Inactive or Transaction Disabled
                    </li>
                    <li className="flex gap-2">
                      <span>•</span> Once authorised, records are immutable
                      unless reversed and re-initiated
                    </li>
                  </ul>
                </Card>
              </div>
            </div>

            {computed && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="mrpsl-section-title text-primary">
                      Total New Shares
                    </div>
                    <div className="text-3xl font-mono mt-1 font-bold">
                      4,500,000
                    </div>
                  </Card>
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="mrpsl-section-title text-amber-700">
                      Fractional Shares (To Fractional Acct)
                    </div>
                    <div className="text-3xl font-mono mt-1 font-bold text-amber-600">
                      301.2500
                    </div>
                  </Card>
                </div>

                <Card className="mrpsl-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="p-3">ACCOUNT NO</th>
                        <th className="p-3">HOLDER NAME</th>
                        <th className="p-3 text-right">UNITS AT QUAL DATE</th>
                        <th className="p-3 text-right">BONUS DUE</th>
                        <th className="p-3 text-right">FRACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-[13px]">
                      {shareholders.slice(0, 10).map((s) => {
                        const bonus = Math.floor(s.holdings / 4);
                        const frac = s.holdings / 4 - bonus;
                        return (
                          <tr key={s.id} className="mrpsl-table-row">
                            <td className="p-3">{s.accountNumber}</td>
                            <td className="p-3 font-sans font-medium">
                              {s.firstName} {s.lastName}
                            </td>
                            <td className="p-3 text-right">
                              {s.holdings.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-green-600 font-bold">
                              {bonus.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-amber-600">
                              {frac.toFixed(4)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>

                <div className="flex justify-between items-center pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.info("Downloading entitlement list...")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Excel
                  </Button>
                  <Button size="lg" onClick={handleSubmitForApproval}>
                    Submit for Approval
                    {createDeclarationMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Approval ── */}
          <TabsContent value="auth" className="space-y-4">
            {authReviewing === null ? (
              <Card className="mrpsl-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">DECLARATION REF</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">BONUS NAME</th>
                      <th className="px-4 py-3 text-center">RATIO</th>
                      <th className="px-4 py-3">QUAL DATE</th>
                      <th className="px-4 py-3">ALLOTMENT DATE</th>
                      <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                      <th className="px-4 py-3 text-right">NEW SHARES</th>
                      <th className="px-4 py-3">SUBMITTED BY</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!pendingBatchDismissed ? (
                      declarationList?.map((declaration: any) => (
                        <tr key={declaration?.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                            {declaration?.ref}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {declaration?.registerName}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {declaration?.bonusName}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            {declaration?.ratio}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">
                            {declaration?.qualificationDate}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">
                            {declaration?.allotmentDate}
                          </td>
                          <td className="px-4 py-3 font-mono text-right">
                            {declaration?.totalShareholders?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                            {declaration?.totalBonusShares?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[13px] font-medium">
                              {declaration?.submittedByName}
                            </div>
                            <div className="text-[13px] text-muted-foreground">
                              {declaration?.submittedAt}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                              {declaration?.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAuthPage(1);
                                setAuthReviewing(declaration?.id);
                              }}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No pending approvals
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            ) : isActiveReviewLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mx-auto" />
                <p className="text-base text-muted-foreground animate-pulse">
                  Loading declaration details...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={() => {
                      setAuthReviewing(null);
                      setAuthComment("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Approval Queue
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {activeReview?.ref}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · {activeReview?.registerName} · {activeReview?.bonusName}
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                    {activeReview?.status}
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

                {/* Declaration details */}
                <DeclDetailCard decl={activeReview} />

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Eligible Shareholders",
                      value: activeReview?.totalShareholders?.toLocaleString(),
                      color: "text-foreground",
                    },
                    {
                      label: "Total New Shares",
                      value: activeReview?.totalBonusShares?.toLocaleString(),
                      color: "text-green-700",
                    },
                    {
                      label: "Fractional Shares",
                      value: "301.2500",
                      color: "text-amber-600",
                    },
                    {
                      label: "Total Shares After Issue",
                      value: "18,000,301",
                      color: "text-foreground",
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
                      <BonusTableHead />
                      <tbody className="divide-y">
                        {isEntitlementLoading ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-50" />
                            </td>
                          </tr>
                        ) : (
                          <EntitlementTableRows
                            rows={entitlementList}
                            startIdx={0}
                          />
                        )}
                      </tbody>
                      <EntitlementTfoot
                        rows={entitlementList}
                        total={entitlementTotal}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={authPage}
                    total={entitlementTotal}
                    onPageChange={setAuthPage}
                  />
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
                    Reject Declaration
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
            {icuReviewing === null ? (
              <Card className="mrpsl-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">DECLARATION REF</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">BONUS NAME</th>
                      <th className="px-4 py-3 text-center">RATIO</th>
                      <th className="px-4 py-3">QUAL DATE</th>
                      <th className="px-4 py-3">ALLOTMENT DATE</th>
                      <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                      <th className="px-4 py-3 text-right">NEW SHARES</th>
                      <th className="px-4 py-3">OPS APPROVAL</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="mrpsl-table-row">
                      <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                        {MOCK_DECL.ref}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {MOCK_DECL.register}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {MOCK_DECL.bonusName}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {MOCK_DECL.ratio}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {MOCK_DECL.qualDate}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {MOCK_DECL.allotDate}
                      </td>
                      <td className="px-4 py-3 font-mono text-right">
                        {shareholders.length.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-green-700 font-semibold">
                        4,500,000
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-medium">
                          Adaeze Okafor
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                          Ops Manager · 01 May 2026, 11:20
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                          Awaiting ICU
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setIcuPage(1);
                            setIcuReviewing(MOCK_DECL.ref);
                          }}
                        >
                          ICU Review
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            ) : isActiveReviewLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mx-auto" />
                <p className="text-base text-muted-foreground animate-pulse">
                  Loading declaration details...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 -ml-2"
                    onClick={() => {
                      setIcuReviewing(null);
                      setIcuComment("");
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to ICU Queue
                  </Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <span className="font-mono text-sm font-semibold">
                    {activeReview?.ref}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    · {activeReview?.registerName} · {activeReview?.bonusName}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                    {activeReview?.status}
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

                {/* Ops approval audit trail */}
                <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Operations Approval Record
                  </p>
                  <div className="flex items-center gap-8 text-sm flex-wrap">
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
                        01 May 2026, 11:20:44
                      </div>
                    </div>
                    <div>
                      <div className="mrpsl-section-title">Comment</div>
                      <div className="text-muted-foreground mt-0.5 italic">
                        &quot;Computation verified against register snapshot.
                        Approved for ICU.&quot;
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Declaration details */}
                <DeclDetailCard decl={activeReview} />

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Eligible Shareholders",
                      value: activeReview?.totalShareholders?.toLocaleString(),
                      color: "text-foreground",
                    },
                    {
                      label: "Total New Shares",
                      value: activeReview?.totalBonusShares?.toLocaleString(),
                      color: "text-green-700",
                    },
                    {
                      label: "Fractional Shares",
                      value: "301.2500",
                      color: "text-amber-600",
                    },
                    {
                      label: "Total Shares After Issue",
                      value: "18,000,301",
                      color: "text-foreground",
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
                      <BonusTableHead />
                      <tbody className="divide-y">
                        {isEntitlementLoading ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-50" />
                            </td>
                          </tr>
                        ) : (
                          <EntitlementTableRows
                            rows={entitlementList}
                            startIdx={0}
                          />
                        )}
                      </tbody>
                      <EntitlementTfoot
                        rows={entitlementList}
                        total={entitlementTotal}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={icuPage}
                    total={entitlementTotal}
                    onPageChange={setIcuPage}
                  />
                </Card>

                {/* Approve / Return to Ops */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={() =>
                      setApprovalModal({ action: "reject", section: "icu" })
                    }
                  >
                    Return to Ops
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={() =>
                      setApprovalModal({ action: "approve", section: "icu" })
                    }
                  >
                    ICU Approve &amp; Clear for Allotment
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Allotment ── */}
          <TabsContent value="allotment" className="space-y-6">
            {/* ICU Approval audit card */}
            <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
              <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                ICU Approval Record
              </p>
              <div className="grid grid-cols-4 gap-x-8 gap-y-2 text-sm">
                <div>
                  <div className="mrpsl-section-title">Declaration Ref</div>
                  <div className="font-mono text-[13px] mt-0.5">
                    {MOCK_DECL.ref}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Register</div>
                  <div className="font-semibold mt-0.5">
                    {MOCK_DECL.register}
                  </div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Bonus Ratio</div>
                  <div className="font-mono mt-0.5">{MOCK_DECL.ratio}</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">Allotment Date</div>
                  <div className="font-mono mt-0.5">{MOCK_DECL.allotDate}</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">ICU Approved By</div>
                  <div className="font-medium mt-0.5">Ngozi Adeyemi</div>
                </div>
                <div>
                  <div className="mrpsl-section-title">ICU Approval Date</div>
                  <div className="font-mono mt-0.5">01 May 2026, 14:45</div>
                </div>
                <div className="col-span-2">
                  <div className="mrpsl-section-title">Status</div>
                  <div className="mt-0.5">
                    <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                      Cleared for Allotment
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <DeclDetailCard decl={activeReview} />

            {!allotmentProcessed ? (
              <>
                {/* Pre-allotment preview stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">
                      Eligible Shareholders
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1">
                      {shareholders.length.toLocaleString()}
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">Total New Shares</div>
                    <div className="text-2xl font-bold font-mono mt-1 text-green-600">
                      4,500,000
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">
                      Certificated Holders
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1 text-blue-600">
                      {Math.ceil(shareholders.length * 0.35).toLocaleString()}
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">Electronic (CSCS)</div>
                    <div className="text-2xl font-bold font-mono mt-1 text-purple-600">
                      {Math.floor(shareholders.length * 0.65).toLocaleString()}
                    </div>
                  </Card>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.info("Downloading pre-allotment report…")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> Preview Report
                  </Button>
                  <Button size="lg" onClick={handleProcessAllotment}>
                    Process Allotment
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Post-allotment stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="mrpsl-card p-4 border-t-4 border-t-green-500">
                    <div className="mrpsl-section-title">
                      Shareholders Allotted
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1 text-green-600">
                      {shareholders.length.toLocaleString()}
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4 border-t-4 border-t-blue-500">
                    <div className="mrpsl-section-title">New Shares Issued</div>
                    <div className="text-2xl font-bold font-mono mt-1 text-blue-600">
                      4,500,000
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4 border-t-4 border-t-purple-500">
                    <div className="mrpsl-section-title">
                      Previous Stock in Issue
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1 text-purple-600">
                      18,000,000
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4 border-t-4 border-t-amber-500">
                    <div className="mrpsl-section-title">
                      New Stock in Issue
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
                      22,500,000
                    </div>
                  </Card>
                </div>

                {/* Certificate breakdown */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">
                      Paper Certificates Created
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1">
                      {Math.ceil(shareholders.length * 0.35).toLocaleString()}
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">
                      CSCS Entries Updated
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1">
                      {Math.floor(shareholders.length * 0.65).toLocaleString()}
                    </div>
                  </Card>
                  <Card className="mrpsl-card p-4">
                    <div className="mrpsl-section-title">
                      Fractional Shares Rounded
                    </div>
                    <div className="text-2xl font-bold font-mono mt-1 text-amber-600">
                      {exceptionShareholders.length.toLocaleString()}
                    </div>
                  </Card>
                </div>

                {/* Allotment table */}
                <Card className="mrpsl-card overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/10 flex items-center gap-3">
                    <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground flex-1">
                      Allotment List
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("Downloading allotment list…")}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info("Printing…")}
                    >
                      <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <BonusTableHead />
                      <tbody className="divide-y">
                        <BonusTableRows
                          rows={allotRows}
                          startIdx={allotStart}
                        />
                      </tbody>
                      <BonusTfoot
                        rows={allotRows}
                        total={shareholders.length}
                      />
                    </table>
                  </div>
                  <PaginationBar
                    page={allotPage}
                    total={shareholders.length}
                    onPageChange={setAllotPage}
                  />
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEmailPreviewOpen(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Email Shareholders
                  </Button>
                </div>
              </>
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
                {BONUS_REPORT_TYPES.map((r) => (
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
              <div className="flex gap-6 mb-1.5">
                <label className="mrpsl-label w-64">Register</label>
                <label className="mrpsl-label w-64">Date Range</label>
              </div>
              <div className="flex items-center gap-3">
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
                <Popover
                  open={reportCalOpen}
                  onOpenChange={(v) => {
                    if (!v && reportDateRange?.from && !reportDateRange?.to)
                      return;
                    setReportCalOpen(v);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mrpsl-input w-64 justify-start gap-2 px-3 font-normal text-sm",
                        !reportDateLabel && "text-muted-foreground",
                      )}
                    >
                      <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">
                        {reportDateLabel ?? "Select date range"}
                      </span>
                      {reportDateRange && (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportDateRange(undefined);
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
                      selected={reportDateRange}
                      onSelect={(r) => {
                        setReportDateRange(r);
                        if (r?.from && r?.to) setReportCalOpen(false);
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
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
                    {selectedReport} — {reportTotal.toLocaleString()} records
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

                {selectedReport === "Summary of Bonus Shares Issued" ? (
                  /* Summary table — grouped by broker/category */
                  <Card className="mrpsl-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-3">STOCKBROKER</th>
                            <th className="px-4 py-3 text-right">
                              ELIGIBLE SHs
                            </th>
                            <th className="px-4 py-3 text-right">
                              UNITS AT QUAL DATE
                            </th>
                            <th className="px-4 py-3 text-right">
                              BONUS SHARES ISSUED
                            </th>
                            <th className="px-4 py-3 text-right">
                              FRACTIONAL UNITS
                            </th>
                            <th className="px-4 py-3 text-right">
                              % OF TOTAL NEW SHARES
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-[13px] font-mono">
                          {[
                            "Meristem Securities",
                            "Zenith Securities",
                            "ARM Securities",
                            "CardinalStone",
                            "Stanbic IBTC",
                            "Afrinvest",
                            "Vetiva Capital",
                          ].map((name, i) => {
                            const shs =
                              Math.floor(shareholders.length / 7) +
                              (i % 3) * 12;
                            const units = shs * 4000;
                            const bonus = Math.floor(units / 4);
                            const frac = (units / 4 - bonus).toFixed(4);
                            const pct = ((bonus / 4500000) * 100).toFixed(2);
                            return (
                              <tr key={name} className="mrpsl-table-row">
                                <td className="px-4 py-2.5 font-sans font-medium">
                                  {name}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {shs.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {units.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right text-green-700 font-bold">
                                  {bonus.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right text-amber-600">
                                  {frac}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {pct}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              TOTALS
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {shareholders.length.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {(shareholders.length * 4000).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-700">
                              4,500,000
                            </td>
                            <td className="px-4 py-2.5 text-right text-amber-600">
                              301.2500
                            </td>
                            <td className="px-4 py-2.5 text-right">100.00%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </Card>
                ) : selectedReport === "Exception and Rounding Report" ? (
                  /* Exception report — only shareholders with fractions */
                  <Card className="mrpsl-card overflow-hidden">
                    <div className="p-3 border-b bg-amber-50 text-[13px] font-semibold text-amber-800">
                      Showing {exceptionShareholders.length.toLocaleString()}{" "}
                      shareholders with fractional entitlements — fractions
                      pooled to fractional account.
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-2.5">#</th>
                            <th className="px-4 py-2.5">ACCOUNT NO</th>
                            <th className="px-4 py-2.5">HOLDER NAME</th>
                            <th className="px-4 py-2.5 text-right">
                              UNITS AT QUAL DATE
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              EXACT ENTITLEMENT
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              BONUS ISSUED (ROUNDED)
                            </th>
                            <th className="px-4 py-2.5 text-right">
                              FRACTION POOLED
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono">
                          {reportRows.map((s: any, i: number) => {
                            const exact = s.holdings / 4;
                            const rounded = Math.floor(exact);
                            const frac = exact - rounded;
                            return (
                              <tr key={s.id} className="mrpsl-table-row">
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {reportStart + i + 1}
                                </td>
                                <td className="px-4 py-2.5">
                                  {s.accountNumber}
                                </td>
                                <td className="px-4 py-2.5 font-sans font-medium">
                                  {s.firstName} {s.lastName}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {s.holdings.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {exact.toFixed(4)}
                                </td>
                                <td className="px-4 py-2.5 text-right text-green-600 font-bold">
                                  {rounded.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right text-amber-600">
                                  {frac.toFixed(4)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-2.5 text-right text-muted-foreground"
                            >
                              TOTALS ({reportTotal.toLocaleString()} exception
                              shareholders)
                            </td>
                            <td className="px-4 py-2.5 text-right text-green-600">
                              {reportRows
                                .reduce(
                                  (a: number, s: any) =>
                                    a + Math.floor(s.holdings / 4),
                                  0,
                                )
                                .toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-amber-600">
                              {reportRows
                                .reduce(
                                  (a: number, s: any) =>
                                    a +
                                    (s.holdings / 4 -
                                      Math.floor(s.holdings / 4)),
                                  0,
                                )
                                .toFixed(4)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <PaginationBar
                      page={reportPage}
                      total={reportTotal}
                      onPageChange={setReportPage}
                    />
                  </Card>
                ) : (
                  /* Bonus Entitlement Register & Shareholder Bonus Allotment List */
                  <Card className="mrpsl-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <BonusTableHead />
                        <tbody className="divide-y">
                          <BonusTableRows
                            rows={reportRows}
                            startIdx={reportStart}
                          />
                        </tbody>
                        <BonusTfoot rows={reportRows} total={reportTotal} />
                      </table>
                    </div>
                    <PaginationBar
                      page={reportPage}
                      total={reportTotal}
                      onPageChange={setReportPage}
                    />
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Outreach modals ── */}
      <EmailPreviewModal
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        offerType="bonus"
        companyName={MOCK_DECL.register}
        offerName={MOCK_DECL.bonusName}
        ratio={MOCK_DECL.ratio}
        allotDate={MOCK_DECL.allotDate}
        contactEmail="BonusIssue@meristemregistrars.com"
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
              {approvalModal?.section === "ops"
                ? approvalModal.action === "approve"
                  ? "Approve Declaration"
                  : "Reject Declaration"
                : approvalModal?.action === "approve"
                  ? "ICU Approve Declaration"
                  : "Return to Operations"}
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
                      ? handleAuthApprove("ops")
                      : handleAuthReject();
                  } else {
                    approvalModal?.action === "approve"
                      ? handleAuthApprove("icu")
                      : handleIcuReturn();
                  }
                }}
              >
                Confirm{" "}
                {approvalModal?.action === "approve" ? "Approval" : "Rejection"}
                {approveDeclarationMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
