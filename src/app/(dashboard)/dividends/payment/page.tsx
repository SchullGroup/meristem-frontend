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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Play, Eye, RotateCcw, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";

type RepushRow = {
  acct: string;
  name: string;
  bank: string;
  payNo: string;
  amount: string;
  amountRaw: number;
  reason: string;
  status: "FAILED" | "REJECTED" | "UNPAID";
};

type MandatePaymentRow = {
  id: string;
  account: string;
  holder: string;
  bank: string;
  sortCode: string;
  amount: number;
  dividendNo: string;
  status: "UNPAID" | "FAILED" | "PAID";
};

const NIBSS_PREVIEW: {
  serial: number;
  accountNo: string;
  sortCode: string;
  amount: number;
  accountName: string;
  narration: string;
}[] = [
  {
    serial: 1,
    accountNo: "0029384812",
    sortCode: "044",
    amount: 5400.0,
    accountName: "LUKMAN BELLO",
    narration: "DANGCEM-WRT89412-DIV-PAY001",
  },
  {
    serial: 2,
    accountNo: "3012849001",
    sortCode: "011",
    amount: 5400.0,
    accountName: "FATIMA ABDULLAHI",
    narration: "DANGCEM-WRT89413-DIV-PAY001",
  },
  {
    serial: 3,
    accountNo: "0045612378",
    sortCode: "058",
    amount: 5400.0,
    accountName: "EMEKA EZE",
    narration: "DANGCEM-WRT89414-DIV-PAY001",
  },
  {
    serial: 4,
    accountNo: "0076123490",
    sortCode: "044",
    amount: 5400.0,
    accountName: "OLUMIDE ADEYEMI",
    narration: "DANGCEM-WRT89415-DIV-PAY001",
  },
  {
    serial: 5,
    accountNo: "2012341290",
    sortCode: "057",
    amount: 5400.0,
    accountName: "NGOZI EZE",
    narration: "DANGCEM-WRT89416-DIV-PAY001",
  },
];

const INITIAL_MANDATE_QUEUE: MandatePaymentRow[] = [
  {
    id: "MP1",
    account: "DANGCEM-10200",
    holder: "Olumide Adeyemi",
    bank: "Access Bank",
    sortCode: "044",
    amount: 950000,
    dividendNo: "DIV-2025-001",
    status: "UNPAID",
  },
  {
    id: "MP2",
    account: "ACCESS-00553",
    holder: "Ngozi Eze",
    bank: "Zenith Bank",
    sortCode: "057",
    amount: 1200000,
    dividendNo: "DIV-2025-003",
    status: "UNPAID",
  },
  {
    id: "MP3",
    account: "ZENITH-9901",
    holder: "Adaeze Okonkwo",
    bank: "GTBank",
    sortCode: "058",
    amount: 85000,
    dividendNo: "DIV-2025-001",
    status: "FAILED",
  },
];

const INITIAL_REPUSH: RepushRow[] = [
  {
    acct: "GTCO-10044",
    name: "Emeka Eze",
    bank: "GTBank",
    payNo: "PAY-2024-GTCO-002",
    amount: "3,200.00",
    amountRaw: 3200,
    reason: "Invalid account number",
    status: "FAILED",
  },
  {
    acct: "GTCO-10091",
    name: "Adaeze Okafor",
    bank: "First Bank",
    payNo: "PAY-2024-GTCO-002",
    amount: "18,750.00",
    amountRaw: 18750,
    reason: "Account frozen",
    status: "REJECTED",
  },
];

function statusBadge(status: MandatePaymentRow["status"]) {
  if (status === "PAID")
    return (
      <Badge className="border-0 text-[13px] bg-green-100 text-green-800">
        Paid
      </Badge>
    );
  if (status === "FAILED")
    return (
      <Badge className="border-0 text-[13px] bg-red-100 text-red-700">
        Failed
      </Badge>
    );
  return (
    <Badge className="border-0 text-[13px] bg-amber-100 text-amber-800">
      Unpaid
    </Badge>
  );
}

function repushStatusBadge(status: RepushRow["status"]) {
  if (status === "FAILED")
    return (
      <Badge className="border-0 text-[13px] bg-red-100 text-red-700">
        Failed
      </Badge>
    );
  if (status === "REJECTED")
    return (
      <Badge className="border-0 text-[13px] bg-orange-100 text-orange-700">
        Rejected
      </Badge>
    );
  return (
    <Badge className="border-0 text-[13px] bg-amber-100 text-amber-800">
      Unpaid
    </Badge>
  );
}

export default function PaymentPage() {
  const { registers, dividendDeclarations } = useStore();
  const authDivs = dividendDeclarations.filter(
    (d) => d.status === "AUTHORIZED",
  );
  const [selectedDiv, setSelectedDiv] = useState("");
  const [gateway, setGateway] = useState("nibss");
  const [payRunInitiated, setPayRunInitiated] = useState(false);

  const [mandateQueue, setMandateQueue] = useState<MandatePaymentRow[]>(
    INITIAL_MANDATE_QUEUE,
  );
  const [mandateRegister, setMandateRegister] = useState("all");
  const [mandateStatus, setMandateStatus] = useState("all");

  const [repushRows, setRepushRows] = useState<RepushRow[]>(INITIAL_REPUSH);
  const [repushStatusFlt, setRepushStatusFlt] = useState("all");
  const [repushConfirmOpen, setRepushConfirmOpen] = useState(false);
  const [repushTarget, setRepushTarget] = useState<RepushRow | null>(null);

  const today = new Date();
  const dateTag = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  const filteredMandateQueue = mandateQueue.filter((r) => {
    const regMatch =
      mandateRegister === "all" || r.account.startsWith(mandateRegister);
    const statusMatch = mandateStatus === "all" || r.status === mandateStatus;
    return regMatch && statusMatch;
  });

  const filteredRepush = repushRows.filter(
    (r) => repushStatusFlt === "all" || r.status === repushStatusFlt,
  );

  function initiatePaymentRun() {
    setPayRunInitiated(true);
    toast.info("Preview generated. Review the NIBSS file below, then approve.");
  }

  function approvePaymentRun() {
    const seq = Math.floor(1000 + Math.random() * 9000);
    toast.success(
      `Payment run PAY-DIV-${seq}-${dateTag} submitted for ICU approval.`,
    );
    setPayRunInitiated(false);
  }

  function pushToNibss(id: string) {
    setMandateQueue((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "PAID" } : r)),
    );
    const row = mandateQueue.find((r) => r.id === id);
    toast.success(`Payment pushed to NIBSS for ${row?.holder ?? id}.`);
  }

  function openRepushConfirm(row: RepushRow) {
    setRepushTarget(row);
    setRepushConfirmOpen(true);
  }

  function confirmRepush() {
    if (!repushTarget) return;
    toast.success(`Re-push initiated for account ${repushTarget.acct}.`);
    setRepushConfirmOpen(false);
    setRepushTarget(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dividend Payment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Initiate and track dividend disbursement via NIBSS and Remita
        </p>
      </div>

      <Tabs defaultValue="decl" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="decl"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Declaration Payments
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Mandate Payments
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Payment History
          </TabsTrigger>
          <TabsTrigger
            value="repush"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Re-Push Queue
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="decl" className="space-y-6">
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="w-48 mrpsl-input">
                  <SelectValue placeholder="Register" />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedDiv}
                onValueChange={(v) => setSelectedDiv(v || "")}
              >
                <SelectTrigger className="w-64 mrpsl-input">
                  <SelectValue placeholder="Dividend" />
                </SelectTrigger>
                <SelectContent>
                  {authDivs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.paymentNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="Unpaid">
                <SelectTrigger className="w-48 mrpsl-input">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <Card className="p-4">
                <div className="mrpsl-section-title">Total Eligible</div>
                <div className="text-2xl font-mono mt-1 font-bold">180,248</div>
              </Card>
              <Card className="p-4">
                <div className="mrpsl-section-title">Total Amount (₦)</div>
                <div className="text-xl font-mono mt-1 font-bold">69.01B</div>
              </Card>
              <Card className="p-4">
                <div className="mrpsl-section-title">Paid</div>
                <div className="text-2xl font-mono mt-1 font-bold text-green-600">
                  0
                </div>
              </Card>
              <Card className="p-4">
                <div className="mrpsl-section-title">Unpaid</div>
                <div className="text-2xl font-mono mt-1 font-bold text-amber-600">
                  180,248
                </div>
              </Card>
              <Card className="p-4">
                <div className="mrpsl-section-title">Failed</div>
                <div className="text-2xl font-mono mt-1 font-bold text-red-600">
                  0
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 space-y-4">
                <Card className="p-4 border-l-4 border-primary bg-muted/10">
                  <h3 className="font-semibold text-sm mb-3">
                    Select Payment Gateway
                  </h3>
                  <RadioGroup
                    value={gateway}
                    onValueChange={setGateway}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nibss" id="g1" />
                      <label htmlFor="g1" className="text-sm font-medium">
                        NIBSS
                        <br />
                        <span className="text-[13px] text-muted-foreground font-normal">
                          Nigeria Inter-Bank Settlement System
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="remita" id="g2" />
                      <label htmlFor="g2" className="text-sm font-medium">
                        Remita
                        <br />
                        <span className="text-[13px] text-muted-foreground font-normal">
                          Remita by SystemSpecs
                        </span>
                      </label>
                    </div>
                  </RadioGroup>
                </Card>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={initiatePaymentRun}
                >
                  <Play className="mr-2 h-4 w-4" /> Initiate Payment Run
                </Button>

                {payRunInitiated && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    onClick={approvePaymentRun}
                  >
                    Approve Payment Run
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toast.success("NIBSS file PAY-DIV-9283.txt downloaded")
                  }
                >
                  <Download className="mr-2 h-4 w-4" /> Download NIBSS File
                  (.txt)
                </Button>
              </div>

              <div className="col-span-2">
                <Card className="mrpsl-card overflow-hidden">
                  <div className="p-3 bg-muted/20 border-b text-[13px] font-mono font-bold text-muted-foreground">
                    PREVIEW (5 ROWS)
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="p-3">SERIAL NO</th>
                        <th className="p-3">ACCOUNT NO</th>
                        <th className="p-3">BANK SORT CODE</th>
                        <th className="p-3 text-right">AMOUNT (₦)</th>
                        <th className="p-3">ACCOUNT NAME</th>
                        <th className="p-3">NARRATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-[13px]">
                      {NIBSS_PREVIEW.map((row) => (
                        <tr key={row.serial} className="hover:bg-accent/5">
                          <td className="p-3 text-muted-foreground">
                            {String(row.serial).padStart(3, "0")}
                          </td>
                          <td className="p-3">{row.accountNo}</td>
                          <td className="p-3">{row.sortCode}</td>
                          <td className="p-3 text-right tabular-nums">
                            {row.amount.toLocaleString("en-NG", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3">{row.accountName}</td>
                          <td className="p-3 text-muted-foreground">
                            {row.narration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="flex gap-3">
              <Select
                value={mandateRegister}
                onValueChange={(v) => setMandateRegister(v ?? "all")}
              >
                <SelectTrigger className="w-48 mrpsl-input">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registers</SelectItem>
                  {registers
                    .filter((r) => r.status === "ACTIVE")
                    .map((r) => (
                      <SelectItem key={r.id} value={r.symbol}>
                        {r.symbol}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={mandateStatus}
                onValueChange={(v) => setMandateStatus(v ?? "all")}
              >
                <SelectTrigger className="w-40 mrpsl-input">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">ACCOUNT NO</th>
                    <th className="p-3">HOLDER NAME</th>
                    <th className="p-3">NEW BANK</th>
                    <th className="p-3">SORT CODE</th>
                    <th className="p-3 text-right">AMOUNT (₦)</th>
                    <th className="p-3">DIVIDEND NO</th>
                    <th className="p-3">PAYMENT STATUS</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {filteredMandateQueue.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3">{row.bank}</td>
                      <td className="p-3 font-mono">{row.sortCode}</td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        ₦{row.amount.toLocaleString()}.00
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.dividendNo}
                      </td>
                      <td className="p-3">{statusBadge(row.status)}</td>
                      <td className="p-3 text-right">
                        {row.status !== "PAID" && (
                          <Button
                            size="sm"
                            className="h-7 text-[13px]"
                            onClick={() => pushToNibss(row.id)}
                          >
                            Push to NIBSS
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredMandateQueue.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No records match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">PAY RUN REF</th>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">GATEWAY</th>
                      <th className="px-4 py-3">TOTAL RECORDS</th>
                      <th className="px-4 py-3">AMOUNT (₦)</th>
                      <th className="px-4 py-3">DATE RUN</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {[
                      {
                        ref: "PAYRUN-2025-001",
                        payNo: "PAY-2025-DANGCEM-001",
                        reg: "DANGCEM",
                        gw: "NIBSS",
                        records: 180248,
                        amount: "69.01B",
                        date: "15 Jan 2025",
                        status: "PAID",
                      },
                      {
                        ref: "PAYRUN-2024-003",
                        payNo: "PAY-2024-ACCESSCORP-003",
                        reg: "ACCESS",
                        gw: "Remita",
                        records: 92410,
                        amount: "12.5B",
                        date: "03 Nov 2024",
                        status: "PAID",
                      },
                      {
                        ref: "PAYRUN-2024-002",
                        payNo: "PAY-2024-GTCO-002",
                        reg: "GTCO",
                        gw: "NIBSS",
                        records: 134000,
                        amount: "8.3B",
                        date: "28 Jul 2024",
                        status: "FAILED",
                      },
                    ].map((row) => (
                      <tr key={row.ref} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {row.ref}
                        </td>
                        <td className="px-4 py-3 font-mono">{row.payNo}</td>
                        <td className="px-4 py-3 font-semibold">{row.reg}</td>
                        <td className="px-4 py-3">{row.gw}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.records.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          ₦{row.amount}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.date}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`border-0 text-[13px] ${row.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                          >
                            {row.status === "PAID" ? "Paid" : "Failed"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[13px]"
                              onClick={() => toast.info("Payment run details")}
                            >
                              <Eye className="mr-1 h-3 w-3" /> View
                            </Button>
                            {row.status === "FAILED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[13px] text-amber-600"
                                onClick={() =>
                                  toast.success("Added to re-push queue")
                                }
                              >
                                <RotateCcw className="mr-1 h-3 w-3" /> Re-push
                              </Button>
                            )}
                            {row.status === "PAID" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[13px]"
                                onClick={() =>
                                  toast.success("Receipt downloaded")
                                }
                              >
                                <Download className="mr-1 h-3 w-3" /> Receipt
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="repush" className="space-y-4">
            <div className="flex gap-3">
              <Select
                value={repushStatusFlt}
                onValueChange={(v) => setRepushStatusFlt(v ?? "all")}
              >
                <SelectTrigger className="w-44 mrpsl-input">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">ACCOUNT NO</th>
                      <th className="px-4 py-3">HOLDER NAME</th>
                      <th className="px-4 py-3">BANK</th>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3">AMOUNT (₦)</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3">FAIL REASON</th>
                      <th className="px-4 py-3">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[13px]">
                    {filteredRepush.map((row) => (
                      <tr key={row.acct} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono">{row.acct}</td>
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3">{row.bank}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {row.payNo}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          ₦{row.amount}
                        </td>
                        <td className="px-4 py-3">
                          {repushStatusBadge(row.status)}
                        </td>
                        <td className="px-4 py-3 text-red-600">{row.reason}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[13px]"
                              onClick={() => toast.info("Holder details")}
                            >
                              <Eye className="mr-1 h-3 w-3" /> View Holder
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-[13px]"
                              onClick={() => openRepushConfirm(row)}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" /> Re-push
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRepush.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No records match the selected status.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={repushConfirmOpen} onOpenChange={setRepushConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle>Confirm Re-Push</DialogTitle>
            </div>
            <DialogDescription>
              {repushTarget &&
                `Account ${repushTarget.acct} · ₦${repushTarget.amount} via ${repushTarget.bank}`}
            </DialogDescription>
          </DialogHeader>

          {repushTarget && (
            <div className="space-y-3 px-1">
              <div className="bg-muted/30 rounded-xl border p-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Account
                  </div>
                  <div className="font-mono font-bold mt-0.5">
                    {repushTarget.acct}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Holder
                  </div>
                  <div className="font-medium mt-0.5">{repushTarget.name}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Bank
                  </div>
                  <div className="mt-0.5">{repushTarget.bank}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Amount
                  </div>
                  <div className="font-mono font-bold mt-0.5 text-base">
                    ₦{repushTarget.amount}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Fail Reason
                  </div>
                  <div className="text-red-600 mt-0.5">
                    {repushTarget.reason}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will re-submit the payment to the gateway. Ensure the
                underlying issue has been resolved before proceeding.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              className="text-sm font-bold px-6 h-11"
              onClick={() => setRepushConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="text-sm font-bold px-8 h-11 rounded-xl"
              onClick={confirmRepush}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Confirm Re-Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
