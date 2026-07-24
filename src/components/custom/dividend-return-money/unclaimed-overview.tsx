"use client";

import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  ArrowUpRight,
  Building2,
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  PlusCircle,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useStore } from "@/lib/store";
import {
  useReturnRecords,
  useReturnInitiations,
  useCreateReturnInitiation,
  useReviewReturnInitiation,
} from "@/hooks/useDividendReturnMoney";
import { formatNaira } from "@/lib/utils/format";
import { toast } from "sonner";
import type {
  DividendReturnRecord,
  RecipientType,
  ReturnStatus,
  ReturnInitiation,
  ReturnInitiationStatus,
} from "@/types/dividend-return-money";

const STATUS_META: Record<ReturnStatus, { label: string; className: string }> =
  {
    PENDING_RETURN: {
      label: "Pending Return",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    RETURNED: {
      label: "Returned",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    PARTIALLY_CLAIMED: {
      label: "Partially Claimed",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    EXHAUSTED: {
      label: "Withheld Exhausted",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

const INITIATION_META: Record<
  ReturnInitiationStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  PENDING_APPROVAL: {
    label: "Pending Approval",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  ICU_APPROVED: {
    label: "ICU Approved",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircle2,
  },
  PROCESSED: {
    label: "Processed",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
};

interface ReturnAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const MOCK_COMPANY_ACCOUNTS: ReturnAccount[] = [
  { id: "ca1", bankName: "Access Bank", accountNumber: "0123456789", accountName: "MTN Nigeria Communications Plc" },
  { id: "ca2", bankName: "Zenith Bank", accountNumber: "2234567890", accountName: "Corporate Treasury Account" },
];

const MOCK_UFTF_ACCOUNTS: ReturnAccount[] = [
  { id: "ua1", bankName: "Central Bank of Nigeria", accountNumber: "9800001234", accountName: "Unclaimed Dividend Trust Fund — DMO" },
  { id: "ua2", bankName: "Access Bank", accountNumber: "9900005678", accountName: "UFTF Holding Account (DMO)" },
];

export function UnclaimedOverviewTab() {
  const currentUser = useStore((s) => s.currentUser);

  const [registerFilter, setRegisterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "">("");

  // Initiate dialog state
  const [initiateRecord, setInitiateRecord] =
    useState<DividendReturnRecord | null>(null);
  const [recipientType, setRecipientType] = useState<RecipientType>("COMPANY");
  const [secAmount, setSecAmount] = useState("");
  const [narration, setNarration] = useState("");

  // Account selection state
  const [companyAccounts, setCompanyAccounts] = useState<ReturnAccount[]>(MOCK_COMPANY_ACCOUNTS);
  const [uftfAccounts, setUftfAccounts] = useState<ReturnAccount[]>(MOCK_UFTF_ACCOUNTS);
  const [selectedCompanyAccountId, setSelectedCompanyAccountId] = useState("");
  const [selectedUftfAccountId, setSelectedUftfAccountId] = useState("");
  const [showAddCompanyAccount, setShowAddCompanyAccount] = useState(false);
  const [showAddUftfAccount, setShowAddUftfAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ bankName: "", accountNumber: "", accountName: "" });

  // Review initiation dialog state
  const [reviewTarget, setReviewTarget] = useState<ReturnInitiation | null>(
    null,
  );
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [reviewComment, setReviewComment] = useState("");

  const { data: registersData } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });
  const { data, isLoading } = useReturnRecords({
    registerSymbol: registerFilter || undefined,
    returnStatus: statusFilter || undefined,
    size: 50,
  });
  const { data: initiationsData, isLoading: initiationsLoading } =
    useReturnInitiations();

  const createInitiation = useCreateReturnInitiation();
  const reviewInitiation = useReviewReturnInitiation();

  const records = data?.content ?? [];
  const allInitiations = initiationsData?.content ?? [];
  const pendingInitiations = allInitiations.filter(
    (i) => i.status === "PENDING_APPROVAL" || i.status === "ICU_APPROVED",
  );

  const totalUnclaimed = records.reduce((s, r) => s + r.totalUnclaimed, 0);
  const totalReturned = records.reduce(
    (s, r) => (r.returnStatus !== "PENDING_RETURN" ? s + r.returnAmount : s),
    0,
  );
  const totalWithheld = records.reduce((s, r) => s + r.withheldAmount, 0);

  const parsedSecAmount = parseFloat(secAmount) || 0;

  function handleSubmitInitiation() {
    if (!initiateRecord) return;
    if (recipientType === "SEC") {
      if (parsedSecAmount <= 0) {
        toast.error("Enter the amount to remit to SEC.");
        return;
      }
      if (parsedSecAmount > initiateRecord.totalUnclaimed) {
        toast.error(
          `Amount cannot exceed total unclaimed of ${formatNaira(initiateRecord.totalUnclaimed)}.`,
        );
        return;
      }
    }
    createInitiation.mutate(
      {
        returnRecordId: initiateRecord.id,
        recipientType,
        returnPercentage: recipientType === "COMPANY" ? 90 : undefined,
        secAmount: recipientType === "SEC" ? parsedSecAmount : undefined,
        narration: narration.trim() || undefined,
        initiatedBy: currentUser?.email ?? "Unknown",
      },
      {
        onSuccess: () => {
          toast.success(
            `Return initiation submitted for ${initiateRecord.paymentNumber}. Awaiting approval.`,
          );
          closeInitiateDialog();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleReview() {
    if (!reviewTarget || !reviewAction) return;
    if (reviewAction === "reject" && !reviewComment.trim()) {
      toast.error("A comment is required when rejecting.");
      return;
    }
    reviewInitiation.mutate(
      {
        id: reviewTarget.id,
        action: reviewAction,
        comment: reviewComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          const label =
            reviewAction === "reject"
              ? "Initiation rejected."
              : reviewTarget.status === "PENDING_APPROVAL"
                ? `ICU approval granted for ${reviewTarget.paymentNumber}.`
                : `Return processed for ${reviewTarget.paymentNumber}.`;
          toast.success(label);
          closeReviewDialog();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function closeInitiateDialog() {
    setInitiateRecord(null);
    setRecipientType("COMPANY");
    setSecAmount("");
    setNarration("");
    setSelectedCompanyAccountId("");
    setSelectedUftfAccountId("");
    setShowAddCompanyAccount(false);
    setShowAddUftfAccount(false);
    setNewAccount({ bankName: "", accountNumber: "", accountName: "" });
  }

  function addCompanyAccount() {
    if (!newAccount.bankName.trim() || !newAccount.accountNumber.trim() || !newAccount.accountName.trim()) return;
    const acct: ReturnAccount = { id: `ca${Date.now()}`, ...newAccount };
    setCompanyAccounts((prev) => [...prev, acct]);
    setSelectedCompanyAccountId(acct.id);
    setNewAccount({ bankName: "", accountNumber: "", accountName: "" });
    setShowAddCompanyAccount(false);
  }

  function addUftfAccount() {
    if (!newAccount.bankName.trim() || !newAccount.accountNumber.trim() || !newAccount.accountName.trim()) return;
    const acct: ReturnAccount = { id: `ua${Date.now()}`, ...newAccount };
    setUftfAccounts((prev) => [...prev, acct]);
    setSelectedUftfAccountId(acct.id);
    setNewAccount({ bankName: "", accountNumber: "", accountName: "" });
    setShowAddUftfAccount(false);
  }

  function closeReviewDialog() {
    setReviewTarget(null);
    setReviewAction(null);
    setReviewComment("");
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="mrpsl-card p-4">
          <div className="mrpsl-section-title mb-1">Total Unclaimed</div>
          <div className="text-2xl font-bold font-mono">
            {formatNaira(totalUnclaimed)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across all declarations
          </div>
        </Card>
        <Card className="mrpsl-card p-4 border-l-4 border-l-green-500">
          <div className="mrpsl-section-title mb-1 text-green-700">
            Returned (Company / UFTF)
          </div>
          <div className="text-2xl font-bold font-mono text-green-600">
            {formatNaira(totalReturned)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Processed returns
          </div>
        </Card>
        <Card className="mrpsl-card p-4 border-l-4 border-l-amber-500">
          <div className="mrpsl-section-title mb-1 text-amber-700">
            10% Withheld
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {formatNaira(totalWithheld)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Reserved for shareholder claims
          </div>
        </Card>
      </div>

      {/* Inner sub-tabs */}
      <Tabs defaultValue="unclaimed" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="unclaimed"
            className="rounded-lg px-4 py-2 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Unclaimed Dividends
          </TabsTrigger>
          <TabsTrigger
            value="initiations"
            className="rounded-lg px-4 py-2 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all flex items-center gap-1.5"
          >
            Initiation Requests
            {pendingInitiations.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 leading-none min-w-4.5">
                {pendingInitiations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sub-tab 1: Unclaimed Dividends */}
        <TabsContent value="unclaimed" className="mt-5 space-y-4">
          {/* Filters */}
          <div className="flex gap-3 items-end">
            <div className="space-y-1.5">
              <label className="mrpsl-label">Register</label>
              <Select
                value={registerFilter || "all"}
                onValueChange={(v) => setRegisterFilter(!v || v === "all" ? "" : v)}
              >
                <SelectTrigger className="mrpsl-input w-48">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registers</SelectItem>
                  {registersData?.content?.map((r) => (
                    <SelectItem key={r.registerId} value={r.symbol}>
                      <span className="font-bold">{r.registerName}</span>{" "}
                      <span className="text-sm">{r.symbol}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="mrpsl-label">Status</label>
              <Select
                value={statusFilter || "all"}
                onValueChange={(v) =>
                  setStatusFilter(v === "all" ? "" : (v as ReturnStatus))
                }
              >
                <SelectTrigger className="mrpsl-input w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING_RETURN">Pending Return</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="PARTIALLY_CLAIMED">Partially Claimed</SelectItem>
                  <SelectItem value="EXHAUSTED">Withheld Exhausted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main table */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DECLARATION NO</th>
                    <th className="p-3">REGISTER</th>
                    <th className="p-3">RECIPIENT</th>
                    <th className="p-3 text-right">SHAREHOLDERS</th>
                    <th className="p-3 text-right">TOTAL UNCLAIMED</th>
                    <th className="p-3 text-right">RETURNED</th>
                    <th className="p-3 text-right">10% WITHHELD</th>
                    <th className="p-3 text-right">PAID FROM 10%</th>
                    <th className="p-3 text-right">REMAINING</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[13px]">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 11 }).map((__, j) => (
                          <td key={j} className="p-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-muted-foreground font-sans">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No unclaimed dividend records found.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec) => {
                      const statusMeta = STATUS_META[rec.returnStatus];
                      const hasPendingInitiation = !!rec.pendingInitiationId;
                      const canInitiate = rec.returnStatus === "PENDING_RETURN" && !hasPendingInitiation;
                      return (
                        <tr key={rec.id} className="hover:bg-accent/5">
                          <td className="p-3 font-bold text-primary">{rec.paymentNumber}</td>
                          <td className="p-3 font-sans font-medium">{rec.registerSymbol}</td>
                          <td className="p-3">
                            {rec.recipientType ? (
                              <Badge
                                variant="outline"
                                className={`text-[11px] gap-1 ${
                                  rec.recipientType === "SEC"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {rec.recipientType === "SEC" ? (
                                  <Landmark className="h-3 w-3" />
                                ) : (
                                  <Building2 className="h-3 w-3" />
                                )}
                                {rec.recipientType === "SEC" ? "UFTF" : "Company"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right">{rec.shareholderCount.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold">{formatNaira(rec.totalUnclaimed)}</td>
                          <td className="p-3 text-right text-green-600">
                            {formatNaira(rec.returnAmount)}
                            {rec.returnPercentage > 0 && rec.recipientType === "COMPANY" && (
                              <div className="text-[11px] text-muted-foreground">{rec.returnPercentage}%</div>
                            )}
                          </td>
                          <td className="p-3 text-right text-amber-600">
                            {rec.recipientType === "SEC" ? (
                              <span className="text-muted-foreground text-[11px]">N/A</span>
                            ) : (
                              <>
                                {formatNaira(rec.withheldAmount)}
                                <div className="text-[11px] text-muted-foreground">{rec.withheldPercentage}%</div>
                              </>
                            )}
                          </td>
                          <td className="p-3 text-right text-blue-600">
                            {rec.recipientType === "SEC" ? (
                              <span className="text-muted-foreground text-[11px]">N/A</span>
                            ) : (
                              formatNaira(rec.totalPaidToShareholders)
                            )}
                          </td>
                          <td className={`p-3 text-right font-bold ${rec.remainingBalance <= 0 ? "text-red-600" : "text-green-600"}`}>
                            {rec.recipientType === "SEC" ? (
                              <span className="text-muted-foreground text-[11px]">N/A</span>
                            ) : (
                              formatNaira(rec.remainingBalance)
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[11px] ${statusMeta.className}`}>
                              {statusMeta.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {canInitiate && (
                              <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setInitiateRecord(rec)}>
                                <ArrowUpRight className="h-3 w-3" />
                                Initiate Return
                              </Button>
                            )}
                            {hasPendingInitiation && (
                              <Badge variant="outline" className="text-[11px] gap-1 bg-amber-50 text-amber-700 border-amber-200">
                                <Clock className="h-3 w-3" />
                                Awaiting Approval
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Sub-tab 2: Initiation Requests */}
        <TabsContent value="initiations" className="mt-5 space-y-4">
          <Card className="mrpsl-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">DECLARATION</th>
                    <th className="p-3">REGISTER</th>
                    <th className="p-3">RECIPIENT</th>
                    <th className="p-3 text-right">RETURN AMOUNT</th>
                    <th className="p-3">INITIATED BY</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[13px]">
                  {initiationsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 9 }).map((__, j) => (
                          <td key={j} className="p-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : allInitiations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-muted-foreground font-sans text-[13px]">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No return initiations yet.
                      </td>
                    </tr>
                  ) : (
                    allInitiations.map((init) => {
                      const meta = INITIATION_META[init.status];
                      const Icon = meta.icon;
                      const canReview = init.status === "PENDING_APPROVAL" || init.status === "ICU_APPROVED";
                      return (
                        <tr key={init.id} className="hover:bg-accent/5">
                          <td className="p-3 text-muted-foreground">{init.initiatedDate}</td>
                          <td className="p-3 font-bold text-primary">{init.paymentNumber}</td>
                          <td className="p-3 font-sans font-medium">{init.registerSymbol}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={`text-[11px] gap-1 ${
                                init.recipientType === "SEC"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {init.recipientType === "SEC" ? (
                                <Landmark className="h-3 w-3" />
                              ) : (
                                <Building2 className="h-3 w-3" />
                              )}
                              {init.recipientType === "SEC" ? "UFTF" : "Company"}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-bold text-green-600">
                            {init.recipientType === "SEC"
                              ? formatNaira(init.secAmount ?? 0)
                              : formatNaira(init.returnAmount)}
                          </td>
                          <td className="p-3 font-sans">{init.initiatedBy}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[11px] gap-1 ${meta.className}`}>
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                            {init.status === "REJECTED" && init.rejectionComment && (
                              <div className="text-[10px] text-red-600 mt-1 max-w-32 truncate font-sans">
                                {init.rejectionComment}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {canReview && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setReviewTarget(init)}>
                                Review
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Initiate Return Dialog */}
      <Dialog
        open={!!initiateRecord}
        onOpenChange={(open) => {
          if (!open) closeInitiateDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Initiate Return — {initiateRecord?.paymentNumber}
            </DialogTitle>
            <DialogDescription>
              This creates a return initiation request that goes through
              approval before any funds are transferred.
            </DialogDescription>
          </DialogHeader>

          {initiateRecord && (
            <div className="space-y-4 px-8 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase">Total Unclaimed</div>
                  <div className="font-mono font-bold text-base">{formatNaira(initiateRecord.totalUnclaimed)}</div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium uppercase">Shareholders</div>
                  <div className="font-mono font-bold text-base">{initiateRecord.shareholderCount.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">Recipient Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientType("COMPANY")}
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      recipientType === "COMPANY"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Building2 className="h-4 w-4" /> Company (90/10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType("SEC")}
                    className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      recipientType === "SEC"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-border text-muted-foreground hover:border-purple-300"
                    }`}
                  >
                    <Landmark className="h-4 w-4" /> UFTF (DMO)
                  </button>
                </div>
              </div>

              {recipientType === "COMPANY" && (
                <div className="space-y-3">
                  <div className="rounded-lg border divide-y">
                    <div className="flex justify-between items-center p-3">
                      <div>
                        <div className="font-medium text-sm">90% — Returned to Company</div>
                        <div className="text-xs text-muted-foreground">Paid out on final approval</div>
                      </div>
                      <div className="font-mono font-bold text-green-600">{formatNaira(initiateRecord.returnAmount)}</div>
                    </div>
                    <div className="flex justify-between items-center p-3">
                      <div>
                        <div className="font-medium text-sm">10% — Withheld by MRPSL</div>
                        <div className="text-xs text-muted-foreground">Reserved for shareholder claims</div>
                      </div>
                      <div className="font-mono font-bold text-amber-600">{formatNaira(initiateRecord.withheldAmount)}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Company Account *</label>
                    <Select value={selectedCompanyAccountId} onValueChange={(v) => setSelectedCompanyAccountId(v ?? "")}>
                      <SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select account..." /></SelectTrigger>
                      <SelectContent>
                        {companyAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-medium">{a.accountName}</span>
                            <span className="text-muted-foreground text-xs ml-1.5">— {a.bankName} · {a.accountNumber}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!showAddCompanyAccount && (
                      <button
                        type="button"
                        onClick={() => { setShowAddCompanyAccount(true); setNewAccount({ bankName: "", accountNumber: "", accountName: "" }); }}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <PlusCircle className="h-3 w-3" /> Add New Account
                      </button>
                    )}
                    {showAddCompanyAccount && (
                      <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Account</div>
                        <Input className="mrpsl-input h-8 text-xs" placeholder="Bank name" value={newAccount.bankName} onChange={(e) => setNewAccount((p) => ({ ...p, bankName: e.target.value }))} />
                        <Input className="mrpsl-input h-8 text-xs font-mono" placeholder="Account number" value={newAccount.accountNumber} onChange={(e) => setNewAccount((p) => ({ ...p, accountNumber: e.target.value }))} />
                        <Input className="mrpsl-input h-8 text-xs" placeholder="Account name" value={newAccount.accountName} onChange={(e) => setNewAccount((p) => ({ ...p, accountName: e.target.value }))} />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setShowAddCompanyAccount(false)}>Cancel</Button>
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={addCompanyAccount}>Save Account</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {recipientType === "SEC" && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3 text-[13px] text-purple-800 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Unclaimed Dividend Trust Fund (UFTF)</span> — Per the
                        Investment and Securities Act and Finance Act 2020, unclaimed dividends exceeding 6 years
                        are remitted to the Debt Management Office (DMO) on behalf of the Federal Government.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="mrpsl-label">UFTF / DMO Account *</label>
                    <Select value={selectedUftfAccountId} onValueChange={(v) => setSelectedUftfAccountId(v ?? "")}>
                      <SelectTrigger className="mrpsl-input"><SelectValue placeholder="Select UFTF account..." /></SelectTrigger>
                      <SelectContent>
                        {uftfAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-medium">{a.accountName}</span>
                            <span className="text-muted-foreground text-xs ml-1.5">— {a.bankName} · {a.accountNumber}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!showAddUftfAccount && (
                      <button
                        type="button"
                        onClick={() => { setShowAddUftfAccount(true); setNewAccount({ bankName: "", accountNumber: "", accountName: "" }); }}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <PlusCircle className="h-3 w-3" /> Add New Account
                      </button>
                    )}
                    {showAddUftfAccount && (
                      <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New UFTF Account</div>
                        <Input className="mrpsl-input h-8 text-xs" placeholder="Bank name" value={newAccount.bankName} onChange={(e) => setNewAccount((p) => ({ ...p, bankName: e.target.value }))} />
                        <Input className="mrpsl-input h-8 text-xs font-mono" placeholder="Account number" value={newAccount.accountNumber} onChange={(e) => setNewAccount((p) => ({ ...p, accountNumber: e.target.value }))} />
                        <Input className="mrpsl-input h-8 text-xs" placeholder="Account name" value={newAccount.accountName} onChange={(e) => setNewAccount((p) => ({ ...p, accountName: e.target.value }))} />
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setShowAddUftfAccount(false)}>Cancel</Button>
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={addUftfAccount}>Save Account</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="mrpsl-label">Amount to Remit to UFTF *</label>
                    <Input
                      type="number"
                      className="mrpsl-input font-mono"
                      placeholder="0.00"
                      value={secAmount}
                      onChange={(e) => setSecAmount(e.target.value)}
                    />
                    <div className="text-[11px] text-muted-foreground">
                      Max: {formatNaira(initiateRecord.totalUnclaimed)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="mrpsl-label">Narration (optional)</label>
                <Textarea
                  className="mrpsl-input resize-none"
                  rows={2}
                  placeholder="Add a note for audit purposes..."
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeInitiateDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInitiation}
              disabled={createInitiation.isPending}
            >
              {createInitiation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Initiation Dialog */}
      <Dialog
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) closeReviewDialog();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Review Return Initiation — {reviewTarget?.paymentNumber}
            </DialogTitle>
            <DialogDescription>
              {reviewTarget?.status === "PENDING_APPROVAL"
                ? "Grant ICU approval or reject this return initiation."
                : "Grant final approval to release the funds, or reject."}
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-4 px-8 py-2">
              <div className="rounded-lg border divide-y text-sm">
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Declaration</span>
                  <span className="font-bold">
                    {reviewTarget.paymentNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Register</span>
                  <span className="font-mono">
                    {reviewTarget.registerSymbol}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-medium">
                    {reviewTarget.recipientType === "SEC"
                      ? "UFTF (DMO)"
                      : "Company (90/10 split)"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono font-bold text-green-600">
                    {formatNaira(
                      reviewTarget.recipientType === "SEC"
                        ? (reviewTarget.secAmount ?? 0)
                        : reviewTarget.returnAmount,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Initiated by</span>
                  <span className="font-sans">{reviewTarget.initiatedBy}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground">Current step</span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] ${INITIATION_META[reviewTarget.status].className}`}
                  >
                    {reviewTarget.status === "PENDING_APPROVAL"
                      ? "Awaiting ICU Approval"
                      : "Awaiting Final Approval"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="mrpsl-label">
                  Comment {reviewAction === "reject" ? "*" : "(optional)"}
                </label>
                <Textarea
                  className={`mrpsl-input resize-none ${reviewAction === "reject" ? "border-red-200 focus:border-red-400" : ""}`}
                  rows={2}
                  placeholder={
                    reviewAction === "reject"
                      ? "State the reason for rejection..."
                      : "Add a comment for the audit trail..."
                  }
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                setReviewAction("reject");
                handleReview();
              }}
              disabled={
                reviewInitiation.isPending ||
                (reviewAction === "reject" && !reviewComment.trim())
              }
            >
              {reviewInitiation.isPending && reviewAction === "reject" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject
            </Button>
            <Button
              className={`flex-1 ${reviewTarget?.status === "PENDING_APPROVAL" ? "" : "bg-primary"}`}
              onClick={() => {
                setReviewAction("approve");
                handleReview();
              }}
              disabled={reviewInitiation.isPending}
            >
              {reviewInitiation.isPending && reviewAction === "approve" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {reviewTarget?.status === "PENDING_APPROVAL"
                ? "ICU Approve"
                : "Final Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
