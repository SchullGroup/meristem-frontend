"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, AlertCircle, X, Download, Loader2 } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  APPROVE_MANDATE_PAYMENTS,
  BATCH_APPROVE_MANDATE_PAYMENTS,
  BATCH_REJECT_MANDATE_PAYMENTS,
  GET_LOADED_MANDATE_QUEUES,
  GET_PENDING_ICU_MANDATE_PAYMENTS,
  GET_PENDING_MANDATE_PAYMENTS,
  LOAD_ACCOUNT,
  REJECT_MANDATE_PAYMENTS,
  SUBMIT_MANDATE_PAYMENTS,
} from "@/actions/divNewMandate";
import { GET_ALL_DIVIDEND_DECLARATIONS_NUMBERS } from "@/actions/divDeclarationActions";
import { useStore } from "@/lib/store";

type MandateApproval = {
  id: string;
  date: string;
  account: string;
  holder: string;
  bank: string;
  accountNo: string;
  dividendNo: string;
  amount: number;
  submittedBy: string;
  tier: number;
};

const INITIAL_PENDING: MandateApproval[] = [
  {
    id: "MA1",
    date: "05 May 2026",
    account: "DANGCEM-10045",
    holder: "Lukman Bello",
    bank: "UBA",
    accountNo: "0029384812",
    dividendNo: "DIV-2025-001",
    amount: 45000,
    submittedBy: "Chidinma Nwosu",
    tier: 2,
  },
  {
    id: "MA2",
    date: "04 May 2026",
    account: "ZENITH-9921",
    holder: "Fatima Abdullahi",
    bank: "First Bank",
    accountNo: "3012849001",
    dividendNo: "DIV-2025-001",
    amount: 128500,
    submittedBy: "Garba Musa",
    tier: 3,
  },
  {
    id: "MA3",
    date: "04 May 2026",
    account: "DANGCEM-10102",
    holder: "Emeka Eze",
    bank: "GTBank",
    accountNo: "0045612378",
    dividendNo: "DIV-2025-002",
    amount: 62000,
    submittedBy: "Chidinma Nwosu",
    tier: 2,
  },
];

const INITIAL_ICU: MandateApproval[] = [
  {
    id: "IM1",
    date: "03 May 2026",
    account: "DANGCEM-10200",
    holder: "Olumide Adeyemi",
    bank: "Access Bank",
    accountNo: "0076123490",
    dividendNo: "DIV-2025-001",
    amount: 950000,
    submittedBy: "Emeka Obiora",
    tier: 4,
  },
  {
    id: "IM2",
    date: "02 May 2026",
    account: "ACCESS-00553",
    holder: "Ngozi Eze",
    bank: "Zenith Bank",
    accountNo: "2012341290",
    dividendNo: "DIV-2025-003",
    amount: 1200000,
    submittedBy: "Emeka Obiora",
    tier: 4,
  },
];

export default function NewMandatePage() {
  const queryClient = useQueryClient();
  const { currentUser } = useStore();
  const { data: registersData } = useGetRegisters({
    size: 1000,
  });

  const registerList = registersData?.content;

  const [queueRegister, setQueueRegister] = useState("all");
  const [queueDividend, setQueueDividend] = useState("all");
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [pendingMandate, setPendingMandate] =
    useState<MandateApproval[]>(INITIAL_PENDING);
  const [icuMandate, setIcuMandate] = useState<MandateApproval[]>(INITIAL_ICU);

  const [pendingApprIds, setPendingApprIds] = useState<Set<string>>(new Set());
  const [icuApprIds, setIcuApprIds] = useState<Set<string>>(new Set());
  const [batchApprRejectOpen, setBatchApprRejectOpen] = useState(false);
  const [batchApprComment, setBatchApprComment] = useState("");
  const [batchApprTarget, setBatchApprTarget] = useState<
    "pending" | "icu" | null
  >(null);

  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectedIsIcu, setRejectedIsIcu] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isIcu, setIsIcu] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const icuPg = usePagination(icuMandate);

  const { data, isLoading: mandateQueueLoading } = useQuery({
    queryKey: ["loaded-mandate-queue", queueRegister, queueDividend, 0, 20],
    queryFn: GET_LOADED_MANDATE_QUEUES,
    enabled: !!queueRegister && !!queueDividend,
  });

  const mandateQueue = data?.data?.content;

  const { data: declarationData } = useQuery({
    queryKey: ["all-declarations-numbers"],
    queryFn: GET_ALL_DIVIDEND_DECLARATIONS_NUMBERS,
  });

  const [pendingPage, setPendingPage] = useState(0);
  const [pendingPageSize, setPendingPageSize] = useState(10);

  const {
    data: pendingMandatePaymentsData,
    isFetching: pendingMandatePaymentsLoading,
  } = useQuery({
    queryKey: ["pending-mandate-payments", pendingPage, pendingPageSize],
    queryFn: GET_PENDING_MANDATE_PAYMENTS,
  });

  const [icuPage, setIcuPage] = useState(0);
  const [icuPageSize, setIcuPageSize] = useState(10);

  const {
    data: icuMandatePaymentsData,
    isFetching: icuMandatePaymentsLoading,
  } = useQuery({
    queryKey: ["pending-icu-mandate-payments", icuPage, icuPageSize],
    queryFn: GET_PENDING_ICU_MANDATE_PAYMENTS,
  });

  const pendingMandatePayments = pendingMandatePaymentsData?.data?.content;
  const pendingTotal = pendingMandatePaymentsData?.data?.totalElements ?? 0;
  const pendingTotalPages = pendingMandatePaymentsData?.data?.totalPages ?? 1;

  const icuMandatePayments = icuMandatePaymentsData?.data?.content;
  const icuTotal = icuMandatePaymentsData?.data?.totalElements ?? 0;
  const icuTotalPages = icuMandatePaymentsData?.data?.totalPages ?? 1;

  const pendingFrom =
    pendingTotal === 0 ? 0 : pendingPage * pendingPageSize + 1;
  const pendingTo = Math.min((pendingPage + 1) * pendingPageSize, pendingTotal);

  const icuFrom = icuTotal === 0 ? 0 : icuPage * icuPageSize + 1;
  const icuTo = Math.min((icuPage + 1) * icuPageSize, icuTotal);

  const handlePendingPageChange = (newPage: number) => {
    setPendingPage(newPage - 1);
  };

  const handlePendingPageSizeChange = (newSize: number) => {
    setPendingPageSize(newSize);
    setPendingPage(0);
  };

  const handleIcuPageChange = (newPage: number) => {
    setIcuPage(newPage - 1);
  };

  const handleIcuPageSizeChange = (newSize: number) => {
    setIcuPageSize(newSize);
    setIcuPage(0);
  };

  const visiblePendingPayments =
    pendingMandatePayments?.filter(
      (q: { status: string }) => q.status === "PENDING_OPS",
    ) || [];

  const visibleIcuPayments = icuMandatePayments || [];

  const allSelected =
    mandateQueue?.length > 0 &&
    mandateQueue?.every((r: { id: string }) => selectedIds.has(r.id));
  const selectedTotal = mandateQueue
    ?.filter((r: { id: string }) => selectedIds.has(r.id))
    ?.reduce((s: number, r: { amount: number }) => s + r.amount, 0);

  const approvedDivNum = declarationData?.data;

  const loadAccountMutation = useMutation({
    mutationFn: LOAD_ACCOUNT,
    onSuccess: (data) => {
      toast.success(data?.responseMessage || "Accounts loaded successfully");
      setQueueLoaded(true);
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submitMandatePaymentsMutation = useMutation({
    mutationFn: SUBMIT_MANDATE_PAYMENTS,
    onSuccess: (data) => {
      toast.success(data?.responseMessage || "Accounts submitted successfully");
      setQueueLoaded(false);
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mandateQueue?.map((r: { id: string }) => r.id)));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function submitSelected() {
    if (queueLoaded && selectedIds.size === 0) {
      toast.error("No accounts selected");
      return;
    }
    const payload = {
      ids: Array.from(selectedIds),
      totalAmount: selectedTotal,
      authorisedBy: currentUser?.email ?? "",
    };
    submitMandatePaymentsMutation.mutate(payload);
  }

  function openReview(row: MandateApproval, icu: boolean) {
    setSelected(row);
    setIsIcu(icu);
    setRejectComment("");
    setReviewOpen(true);
  }

  const approveMandateMutation = useMutation({
    mutationFn: APPROVE_MANDATE_PAYMENTS,
    onSuccess: (data) => {
      toast.success(data?.responseMessage || "Approved successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-mandate-payments"] });
      queryClient.invalidateQueries({
        queryKey: ["pending-icu-mandate-payments"],
      });
      setReviewOpen(false);
      setSelectedIds(new Set());
      setIcuApprIds(new Set());
      setPendingApprIds(new Set());
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMandateMutation = useMutation({
    mutationFn: REJECT_MANDATE_PAYMENTS,
    onSuccess: (data) => {
      toast.success(data?.responseMessage || "Rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-mandate-payments"] });
      queryClient.invalidateQueries({
        queryKey: ["pending-icu-mandate-payments"],
      });
      setReviewOpen(false);
      setSelectedIds(new Set());
      setIcuApprIds(new Set());
      setPendingApprIds(new Set());
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleApprove() {
    if (!selected) return;
    if (isIcu) {
      const payload = {
        comment: rejectComment,
        authorisedBy: currentUser?.email ?? "",
      };
      approveMandateMutation.mutate({ id: selected.id, ...payload });
    } else {
      const payload = {
        comment: rejectComment,
        authorisedBy: currentUser?.email ?? "",
      };
      approveMandateMutation.mutate({ id: selected.id, ...payload });
    }
    setReviewOpen(false);
  }

  function handleReject() {
    if (!selected) return;
    if (!rejectComment) {
      toast.error("Comment is required for rejection");
      return;
    }
    if (isIcu) {
      const payload = {
        id: selected.id,
        comment: rejectComment,
        authorisedBy: currentUser?.email ?? "",
      };
      rejectMandateMutation.mutate(payload);
    } else {
      const payload = {
        id: selected.id,
        comment: rejectComment,
        authorisedBy: currentUser?.email ?? "",
      };
      rejectMandateMutation.mutate(payload);
    }
  }

  const approvalChainSteps = (row: MandateApproval, icu: boolean) => {
    const base = [
      {
        label: `Submitted by ${row.submittedBy}`,
        done: true,
        pending: false,
      },
    ];
    if (icu) {
      return [
        ...base,
        // {
        //   label: "Emeka Obiora (Authoriser) · Approved · 07 May 2026, 11:02",
        //   done: true,
        //   pending: false,
        // },
        // {
        //   label: "Fatimah Lawal (ICU Officer) · Pending your sign-off",
        //   done: false,
        //   pending: true,
        // },
      ];
    }
    return [
      ...base,
      // {
      //   label: "Emeka Obiora (Authoriser) · Pending your action",
      //   done: false,
      //   pending: true,
      // },
    ];
  };

  function togglePendingAppr(id: string) {
    setPendingApprIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function togglePendingApprAll(ids: string[]) {
    setPendingApprIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }
  function toggleIcuAppr(id: string) {
    setIcuApprIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleIcuApprAll(ids: string[]) {
    setIcuApprIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }

  const batchApproveMandatePaymentsMutation = useMutation({
    mutationFn: BATCH_APPROVE_MANDATE_PAYMENTS,
    onSuccess: (data) => {
      toast.success(data?.responseMessage || "Approved successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-mandate-payments"] });
      queryClient.invalidateQueries({
        queryKey: ["pending-icu-mandate-payments"],
      });
      setSelectedIds(new Set());
      setPendingApprIds(new Set());
      setIcuApprIds(new Set());
      setBatchApprRejectOpen(false);
      setBatchApprTarget(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const batchRejectMandatePaymentsMutation = useMutation({
    mutationFn: BATCH_REJECT_MANDATE_PAYMENTS,
    onSuccess: (data) => {
      toast.success(data?.responseMessage || "Rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["pending-mandate-payments"] });
      queryClient.invalidateQueries({
        queryKey: ["pending-icu-mandate-payments"],
      });
      setSelectedIds(new Set());
      setIcuApprIds(new Set());
      setPendingApprIds(new Set());
      setBatchApprComment("");
      setBatchApprRejectOpen(false);
      setBatchApprTarget(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function handleBatchApproveMandate(target: "pending" | "icu") {
    const ids = target === "pending" ? pendingApprIds : icuApprIds;
    if (target === "pending") {
      const payload = {
        ids: Array.from(ids),
        comment: batchApprComment,
        authorisedBy: currentUser?.email ?? "",
      };
      batchApproveMandatePaymentsMutation.mutate(payload);
    } else {
      const payload = {
        ids: Array.from(ids),
        comment: batchApprComment,
        authorisedBy: currentUser?.email ?? "",
      };
      batchApproveMandatePaymentsMutation.mutate(payload);
    }
  }
  function openBatchApprReject(target: "pending" | "icu") {
    setBatchApprTarget(target);
    setBatchApprComment("");
    setBatchApprRejectOpen(true);
  }

  function handleBatchApprReject() {
    if (!batchApprComment.trim()) {
      toast.error("Comment required for rejection.");
      return;
    }
    const ids = batchApprTarget === "pending" ? pendingApprIds : icuApprIds;
    if (batchApprTarget === "pending") {
      const payload = {
        ids: Array.from(ids),
        comment: batchApprComment,
        authorisedBy: currentUser?.email ?? "",
      };
      batchRejectMandatePaymentsMutation.mutate(payload);
    } else {
      const payload = {
        ids: Array.from(ids),
        comment: batchApprComment,
        authorisedBy: currentUser?.email ?? "",
      };
      batchRejectMandatePaymentsMutation.mutate(payload);
    }
    toast.error(`${ids.size} payment${ids.size !== 1 ? "s" : ""} rejected.`);
    setBatchApprComment("");
    setBatchApprRejectOpen(false);
    setBatchApprTarget(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          New Mandate Payment Processing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Process dividend payments for accounts with recently updated bank
          details
        </p>
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="queue"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Review Queue
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
        </TabsList>

        <div className="mt-6">
          <TabsContent value="queue" className="space-y-4">
            {rejectedId && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm text-red-800">
                    Payment Rejected — ID: {rejectedId}{" "}
                    {rejectedIsIcu && (
                      <span className="font-normal">(ICU)</span>
                    )}
                  </div>
                  <div className="text-[13px] text-red-700">
                    {rejectedComment || "No comment provided."}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRejectedId(null);
                    setRejectedComment("");
                  }}
                  className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}

            <div className="flex gap-3 items-end">
              <Select
                value={queueRegister}
                onValueChange={(v) => setQueueRegister(v ?? "all")}
              >
                <SelectTrigger className="w-48 mrpsl-input">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registers</SelectItem>
                  {registerList
                    ?.filter((r) => r?.status === "ACTIVE")
                    .map((r) => (
                      <SelectItem key={r?.registerId} value={r?.registerId}>
                        {r?.symbol} - {r?.registerId}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={queueDividend}
                onValueChange={(v) => setQueueDividend(v ?? "all")}
              >
                <SelectTrigger className="w-52 mrpsl-input">
                  <SelectValue placeholder="All Dividends" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dividend Numbers</SelectItem>
                  {approvedDivNum?.map((d: string) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  loadAccountMutation.mutate();
                }}
              >
                Load Accounts
                {loadAccountMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>

            {!queueLoaded ? (
              <Card className="mrpsl-card p-12 text-center text-muted-foreground text-sm">
                Select filters and click{" "}
                <span className="font-semibold">Load Accounts</span> to populate
                outstanding dividends for newly mandated accounts.
              </Card>
            ) : (
              <div className="relative pb-20">
                <Card className="mrpsl-card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="p-3 w-10">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={toggleAll}
                          />
                        </th>
                        <th className="p-3">ACCOUNT NO</th>
                        <th className="p-3">HOLDER NAME</th>
                        <th className="p-3">NEW BANK</th>
                        <th className="p-3">NEW ACCOUNT NO</th>
                        <th className="p-3">DIVIDEND NO</th>
                        <th className="p-3">AMOUNT (₦)</th>
                        <th className="p-3">SOURCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {mandateQueueLoading ? (
                        <tr>
                          <td colSpan={8} className="p-3 text-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className="animate-pulse bg-gray-200 w-full h-10 my-2 rounded"
                              ></div>
                            ))}
                          </td>
                        </tr>
                      ) : mandateQueue?.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-3 text-center">
                            No records found
                          </td>
                        </tr>
                      ) : (
                        mandateQueue?.map(
                          (
                            q: {
                              [x: string]: string;
                            },
                            i: number,
                          ) => (
                            <tr key={i} className="hover:bg-accent/5">
                              <td className="p-3">
                                <Checkbox
                                  checked={selectedIds.has(q?.id)}
                                  onCheckedChange={() => toggleRow(q?.id)}
                                />
                              </td>
                              <td className="p-3 font-mono text-[13px]">
                                {q?.registerNumber}
                              </td>
                              <td className="p-3 font-medium text-[13px]">
                                {q?.holderName}
                              </td>
                              <td className="p-3 text-[13px]">{q?.newBank}</td>
                              <td className="p-3 font-mono text-[13px]">
                                {q?.accountNumber}
                              </td>
                              <td className="p-3 font-mono text-[13px] text-muted-foreground">
                                {q?.dividendNumber}
                              </td>
                              <td className="p-3 font-mono text-right text-[13px]">
                                {q?.amount.toLocaleString()}.00
                              </td>
                              <td className="p-3">
                                <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                                  KYC Update
                                </Badge>
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </Card>

                {selectedIds.size > 0 && (
                  <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 py-4 flex items-center justify-between shadow-lg">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {selectedIds.size}
                      </span>{" "}
                      item{selectedIds.size !== 1 ? "s" : ""} selected
                      <span className="mx-2 text-border">·</span>
                      Total:{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        ₦{selectedTotal.toLocaleString()}.00
                      </span>
                    </div>
                    <Button
                      onClick={submitSelected}
                      disabled={submitMandatePaymentsMutation?.isPending}
                    >
                      Submit Selected for Approval
                      {submitMandatePaymentsMutation?.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Records downloaded.")}
                >
                  <Download className="mr-2 h-4 w-4" /> Download Records
                </Button>
              </div>

              {pendingApprIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-medium text-primary">
                    {pendingApprIds.size} record
                    {pendingApprIds.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => openBatchApprReject("pending")}
                    >
                      Reject Selected
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBatchApproveMandate("pending")}
                      disabled={batchApproveMandatePaymentsMutation?.isPending}
                    >
                      Approve Selected
                      {batchApproveMandatePaymentsMutation?.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Card className="mrpsl-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="p-3 w-10">
                        <Checkbox
                          checked={
                            visiblePendingPayments.length > 0 &&
                            visiblePendingPayments.every((r: any) =>
                              pendingApprIds.has(r.id),
                            )
                          }
                          onCheckedChange={() =>
                            togglePendingApprAll(
                              visiblePendingPayments.map((r: any) => r.id),
                            )
                          }
                        />
                      </th>
                      <th className="p-3">DATE</th>
                      <th className="p-3">ACCOUNT</th>
                      <th className="p-3">HOLDER</th>
                      <th className="p-3">NEW BANK</th>
                      <th className="p-3">NEW ACCOUNT NO</th>
                      <th className="p-3">DIVIDEND NO</th>
                      <th className="p-3">AMOUNT (₦)</th>
                      <th className="p-3">SUBMITTED BY</th>
                      <th className="p-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {pendingMandatePaymentsLoading ? (
                      Array.from({ length: pendingPageSize }).map((_, i) => (
                        <tr
                          key={`skeleton-${i}`}
                          className="animate-pulse bg-muted/10"
                        >
                          <td className="p-3">
                            <div className="h-4 w-4 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-20 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-32 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-28 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-20 bg-muted rounded" />
                          </td>
                          <td className="p-3 text-right">
                            <div className="h-4 w-20 bg-muted rounded ml-auto" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                          </td>
                          <td className="p-3 text-right">
                            <div className="h-8 w-28 bg-muted rounded ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : visiblePendingPayments.length > 0 ? (
                      visiblePendingPayments.map((row: any) => (
                        <tr
                          key={row.id}
                          className={`mrpsl-table-row ${pendingApprIds.has(row.id) ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={pendingApprIds.has(row.id)}
                              onCheckedChange={() => togglePendingAppr(row.id)}
                            />
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {row.date}
                          </td>
                          <td className="p-3 font-mono">{row.account}</td>
                          <td className="p-3 font-medium">{row.holderName}</td>
                          <td className="p-3">{row.newBank}</td>
                          <td className="p-3 font-mono">{row.accountNumber}</td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {row.dividendNumber}
                          </td>
                          <td className="p-3 font-mono font-semibold">
                            {row.amount.toLocaleString()}.00
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {row.submittedBy}
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              onClick={() => openReview(row, false)}
                            >
                              Review &amp; Decide
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-3 text-center">
                          No records pending approval.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
              <TablePagination
                page={pendingPage + 1}
                pageSize={pendingPageSize}
                totalPages={pendingTotalPages}
                from={pendingFrom}
                to={pendingTo}
                total={pendingTotal}
                onPageChange={handlePendingPageChange}
                onPageSizeChange={handlePendingPageSizeChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-blue-900">
                      ICU Sign-Off Required
                    </div>
                    <div className="text-[13px] text-blue-700">
                      Items below exceed Tier 3 threshold and require ICU
                      officer sign-off before payment release.
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => toast.success("Records downloaded.")}
                >
                  <Download className="mr-2 h-4 w-4" /> Download Records
                </Button>
              </div>

              {icuApprIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <span className="text-sm font-medium text-primary">
                    {icuApprIds.size} record{icuApprIds.size !== 1 ? "s" : ""}{" "}
                    selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => openBatchApprReject("icu")}
                    >
                      Reject Selected
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBatchApproveMandate("icu")}
                      disabled={batchApproveMandatePaymentsMutation?.isPending}
                    >
                      ICU Approve Selected
                      {batchApproveMandatePaymentsMutation?.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Card className="mrpsl-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="p-3 w-10">
                        <Checkbox
                          checked={
                            visibleIcuPayments.length > 0 &&
                            visibleIcuPayments.every((r: any) =>
                              icuApprIds.has(r.id),
                            )
                          }
                          onCheckedChange={() =>
                            toggleIcuApprAll(
                              visibleIcuPayments.map((r: any) => r.id),
                            )
                          }
                        />
                      </th>
                      <th className="p-3">DATE</th>
                      <th className="p-3">ACCOUNT</th>
                      <th className="p-3">HOLDER</th>
                      <th className="p-3">NEW BANK</th>
                      <th className="p-3">NEW ACCOUNT NO</th>
                      <th className="p-3">DIVIDEND NO</th>
                      <th className="p-3">AMOUNT (₦)</th>
                      <th className="p-3">SUBMITTED BY</th>
                      <th className="p-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {icuMandatePaymentsLoading ? (
                      Array.from({ length: icuPageSize }).map((_, i) => (
                        <tr
                          key={`icu-skeleton-${i}`}
                          className="animate-pulse bg-muted/10"
                        >
                          <td className="p-3">
                            <div className="h-4 w-4 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-20 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-32 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-28 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-20 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-20 bg-muted rounded ml-auto" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-24 bg-muted rounded" />
                          </td>
                          <td className="p-3">
                            <div className="h-8 w-28 bg-muted rounded ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : visibleIcuPayments.length > 0 ? (
                      visibleIcuPayments.map((row: any) => (
                        <tr
                          key={row.id}
                          className={`mrpsl-table-row ${icuApprIds.has(row.id) ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-3">
                            <Checkbox
                              checked={icuApprIds.has(row.id)}
                              onCheckedChange={() => toggleIcuAppr(row.id)}
                            />
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {row.date}
                          </td>
                          <td className="p-3 font-mono">{row.account}</td>
                          <td className="p-3 font-medium">{row.holderName}</td>
                          <td className="p-3">{row.newBank}</td>
                          <td className="p-3 font-mono">{row.accountNumber}</td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {row.dividendNumber}
                          </td>
                          <td className="p-3 font-mono font-bold text-red-600">
                            {row.amount.toLocaleString()}.00
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {row.submittedBy}
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              onClick={() => openReview(row, true)}
                            >
                              Review &amp; Decide
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No items awaiting ICU sign-off.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
              <TablePagination
                page={icuPage + 1}
                pageSize={icuPageSize}
                totalPages={icuTotalPages}
                from={icuFrom}
                to={icuTo}
                total={icuTotal}
                onPageChange={handleIcuPageChange}
                onPageSizeChange={handleIcuPageSizeChange}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* ── Batch Reject Dialog ── */}
      <Dialog open={batchApprRejectOpen} onOpenChange={setBatchApprRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Selected Payments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-8 pb-8">
            <p className="text-sm text-muted-foreground">
              {batchApprTarget === "pending"
                ? pendingApprIds.size
                : icuApprIds.size}{" "}
              payment
              {(batchApprTarget === "pending"
                ? pendingApprIds.size
                : icuApprIds.size) !== 1
                ? "s"
                : ""}{" "}
              will be rejected.
            </p>
            <div className="space-y-2">
              <label className="mrpsl-label">Rejection Comment *</label>
              <Textarea
                value={batchApprComment}
                onChange={(e) => setBatchApprComment(e.target.value)}
                placeholder="Comment is required for rejection..."
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBatchApprRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleBatchApprReject}
                disabled={
                  batchRejectMandatePaymentsMutation?.isPending ||
                  batchApprComment.trim() === ""
                }
              >
                Confirm Rejection
                {batchRejectMandatePaymentsMutation?.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0 gap-0">
          <DialogHeader className="pl-6 pr-14 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="flex-1">
                {isIcu
                  ? "ICU Review — New Mandate"
                  : "Review New Mandate Payment"}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0 h-8 text-[13px]"
                onClick={() => toast.info("Downloading...")}
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </DialogHeader>

          {selected && (
            <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">
              {selected?.tier > 4 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                  This transaction exceeds the standard authorisation threshold
                  (Tier 4). ICU sign-off is required before the payment is
                  released.
                </div>
              )}

              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mrpsl-section-title">Account</div>
                    <div className="font-mono font-bold mt-0.5">
                      {selected.account}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title font-semibold text-[13px]">
                      Holder
                    </div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.holderName ?? selected.holder}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title font-semibold text-[13px]">
                      New Bank
                    </div>
                    <div className="text-sm mt-0.5">
                      {selected.newBank ?? selected.bank}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title font-semibold text-[13px]">
                      New Account No
                    </div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.accountNumber ?? selected.accountNo}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title font-semibold text-[13px]">
                      Dividend No
                    </div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.dividendNumber ?? selected.dividendNo}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Amount</div>
                    <div
                      className={`text-xl tabular-nums font-bold mt-0.5 ${isIcu ? "text-red-600" : "text-primary"}`}
                    >
                      ₦{selected.amount.toLocaleString()}.00
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                  Approval Chain
                </h4>
                <div className="space-y-4">
                  {approvalChainSteps(selected, isIcu).map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done
                            ? "bg-green-100"
                            : step.pending
                              ? "bg-amber-200 animate-pulse"
                              : "border-2 border-muted bg-background"
                          }`}
                      >
                        {step.done && (
                          <Check className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm">{step.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="mrpsl-label">Comment</label>
                <Textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Required for rejection..."
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border/60">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={rejectMandateMutation.isPending}
                >
                  Reject
                  {rejectMandateMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={approveMandateMutation.isPending}
                >
                  {isIcu ? "ICU Sign-Off & Approve" : "Approve Payment"}
                  {approveMandateMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
