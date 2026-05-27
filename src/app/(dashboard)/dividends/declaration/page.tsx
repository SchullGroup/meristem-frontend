"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  Eye,
  Printer,
  RotateCcw,
  AlertCircle,
  X,
  Pencil,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import type { DividendDeclaration } from "@/lib/types";

export default function DeclarationPage() {
  const { currentUser, registers, shareholders, dividendDeclarations } =
    useStore();
  const [activeTab, setActiveTab] = useState("new");

  const [selectedRegister, setSelectedRegister] = useState("");
  const [divType, setDivType] = useState("FINAL");
  const [rate, setRate] = useState<number | "">("");
  const [date1, setDate1] = useState<Date>();
  const [date2, setDate2] = useState<Date>();
  const [date3, setDate3] = useState<Date>();
  const [fractional, setFractional] = useState(false);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [successVersion, setSuccessVersion] = useState<number | null>(null);
  const [versionCounter, setVersionCounter] = useState(1);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDecl, setSelectedDecl] = useState<DividendDeclaration | null>(
    null,
  );
  const [sheetComment, setSheetComment] = useState("");
  const [rejectedDecl, setRejectedDecl] = useState<{
    ref: string;
    comment: string;
  } | null>(null);
  const [editingRejected, setEditingRejected] = useState<{
    ref: string;
    comment: string;
  } | null>(null);

  const [icuApprovalOpen, setIcuApprovalOpen] = useState(false);
  const [selectedIcuDecl, setSelectedIcuDecl] =
    useState<DividendDeclaration | null>(null);
  const [icuComment, setIcuComment] = useState("");
  const [icuApprovedIds, setIcuApprovedIds] = useState<Set<string>>(new Set());

  const [pendingSelIds, setPendingSelIds] = useState<Set<string>>(new Set());
  const [icuSelIds, setIcuSelIds] = useState<Set<string>>(new Set());
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [batchComment, setBatchComment] = useState("");
  const [batchTarget, setBatchTarget] = useState<"pending" | "icu" | null>(
    null,
  );

  const register = registers.find((r) => r.id === selectedRegister);
  const stockToday = register?.stockToday || 0;
  const rateNum = typeof rate === "number" ? rate : 0;
  const grossLiability = rateNum * stockToday;
  const wht = grossLiability * 0.1;
  const netLiability = grossLiability - wht;

  const registerBlocked =
    register?.status === "INACTIVE" ||
    register?.status === "TRANSACTION_DISABLED";

  const computeTier = (amount: number) => {
    if (amount <= 500000) return 1;
    if (amount <= 5000000) return 2;
    if (amount <= 50000000) return 3;
    return 4;
  };

  const tier = computeTier(grossLiability);

  const getTierInfo = (t: number) => {
    switch (t) {
      case 1:
        return {
          color: "bg-green-50 border-green-200 text-green-800",
          label: "Auto-Approval",
          req: "None",
        };
      case 2:
        return {
          color: "bg-blue-50 border-blue-200 text-blue-800",
          label: "Manager Approval Required",
          req: "Ops Manager",
        };
      case 3:
        return {
          color: "bg-amber-50 border-amber-200 text-amber-800",
          label: "Compliance Approval Required",
          req: "Internal Control (ICU)",
        };
      default:
        return {
          color: "bg-red-50 border-red-200 text-red-800",
          label: "Board Approval Required",
          req: "MD + CEO dual sign-off",
        };
    }
  };

  const tierInfo = getTierInfo(tier);

  const getTierBadge = (t: number) => {
    switch (t) {
      case 1:
        return "bg-green-100 text-green-800 border-0";
      case 2:
        return "bg-blue-100 text-blue-800 border-0";
      case 3:
        return "bg-amber-100 text-amber-800 border-0";
      default:
        return "bg-red-100 text-red-800 border-0";
    }
  };

  const formatNaira = (num: number) => {
    if (num >= 1_000_000_000) return `₦${(num / 1_000_000_000).toFixed(2)}B`;
    return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = () => {
    if (registerBlocked) {
      toast.error(
        "Cannot declare dividend — register is Inactive or Transaction Disabled.",
      );
      return;
    }
    if (grossLiability > (currentUser?.divTransactionLimit || 0)) {
      toast.error("Transaction value exceeds your authorised limit.");
      return;
    }
    const v = versionCounter;
    setVersionCounter(v + 1);
    setSuccessVersion(v);
    setEditingRejected(null);
    setActiveTab("auth");
  };

  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 10;
  const previewStart = (previewPage - 1) * PREVIEW_PAGE_SIZE;
  const previewPagedRows = shareholders.slice(
    previewStart,
    previewStart + PREVIEW_PAGE_SIZE,
  );
  const previewTotalPages = Math.max(
    1,
    Math.ceil(shareholders.length / PREVIEW_PAGE_SIZE),
  );

  const allTotals = shareholders.reduce(
    (acc, s) => {
      const g = s.holdings * rateNum;
      const w = g * 0.1;
      return {
        units: acc.units + s.holdings,
        gross: acc.gross + g,
        wht: acc.wht + w,
        net: acc.net + (g - w),
      };
    },
    { units: 0, gross: 0, wht: 0, net: 0 },
  );

  const pendingDecs = dividendDeclarations.filter((d) =>
    d.status.startsWith("PENDING"),
  );
  const icuDecsBase = dividendDeclarations.filter(
    (d) =>
      d.tier >= 3 &&
      d.status.startsWith("PENDING") &&
      !icuApprovedIds.has(d.id),
  );
  const pendingDecsPg = usePagination(pendingDecs);
  const icuDecsPg = usePagination(icuDecsBase);
  const historyDecsPg = usePagination(dividendDeclarations);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-600";
      case "AUTHORIZED":
        return "bg-blue-100 text-blue-800";
      case "PAID":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  const formatStatus = (s: string) =>
    s
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  function togglePendingSel(id: string) {
    setPendingSelIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function togglePendingAll(ids: string[]) {
    setPendingSelIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }
  function toggleIcuSel(id: string) {
    setIcuSelIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleIcuAll(ids: string[]) {
    setIcuSelIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }
  function handleBatchApprove(target: "pending" | "icu") {
    const ids = target === "pending" ? pendingSelIds : icuSelIds;
    toast.success(
      `${ids.size} declaration${ids.size !== 1 ? "s" : ""} approved.`,
    );
    if (target === "pending") setPendingSelIds(new Set());
    else setIcuSelIds(new Set());
  }
  function openBatchReject(target: "pending" | "icu") {
    setBatchTarget(target);
    setBatchComment("");
    setBatchRejectOpen(true);
  }
  function handleBatchReject() {
    if (!batchComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    const ids = batchTarget === "pending" ? pendingSelIds : icuSelIds;
    toast.error(
      `${ids.size} declaration${ids.size !== 1 ? "s" : ""} rejected.`,
    );
    if (batchTarget === "pending") setPendingSelIds(new Set());
    else setIcuSelIds(new Set());
    setBatchComment("");
    setBatchRejectOpen(false);
    setBatchTarget(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dividend Declaration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Declare, compute, and route dividends through the tiered approval
          workflow
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Declaration
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
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Declaration History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* ── New Declaration ── */}
          <TabsContent value="new">
            {["ENQUIRY_ONLY", "AUDIT_REVIEWER"].includes(
              currentUser?.roles[0] || "",
            ) ? (
              <Card className="mrpsl-card p-12 text-center text-muted-foreground">
                You do not have permission to initiate dividend declarations.
              </Card>
            ) : (
              <div className="space-y-6">
                {rejectedDecl && (
                  <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800">
                          Declaration Rejected — Ref: {rejectedDecl.ref}
                        </p>
                        <p className="text-[13px] text-red-700 mt-0.5">
                          Approver comment:{" "}
                          {rejectedDecl.comment || "No comment provided."}
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-1">
                          Please review and resubmit the declaration.
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                            onClick={() => {
                              setEditingRejected(rejectedDecl);
                              setRejectedDecl(null);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit &amp;
                            Resubmit
                          </Button>
                        </div>
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

                {editingRejected && (
                  <Card className="mrpsl-card p-4 border-l-4 border-l-amber-500 bg-amber-50/40 border-amber-200">
                    <div className="flex items-start gap-3">
                      <Pencil className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">
                          Editing Rejected Declaration — Ref:{" "}
                          {editingRejected.ref}
                        </p>
                        <p className="text-[13px] text-amber-700 mt-0.5">
                          Modify the values below and click{" "}
                          <strong>Submit Declaration</strong> to resubmit for
                          approval.
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingRejected(null)}
                        className="rounded-full hover:bg-amber-100 p-0.5"
                      >
                        <X className="h-3.5 w-3.5 text-amber-600" />
                      </button>
                    </div>
                  </Card>
                )}

                {successVersion !== null && (
                  <Card className="mrpsl-card p-4 border-l-4 border-l-green-500 bg-green-50/40 border-green-200">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">
                          Declaration submitted. Version {successVersion}{" "}
                          created. Awaiting authoriser sign-off.
                        </p>
                      </div>
                      <button
                        onClick={() => setSuccessVersion(null)}
                        className="rounded-full hover:bg-green-100 p-0.5"
                      >
                        <X className="h-3.5 w-3.5 text-green-600" />
                      </button>
                    </div>
                  </Card>
                )}

                {registerBlocked && selectedRegister && (
                  <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                      <p className="text-sm font-semibold text-red-800">
                        Declaration blocked — register is Inactive or
                        Transaction Disabled
                      </p>
                    </div>
                  </Card>
                )}

                <Card className="mrpsl-card p-6 space-y-6">
                  {/* Row 1: Register / Type / Currency */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="mrpsl-label">Register *</label>
                      <Select
                        value={selectedRegister}
                        onValueChange={(v) => setSelectedRegister(v || "")}
                      >
                        <SelectTrigger className="mrpsl-input">
                          <SelectValue placeholder="Select Active Register" />
                        </SelectTrigger>
                        <SelectContent>
                          {registers
                            .filter((r) => r.status === "ACTIVE")
                            .map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.symbol}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {register && (
                        <p className="text-[13px] bg-muted/60 p-1.5 rounded text-muted-foreground">
                          Type: {register.registerType} · Shareholders:{" "}
                          {register.shareholdersToday.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="mrpsl-label">Dividend Type *</label>
                      <Select
                        value={divType}
                        onValueChange={(v) => setDivType(v || "")}
                      >
                        <SelectTrigger className="mrpsl-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FINAL">Final</SelectItem>
                          <SelectItem value="INTERIM">Interim</SelectItem>
                          <SelectItem value="SPECIAL">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="mrpsl-label">Currency</label>
                      <Select defaultValue="NGN">
                        <SelectTrigger className="mrpsl-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN">NGN (₦)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: Rate + Liability Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="mrpsl-label">
                          Dividend Rate (₦ per share) *
                        </label>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
                          className="mrpsl-input text-lg tabular"
                          value={rate}
                          onChange={(e) => {
                            setRate(
                              e.target.value ? Number(e.target.value) : "",
                            );
                            setPreviewPage(1);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={fractional}
                          onCheckedChange={setFractional}
                        />
                        <label className="text-sm font-medium text-muted-foreground">
                          Fractional Register (Yes/No)
                        </label>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 border border-border/60 grid grid-cols-3 gap-4">
                      <div>
                        <div className="mrpsl-section-title">
                          Gross Liability
                        </div>
                        <div className="text-xl font-bold tabular mt-1">
                          {formatNaira(grossLiability)}
                        </div>
                      </div>
                      <div>
                        <div className="mrpsl-section-title">WHT (10%)</div>
                        <div className="text-xl font-bold tabular mt-1 text-amber-600">
                          {formatNaira(wht)}
                        </div>
                      </div>
                      <div>
                        <div className="mrpsl-section-title">Net Payout</div>
                        <div className="text-xl font-bold tabular mt-1 text-green-700">
                          {formatNaira(netLiability)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tier Banner */}
                  {grossLiability > 0 && (
                    <div
                      className={`p-3 rounded-lg border ${tierInfo.color} text-center animate-in fade-in zoom-in`}
                    >
                      <span className="font-bold tracking-widest text-sm uppercase">
                        TIER {tier} — {tierInfo.label}
                      </span>
                      <p className="text-[13px] mt-0.5 opacity-80">
                        Requires: {tierInfo.req}
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Qualification Date *",
                        date: date1,
                        setDate: setDate1,
                      },
                      {
                        label: "Closure Date *",
                        date: date2,
                        setDate: setDate2,
                      },
                      {
                        label: "Payment Date *",
                        date: date3,
                        setDate: setDate3,
                      },
                    ].map(({ label, date, setDate }) => (
                      <div key={label} className="space-y-2">
                        <label className="mrpsl-label">{label}</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full mrpsl-input justify-start text-left font-normal"
                            >
                              {date ? (
                                format(date, "PPP")
                              ) : (
                                <span className="text-muted-foreground">
                                  Pick a date
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>

                  {/* Narrative */}
                  <div className="space-y-2">
                    <label className="mrpsl-label">Narrative</label>
                    <Textarea
                      placeholder="Add notes or context for approvers..."
                      className="resize-none"
                    />
                  </div>

                  {/* Rules */}
                  <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
                    <ul className="space-y-2 text-sm text-primary/80">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" />
                        Dividend computed on units held as at Qualification Date
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" />
                        Initiator cannot authorise their own declaration
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" />
                        Once authorised, computation results are immutable
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-4 w-4 flex items-center justify-center shrink-0 text-[13px]">
                          ●
                        </span>
                        Register status:{" "}
                        <strong className="ml-1">
                          {register?.status || "None Selected"}
                        </strong>
                      </li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewModalOpen(true)}
                      disabled={!rate || !selectedRegister}
                    >
                      Preview Liability Table
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => {
                        handleSubmit();
                      }}
                      disabled={!rate || !selectedRegister || registerBlocked}
                    >
                      {editingRejected
                        ? "Resubmit Declaration"
                        : "Submit Declaration"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Pending Approval ── */}
          <TabsContent value="auth">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {pendingDecsPg.total} pending declaration
                {pendingDecsPg.total !== 1 ? "s" : ""}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => toast.info("Downloading...")}
              >
                <Download className="h-4 w-4" /> Download Records
              </Button>
            </div>
            <div className="space-y-4">
              {pendingSelIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-medium text-primary">
                    {pendingSelIds.size} declaration
                    {pendingSelIds.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => openBatchReject("pending")}
                    >
                      Reject Selected
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleBatchApprove("pending")}
                    >
                      Approve Selected
                    </Button>
                  </div>
                </div>
              )}
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <Checkbox
                            checked={
                              pendingDecsPg.paged.length > 0 &&
                              pendingDecsPg.paged.every((d) =>
                                pendingSelIds.has(d.id),
                              )
                            }
                            onCheckedChange={() =>
                              togglePendingAll(
                                pendingDecsPg.paged.map((d) => d.id),
                              )
                            }
                          />
                        </th>
                        <th className="px-4 py-3">PAYMENT NO</th>
                        <th className="px-4 py-3">REGISTER</th>
                        <th className="px-4 py-3">TYPE</th>
                        <th className="px-4 py-3">RATE</th>
                        <th className="px-4 py-3">GROSS LIABILITY</th>
                        <th className="px-4 py-3">TIER</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pendingDecsPg.paged.map((d) => {
                        const reg = registers.find(
                          (r) => r.id === d.registerId,
                        );
                        return (
                          <tr
                            key={d.id}
                            className={`mrpsl-table-row ${pendingSelIds.has(d.id) ? "bg-primary/5" : ""}`}
                          >
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={pendingSelIds.has(d.id)}
                                onCheckedChange={() => togglePendingSel(d.id)}
                              />
                            </td>
                            <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                              {d.paymentNumber}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {reg?.symbol}
                            </td>
                            <td className="px-4 py-3">{d.dividendType}</td>
                            <td className="px-4 py-3 text-right tabular">
                              ₦{d.rate.toFixed(4)}
                            </td>
                            <td className="px-4 py-3 text-right tabular font-bold">
                              {formatNaira(d.grossLiability)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`${getTierBadge(d.tier)} text-[13px]`}
                              >
                                Tier {d.tier}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`border-0 text-[13px] ${statusBadgeClass(d.status)}`}
                              >
                                {formatStatus(d.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedDecl(d);
                                  setSheetOpen(true);
                                }}
                              >
                                Review &amp; Decide
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {pendingDecsPg.total === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-12 text-center text-muted-foreground"
                          >
                            No pending declarations.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
              <TablePagination
                page={pendingDecsPg.page}
                pageSize={pendingDecsPg.pageSize}
                totalPages={pendingDecsPg.totalPages}
                from={pendingDecsPg.from}
                to={pendingDecsPg.to}
                total={pendingDecsPg.total}
                onPageChange={pendingDecsPg.setPage}
                onPageSizeChange={pendingDecsPg.setPageSize}
              />
            </div>
          </TabsContent>

          {/* ── ICU Approval ── */}
          <TabsContent value="icu">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {icuDecsPg.total} declaration{icuDecsPg.total !== 1 ? "s" : ""}{" "}
                pending ICU review
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => toast.info("Downloading...")}
              >
                <Download className="h-4 w-4" /> Download Records
              </Button>
            </div>
            <div className="space-y-4">
              {icuSelIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-medium text-primary">
                    {icuSelIds.size} declaration
                    {icuSelIds.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => openBatchReject("icu")}
                    >
                      Reject Selected
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleBatchApprove("icu")}
                    >
                      Approve Selected
                    </Button>
                  </div>
                </div>
              )}
              <Card className="mrpsl-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <Checkbox
                            checked={
                              icuDecsPg.paged.length > 0 &&
                              icuDecsPg.paged.every((d) => icuSelIds.has(d.id))
                            }
                            onCheckedChange={() =>
                              toggleIcuAll(icuDecsPg.paged.map((d) => d.id))
                            }
                          />
                        </th>
                        <th className="px-4 py-3">PAYMENT NO</th>
                        <th className="px-4 py-3">REGISTER</th>
                        <th className="px-4 py-3">TYPE</th>
                        <th className="px-4 py-3">RATE</th>
                        <th className="px-4 py-3">GROSS LIABILITY</th>
                        <th className="px-4 py-3">TIER</th>
                        <th className="px-4 py-3">STATUS</th>
                        <th className="px-4 py-3">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {icuDecsPg.paged.map((d) => {
                        const reg = registers.find(
                          (r) => r.id === d.registerId,
                        );
                        return (
                          <tr
                            key={d.id}
                            className={`mrpsl-table-row ${icuSelIds.has(d.id) ? "bg-primary/5" : ""}`}
                          >
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={icuSelIds.has(d.id)}
                                onCheckedChange={() => toggleIcuSel(d.id)}
                              />
                            </td>
                            <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                              {d.paymentNumber}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {reg?.symbol}
                            </td>
                            <td className="px-4 py-3">{d.dividendType}</td>
                            <td className="px-4 py-3 text-right tabular">
                              ₦{d.rate.toFixed(4)}
                            </td>
                            <td className="px-4 py-3 text-right tabular font-bold">
                              {formatNaira(d.grossLiability)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`${getTierBadge(d.tier)} text-[13px]`}
                              >
                                Tier {d.tier}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={`border-0 text-[13px] ${statusBadgeClass(d.status)}`}
                              >
                                {formatStatus(d.status)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedIcuDecl(d);
                                  setIcuApprovalOpen(true);
                                }}
                              >
                                Review &amp; Decide
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {icuDecsPg.total === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-12 text-center text-muted-foreground"
                          >
                            No declarations pending ICU approval.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
              <TablePagination
                page={icuDecsPg.page}
                pageSize={icuDecsPg.pageSize}
                totalPages={icuDecsPg.totalPages}
                from={icuDecsPg.from}
                to={icuDecsPg.to}
                total={icuDecsPg.total}
                onPageChange={icuDecsPg.setPage}
                onPageSizeChange={icuDecsPg.setPageSize}
              />
            </div>
          </TabsContent>

          {/* ── Declaration History ── */}
          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">TYPE</th>
                      <th className="px-4 py-3">QUAL DATE</th>
                      <th className="px-4 py-3">RATE (₦)</th>
                      <th className="px-4 py-3">GROSS LIABILITY</th>
                      <th className="px-4 py-3">TIER</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyDecsPg.paged.map((d) => {
                      const reg = registers.find((r) => r.id === d.registerId);
                      return (
                        <tr key={d.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                            {d.paymentNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {reg?.symbol}
                          </td>
                          <td className="px-4 py-3">
                            {d.dividendType === "FINAL"
                              ? "Final"
                              : d.dividendType === "INTERIM"
                                ? "Interim"
                                : "Special"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-[13px]">
                            {d.qualificationDate
                              ? format(
                                  new Date(d.qualificationDate),
                                  "dd MMM yyyy",
                                )
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {d.rate.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">
                            {formatNaira(d.grossLiability)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`${getTierBadge(d.tier)} text-[13px]`}
                            >
                              Tier {d.tier}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-[13px] ${statusBadgeClass(d.status)}`}
                            >
                              {formatStatus(d.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDecl(d);
                                    setSheetOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast.success("Warrant advice printed")
                                  }
                                >
                                  <Printer className="mr-2 h-4 w-4" /> Print
                                  Warrant Advice
                                </DropdownMenuItem>
                                {d.status === "DRAFT" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() =>
                                        toast.success("Declaration recalled")
                                      }
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />{" "}
                                      Recall Declaration
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {d.status === "REJECTED" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.success(
                                          "Resubmitted for approval",
                                        )
                                      }
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />{" "}
                                      Re-submit
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                    {historyDecsPg.total === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No declaration history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
            <TablePagination
              page={historyDecsPg.page}
              pageSize={historyDecsPg.pageSize}
              totalPages={historyDecsPg.totalPages}
              from={historyDecsPg.from}
              to={historyDecsPg.to}
              total={historyDecsPg.total}
              onPageChange={historyDecsPg.setPage}
              onPageSizeChange={historyDecsPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Batch Reject Dialog ── */}
      <Dialog open={batchRejectOpen} onOpenChange={setBatchRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Selected Declarations</DialogTitle>
            <DialogDescription>
              {batchTarget === "pending" ? pendingSelIds.size : icuSelIds.size}{" "}
              declaration
              {(batchTarget === "pending"
                ? pendingSelIds.size
                : icuSelIds.size) !== 1
                ? "s"
                : ""}{" "}
              will be rejected and returned to the submitter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-8 pb-8">
            <div className="space-y-2">
              <label className="mrpsl-label">Rejection Comment *</label>
              <Textarea
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                placeholder="Comment is required for rejection..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBatchRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preview Liability Modal ── */}
      <Dialog
        open={previewModalOpen}
        onOpenChange={(open) => {
          setPreviewModalOpen(open);
          if (!open) setPreviewPage(1);
        }}
      >
        <DialogContent className="max-w-[min(95vw,1140px)] flex flex-col max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="pl-6 pr-14 pt-5 pb-4 border-b shrink-0">
            <DialogTitle>Dividend Liability Preview</DialogTitle>
            <DialogDescription className="mt-1">
              {register ? (
                <>
                  <strong>{register.name ?? register.symbol}</strong> ·{" "}
                </>
              ) : (
                ""
              )}
              Rate: <strong>₦{rateNum.toFixed(4)}/share</strong>
              {date1 ? (
                <>
                  {" "}
                  · Qualification Date:{" "}
                  <strong>{format(date1, "dd MMM yyyy")}</strong>
                </>
              ) : (
                ""
              )}{" "}
              · {shareholders.length.toLocaleString()} eligible shareholders
            </DialogDescription>
          </DialogHeader>

          {/* Summary stat cards */}
          <div className="px-6 py-3 grid grid-cols-4 gap-3 border-b shrink-0 bg-muted/20">
            {[
              {
                label: "Total Eligible Shareholders",
                value: shareholders.length.toLocaleString(),
                color: "text-foreground",
              },
              {
                label: "Total Gross Liability",
                value: formatNaira(allTotals.gross),
                color: "text-foreground font-bold",
              },
              {
                label: "Total WHT (10%)",
                value: formatNaira(allTotals.wht),
                color: "text-amber-600 font-bold",
              },
              {
                label: "Total Net Payout",
                value: formatNaira(allTotals.net),
                color: "text-green-700 font-bold",
              },
            ].map((s) => (
              <Card key={s.label} className="mrpsl-card p-3">
                <div className="mrpsl-section-title">{s.label}</div>
                <div className={`text-lg font-mono mt-1 ${s.color}`}>
                  {s.value}
                </div>
              </Card>
            ))}
          </div>

          {/* Scrollable table body */}
          <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="mrpsl-table-header sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">ACCOUNT NO</th>
                  <th className="px-4 py-2.5">HOLDER NAME</th>
                  <th className="px-4 py-2.5">UNITS AT QUAL DATE</th>
                  <th className="px-4 py-2.5">GROSS DIV (₦)</th>
                  <th className="px-4 py-2.5">WHT (₦)</th>
                  <th className="px-4 py-2.5">NET DIV (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {previewPagedRows.map((s, i) => {
                  const g = s.holdings * rateNum;
                  const w = g * 0.1;
                  const n = g - w;
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {previewStart + i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground text-[12px]">
                        {s.accountNumber}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right">
                        {s.holdings.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right">
                        {formatNaira(g)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right text-amber-600">
                        {formatNaira(w)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-right text-green-700 font-semibold">
                        {formatNaira(n)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/40 border-t-2 sticky bottom-0">
                <tr className="font-bold text-[13px]">
                  <td
                    colSpan={3}
                    className="px-4 py-2.5 text-muted-foreground uppercase tracking-wide text-[12px]"
                  >
                    Page Totals ({shareholders.length.toLocaleString()} total)
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right">
                    {previewPagedRows
                      .reduce((s, r) => s + r.holdings, 0)
                      .toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right">
                    {formatNaira(
                      previewPagedRows.reduce(
                        (s, r) => s + r.holdings * rateNum,
                        0,
                      ),
                    )}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right text-amber-600">
                    {formatNaira(
                      previewPagedRows.reduce(
                        (s, r) => s + r.holdings * rateNum * 0.1,
                        0,
                      ),
                    )}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right text-green-700">
                    {formatNaira(
                      previewPagedRows.reduce(
                        (s, r) => s + r.holdings * rateNum * 0.9,
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination + footer */}
          <div className="border-t shrink-0 px-4 py-3 flex items-center justify-between gap-4 bg-muted/10">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              Showing {previewStart + 1}–
              {Math.min(previewStart + PREVIEW_PAGE_SIZE, shareholders.length)}{" "}
              of {shareholders.length.toLocaleString()} shareholders
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[13px]"
                disabled={previewPage === 1}
                onClick={() => setPreviewPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-[13px] px-2 text-muted-foreground">
                {previewPage} / {previewTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[13px]"
                disabled={previewPage === previewTotalPages}
                onClick={() => setPreviewPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => toast.info("Downloading full list...")}
            >
              <Download className="h-4 w-4" /> Download Full List (Excel)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Pending Approval Review Dialog ── */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-xl flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="flex-1">
                Review Dividend Declaration
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => toast.info("Downloading declaration...")}
              >
                <Download className="h-4 w-4" /> Download Declaration
              </Button>
            </div>
            <DialogDescription>
              {selectedDecl?.paymentNumber ?? ""}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                {selectedDecl?.dividendType ?? "—"}
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 border-0 text-[13px] tabular-nums">
                Rate: ₦{selectedDecl?.rate.toFixed(4) ?? "0.0000"}
              </Badge>
              <Badge
                className={`border-0 text-[13px] ${selectedDecl ? getTierBadge(selectedDecl.tier) : ""}`}
              >
                Tier {selectedDecl?.tier ?? "—"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="mrpsl-card p-4">
                <div className="mrpsl-section-title">Gross Liability</div>
                <div className="text-xl tabular mt-1 font-bold">
                  {selectedDecl
                    ? formatNaira(selectedDecl.grossLiability)
                    : "—"}
                </div>
              </Card>
              <Card className="mrpsl-card p-4 bg-amber-50 border-amber-200">
                <div className="text-[13px] font-bold uppercase tracking-widest text-amber-700/80">
                  WHT Amount
                </div>
                <div className="text-xl tabular mt-1 font-bold text-amber-600">
                  {selectedDecl ? formatNaira(selectedDecl.whtAmount) : "—"}
                </div>
              </Card>
              <Card className="mrpsl-card p-4 bg-green-50 border-green-200">
                <div className="text-[13px] font-bold uppercase tracking-widest text-green-700/80">
                  Net Liability
                </div>
                <div className="text-xl tabular mt-1 font-bold text-green-700">
                  {selectedDecl ? formatNaira(selectedDecl.netLiability) : "—"}
                </div>
              </Card>
            </div>

            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                Approval Chain
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Chidinma Nwosu</span>
                    <span className="text-muted-foreground ml-2">
                      ✓ Submitted 2h ago
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center animate-pulse" />
                  <div className="text-sm">
                    <span className="font-semibold">
                      {currentUser?.roles[0].replace(/_/g, " ")}
                    </span>
                    <span className="text-amber-600 ml-2">
                      ⏳ Pending your action
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  <div className="text-sm text-muted-foreground">
                    Board / MD — Awaiting
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="mrpsl-label">Comment</label>
              <Textarea
                value={sheetComment}
                onChange={(e) => setSheetComment(e.target.value)}
                placeholder="Required for rejection..."
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  const ref = selectedDecl
                    ? `${selectedDecl.registerId}-${selectedDecl.dividendType}-${selectedDecl.paymentNumber}`
                    : "Declaration";
                  setRejectedDecl({ ref, comment: sheetComment });
                  setActiveTab("new");
                  toast.error(
                    "Declaration rejected and returned to submitter.",
                  );
                  setSheetOpen(false);
                  setSheetComment("");
                }}
              >
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  toast.success(
                    "Approved. Forwarded to ICU for final sign-off.",
                  );
                  setSheetOpen(false);
                  setSheetComment("");
                }}
              >
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ICU Approval Dialog ── */}
      <Dialog open={icuApprovalOpen} onOpenChange={setIcuApprovalOpen}>
        <DialogContent className="max-w-xl flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>ICU Approval — Dividend Declaration</DialogTitle>
            <DialogDescription>
              {selectedIcuDecl?.paymentNumber ?? ""}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                {selectedIcuDecl?.dividendType ?? "—"}
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 border-0 text-[13px] tabular-nums">
                Rate: ₦{selectedIcuDecl?.rate.toFixed(4) ?? "0.0000"}
              </Badge>
              <Badge
                className={`border-0 text-[13px] ${selectedIcuDecl ? getTierBadge(selectedIcuDecl.tier) : ""}`}
              >
                Tier {selectedIcuDecl?.tier ?? "—"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="mrpsl-card p-4">
                <div className="mrpsl-section-title">Gross Liability</div>
                <div className="text-xl tabular mt-1 font-bold">
                  {selectedIcuDecl
                    ? formatNaira(selectedIcuDecl.grossLiability)
                    : "—"}
                </div>
              </Card>
              <Card className="mrpsl-card p-4 bg-amber-50 border-amber-200">
                <div className="text-[13px] font-bold uppercase tracking-widest text-amber-700/80">
                  WHT Amount
                </div>
                <div className="text-xl tabular mt-1 font-bold text-amber-600">
                  {selectedIcuDecl
                    ? formatNaira(selectedIcuDecl.whtAmount)
                    : "—"}
                </div>
              </Card>
              <Card className="mrpsl-card p-4 bg-green-50 border-green-200">
                <div className="text-[13px] font-bold uppercase tracking-widest text-green-700/80">
                  Net Liability
                </div>
                <div className="text-xl tabular mt-1 font-bold text-green-700">
                  {selectedIcuDecl
                    ? formatNaira(selectedIcuDecl.netLiability)
                    : "—"}
                </div>
              </Card>
            </div>

            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                Approval Chain
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Chidinma Nwosu</span>
                    <span className="text-muted-foreground ml-2">
                      ✓ Submitted
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Ops Manager</span>
                    <span className="text-muted-foreground ml-2">
                      ✓ Ops Authorised
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center animate-pulse" />
                  <div className="text-sm">
                    <span className="font-semibold">ICU</span>
                    <span className="text-amber-600 ml-2">
                      ⏳ ICU Pending — your action required
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="mrpsl-label">ICU Comment</label>
              <Textarea
                value={icuComment}
                onChange={(e) => setIcuComment(e.target.value)}
                placeholder="Optional comment..."
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  toast.error(
                    "ICU rejected the declaration. Returned to submitter.",
                  );
                  setIcuApprovalOpen(false);
                  setIcuComment("");
                }}
              >
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (selectedIcuDecl) {
                    const reg = registers.find(
                      (r) => r.id === selectedIcuDecl.registerId,
                    );
                    toast.success(
                      `ICU approved. Payment number generated: PAY-${reg?.id ?? selectedIcuDecl.registerId}-${selectedIcuDecl.paymentNumber}. Shareholders queued for payment.`,
                    );
                    setIcuApprovedIds((prev) =>
                      new Set(prev).add(selectedIcuDecl.id),
                    );
                  }
                  setIcuApprovalOpen(false);
                  setIcuComment("");
                }}
              >
                ICU Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
