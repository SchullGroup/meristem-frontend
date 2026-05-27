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
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Check, AlertCircle, X, Download } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

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

type QueueRow = {
  id: string;
  account: string;
  holder: string;
  bank: string;
  accountNo: string;
  dividendNo: string;
  amount: number;
};

const QUEUE_DATA: QueueRow[] = [
  {
    id: "Q1",
    account: "DANGCEM-10045",
    holder: "Lukman Bello",
    bank: "UBA",
    accountNo: "0029384812",
    dividendNo: "DIV-2025-001",
    amount: 45000,
  },
  {
    id: "Q2",
    account: "ZENITHBANK-9921",
    holder: "Fatima Abdullahi",
    bank: "First Bank",
    accountNo: "3012849001",
    dividendNo: "DIV-2025-001",
    amount: 128500,
  },
  {
    id: "Q3",
    account: "DANGCEM-10102",
    holder: "Emeka Eze",
    bank: "GTBank",
    accountNo: "0045612378",
    dividendNo: "DIV-2025-002",
    amount: 62000,
  },
];

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
  const { registers } = useStore();

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
  const [selected, setSelected] = useState<MandateApproval | null>(null);
  const [isIcu, setIsIcu] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const mandatePg = usePagination(pendingMandate);
  const icuPg = usePagination(icuMandate);

  const allSelected =
    queueLoaded &&
    QUEUE_DATA.length > 0 &&
    QUEUE_DATA.every((r) => selectedIds.has(r.id));
  const selectedTotal = QUEUE_DATA.filter((r) => selectedIds.has(r.id)).reduce(
    (s, r) => s + r.amount,
    0,
  );

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(QUEUE_DATA.map((r) => r.id)));
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
    toast.success("Submitted for approval. Authoriser notified.");
    setQueueLoaded(false);
    setSelectedIds(new Set());
  }

  function openReview(row: MandateApproval, icu: boolean) {
    setSelected(row);
    setIsIcu(icu);
    setRejectComment("");
    setReviewOpen(true);
  }

  function handleApprove() {
    if (!selected) return;
    if (isIcu) {
      toast.success("ICU approved. Queued for payment processing.");
      setIcuMandate((prev) => prev.filter((r) => r.id !== selected.id));
    } else {
      toast.success("Approved. Forwarded to ICU for sign-off.");
      setPendingMandate((prev) => prev.filter((r) => r.id !== selected.id));
    }
    setReviewOpen(false);
  }

  function handleReject() {
    if (!selected) return;
    setRejectedId(selected.id);
    setRejectedComment(rejectComment);
    setRejectedIsIcu(isIcu);
    if (isIcu) {
      setIcuMandate((prev) => prev.filter((r) => r.id !== selected.id));
    } else {
      setPendingMandate((prev) => prev.filter((r) => r.id !== selected.id));
    }
    toast.error("Payment rejected.");
    setReviewOpen(false);
  }

  const approvalChainSteps = (row: MandateApproval, icu: boolean) => {
    const base = [
      {
        label: `Submitted by ${row.submittedBy} · 06 May 2026, 09:14`,
        done: true,
        pending: false,
      },
    ];
    if (icu) {
      return [
        ...base,
        {
          label: "Emeka Obiora (Authoriser) · Approved · 07 May 2026, 11:02",
          done: true,
          pending: false,
        },
        {
          label: "Fatimah Lawal (ICU Officer) · Pending your sign-off",
          done: false,
          pending: true,
        },
      ];
    }
    return [
      ...base,
      {
        label: "Emeka Obiora (Authoriser) · Pending your action",
        done: false,
        pending: true,
      },
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
  function handleBatchApproveMandate(target: "pending" | "icu") {
    const ids = target === "pending" ? pendingApprIds : icuApprIds;
    if (target === "pending") {
      setPendingMandate((prev) => prev.filter((r) => !ids.has(r.id)));
      setPendingApprIds(new Set());
      toast.success(
        `${ids.size} payment${ids.size !== 1 ? "s" : ""} approved. Forwarded to ICU.`,
      );
    } else {
      setIcuMandate((prev) => prev.filter((r) => !ids.has(r.id)));
      setIcuApprIds(new Set());
      toast.success(
        `${ids.size} payment${ids.size !== 1 ? "s" : ""} ICU approved. Queued for payment.`,
      );
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
      setPendingMandate((prev) => prev.filter((r) => !ids.has(r.id)));
      setPendingApprIds(new Set());
    } else {
      setIcuMandate((prev) => prev.filter((r) => !ids.has(r.id)));
      setIcuApprIds(new Set());
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
                  {registers
                    .filter((r) => r.status === "ACTIVE")
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.symbol}
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
                  <SelectItem value="DIV-2025-001">DIV-2025-001</SelectItem>
                  <SelectItem value="DIV-2025-002">DIV-2025-002</SelectItem>
                  <SelectItem value="DIV-2025-003">DIV-2025-003</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setQueueLoaded(true);
                  setSelectedIds(new Set());
                }}
              >
                Load Accounts
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
                      {QUEUE_DATA.map((row) => (
                        <tr key={row.id} className="hover:bg-accent/5">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedIds.has(row.id)}
                              onCheckedChange={() => toggleRow(row.id)}
                            />
                          </td>
                          <td className="p-3 font-mono text-[13px]">
                            {row.account}
                          </td>
                          <td className="p-3 font-medium text-[13px]">
                            {row.holder}
                          </td>
                          <td className="p-3 text-[13px]">{row.bank}</td>
                          <td className="p-3 font-mono text-[13px]">
                            {row.accountNo}
                          </td>
                          <td className="p-3 font-mono text-[13px] text-muted-foreground">
                            {row.dividendNo}
                          </td>
                          <td className="p-3 font-mono text-right text-[13px]">
                            {row.amount.toLocaleString()}.00
                          </td>
                          <td className="p-3">
                            <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                              KYC Update
                            </Badge>
                          </td>
                        </tr>
                      ))}
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
                    <Button onClick={submitSelected}>
                      Submit Selected for Approval
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
                    >
                      Approve Selected
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
                            mandatePg.paged.length > 0 &&
                            mandatePg.paged.every((r) =>
                              pendingApprIds.has(r.id),
                            )
                          }
                          onCheckedChange={() =>
                            togglePendingApprAll(
                              mandatePg.paged.map((r) => r.id),
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
                    {mandatePg.paged.map((row) => (
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
                        <td className="p-3 font-medium">{row.holder}</td>
                        <td className="p-3">{row.bank}</td>
                        <td className="p-3 font-mono">{row.accountNo}</td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {row.dividendNo}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold">
                          {row.amount.toLocaleString()}.00
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {row.submittedBy}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => openReview(row, false)}
                          >
                            Review &amp; Decide
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {mandatePg.paged.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No records pending approval.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
              <TablePagination
                page={mandatePg.page}
                pageSize={mandatePg.pageSize}
                totalPages={mandatePg.totalPages}
                from={mandatePg.from}
                to={mandatePg.to}
                total={mandatePg.total}
                onPageChange={mandatePg.setPage}
                onPageSizeChange={mandatePg.setPageSize}
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
                    >
                      ICU Approve Selected
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
                            icuPg.paged.length > 0 &&
                            icuPg.paged.every((r) => icuApprIds.has(r.id))
                          }
                          onCheckedChange={() =>
                            toggleIcuApprAll(icuPg.paged.map((r) => r.id))
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
                    {icuPg.paged.map((row) => (
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
                        <td className="p-3 font-medium">{row.holder}</td>
                        <td className="p-3">{row.bank}</td>
                        <td className="p-3 font-mono">{row.accountNo}</td>
                        <td className="p-3 font-mono text-muted-foreground">
                          {row.dividendNo}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-red-600">
                          {row.amount.toLocaleString()}.00
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {row.submittedBy}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => openReview(row, true)}
                          >
                            Review &amp; Decide
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {icuPg.paged.length === 0 && (
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
                page={icuPg.page}
                pageSize={icuPg.pageSize}
                totalPages={icuPg.totalPages}
                from={icuPg.from}
                to={icuPg.to}
                total={icuPg.total}
                onPageChange={icuPg.setPage}
                onPageSizeChange={icuPg.setPageSize}
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
              >
                Confirm Rejection
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
              {isIcu && (
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
                    <div className="mrpsl-section-title">Holder</div>
                    <div className="font-semibold text-sm mt-0.5">
                      {selected.holder}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">New Bank</div>
                    <div className="text-sm mt-0.5">{selected.bank}</div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">New Account No</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.accountNo}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Dividend No</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.dividendNo}
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
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          step.done
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
                >
                  Reject
                </Button>
                <Button className="flex-1" onClick={handleApprove}>
                  {isIcu ? "ICU Sign-Off & Approve" : "Approve Payment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
