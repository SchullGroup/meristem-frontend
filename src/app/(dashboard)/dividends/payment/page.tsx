"use client";

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";
import { RepushQueue } from "@/components/custom/dividend-payments/re-push-queue";
import { NewMandatePayment } from "@/components/custom/dividend-payments/new-mandate";
import { PaymentHistory } from "@/components/custom/dividend-payments/payment-history";
import DeclarationPayment from "@/components/custom/dividend-payments/declaration-payment";

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

const HISTORY_ROWS = [
  {
    ref: "PAYRUN-2025-001",
    payNo: "PAY-2025-DANGCEM-001",
    reg: "DANGCEM",
    gw: "NIBSS",
    records: 180248,
    amount: "69.01B",
    amountRaw: 69010000000,
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
    amountRaw: 12500000000,
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
    amountRaw: 8300000000,
    date: "28 Jul 2024",
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
  const { registers, shareholders, dividendDeclarations } = useStore();
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

  const [payRunViewOpen, setPayRunViewOpen] = useState(false);
  const [payRunViewTarget, setPayRunViewTarget] = useState<
    (typeof HISTORY_ROWS)[0] | null
  >(null);

  const [holderViewOpen, setHolderViewOpen] = useState(false);
  const [holderViewTarget, setHolderViewTarget] = useState<RepushRow | null>(
    null,
  );

  const [mandateSelIds, setMandateSelIds] = useState<Set<string>>(new Set());

  function toggleMandateSel(id: string) {
    setMandateSelIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }
  function toggleMandateAll(ids: string[]) {
    setMandateSelIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }
  function batchPushToNibss() {
    const eligible = filteredMandateQueue.filter(
      (r) => mandateSelIds.has(r.id) && r.status !== "PAID",
    );
    setMandateQueue((prev) =>
      prev.map((r) =>
        mandateSelIds.has(r.id) && r.status !== "PAID"
          ? { ...r, status: "PAID" }
          : r,
      ),
    );
    setMandateSelIds(new Set());
    toast.success(
      `${eligible.length} payment${eligible.length !== 1 ? "s" : ""} pushed to NIBSS.`,
    );
  }

  const selectedDivDecl = authDivs.find((d) => d.id === selectedDiv);
  const selectedReg = registers.find(
    (r) => r.id === selectedDivDecl?.registerId,
  );
  const divRate = selectedDivDecl?.rate ?? 0;

  const paymentRows = shareholders.map((s, i) => ({
    serial: i + 1,
    accountNo: s.accountNumber,
    holderName: `${s.firstName} ${s.lastName}`,
    sortCode: ["044", "058", "011", "057", "035"][i % 5],
    amount: s.holdings * divRate,
    narration: `${selectedReg?.symbol ?? "REG"}-WRT${String(89410 + i).padStart(5, "0")}-DIV-PAY001`,
    status: "UNPAID" as const,
  }))

  const paymentPg = usePagination(paymentRows);

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

            <DeclarationPayment tab="decl" />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <NewMandatePayment tab="new" />
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistory tab="history" />
          </TabsContent>

          <TabsContent value="repush" className="space-y-4">
            <RepushQueue tab="repush" />
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}
