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
import { Check, AlertCircle, X } from "lucide-react";
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

const PENDING_MANDATE: MandateApproval[] = [
  {
    id: "MA1",
    date: "05 May 2026",
    account: "DANGCEM-10045",
    holder: "Lukman Bello",
    bank: "UBA",
    accountNo: "0029384812",
    dividendNo: "DIV-2025-001",
    amount: 45000,
    submittedBy: "Chidi Okafor",
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
    submittedBy: "Ngozi Eze",
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
    submittedBy: "Aisha Musa",
    tier: 2,
  },
];

const ICU_MANDATE: MandateApproval[] = [
  {
    id: "IM1",
    date: "03 May 2026",
    account: "DANGCEM-10200",
    holder: "Olumide Adeyemi",
    bank: "Access Bank",
    accountNo: "0076123490",
    dividendNo: "DIV-2025-001",
    amount: 950000,
    submittedBy: "Chidi Okafor",
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
    submittedBy: "Ngozi Eze",
    tier: 4,
  },
];

export default function NewMandatePage() {
  const { registers } = useStore();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<MandateApproval | null>(null);
  const [isIcu, setIsIcu] = useState(false);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [rejectedIsIcu, setRejectedIsIcu] = useState(false);

  function openReview(row: MandateApproval, icu: boolean) {
    setSelected(row);
    setIsIcu(icu);
    setRejectComment("");
    setReviewOpen(true);
  }

  const pendingMandate = PENDING_MANDATE.filter((row) => row.id !== rejectedId);
  const mandatePg = usePagination(pendingMandate);
  const icuMandate = ICU_MANDATE.filter((row) => row.id !== rejectedId);
  const icuPg = usePagination(icuMandate);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            New Mandate Payment Processing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Process dividend payments for accounts with recently updated bank
            details
          </p>
        </div>
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
              <Select>
                <SelectTrigger className="w-48 mrpsl-input">
                  <SelectValue placeholder="Dividend No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="mrpsl-card">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3 w-10">
                      <Checkbox />
                    </th>
                    <th className="p-3">ACCOUNT NO</th>
                    <th className="p-3">HOLDER NAME</th>
                    <th className="p-3">NEW BANK</th>
                    <th className="p-3">NEW ACCOUNT NO</th>
                    <th className="p-3">DIVIDEND NO</th>
                    <th className="p-3 text-right">AMOUNT (₦)</th>
                    <th className="p-3">SOURCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {["DANGCEM-10045", "ZENITHBANK-9921"].map((a) => (
                    <tr key={a} className="hover:bg-accent/5">
                      <td className="p-3">
                        <Checkbox />
                      </td>
                      <td className="p-3 font-mono text-[13px]">{a}</td>
                      <td className="p-3 font-medium">LUKMAN BELLO</td>
                      <td className="p-3 text-[13px]">UBA</td>
                      <td className="p-3 font-mono text-[13px]">0029384812</td>
                      <td className="p-3 font-mono text-[13px] text-muted-foreground">
                        DIV-2025-001
                      </td>
                      <td className="p-3 font-mono text-right">45,000.00</td>
                      <td className="p-3">
                        <Badge className="bg-blue-100 text-blue-800 text-[13px]">
                          KYC Update
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t bg-muted/10 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  2 records selected
                </span>
                <Button
                  onClick={() => toast.success("Submitted for approval.")}
                >
                  Submit Selected for Approval
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="auth">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">NEW BANK</th>
                    <th className="p-3">NEW ACCOUNT NO</th>
                    <th className="p-3">DIVIDEND NO</th>
                    <th className="p-3 text-right">AMOUNT (₦)</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {mandatePg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
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
          </TabsContent>

          <TabsContent value="icu" className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              Items below exceed Tier 3 threshold and require ICU sign-off.
            </div>
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">NEW BANK</th>
                    <th className="p-3">NEW ACCOUNT NO</th>
                    <th className="p-3">DIVIDEND NO</th>
                    <th className="p-3 text-right">AMOUNT (₦)</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {icuPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
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
                        <Button size="sm" onClick={() => openReview(row, true)}>
                          Review &amp; Decide
                        </Button>
                      </td>
                    </tr>
                  ))}
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
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isIcu
                ? "ICU Review — New Mandate Payment"
                : "Review New Mandate Payment"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
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
                  {[
                    {
                      label: `Submitted by ${selected.submittedBy}`,
                      done: true,
                      pending: false,
                    },
                    ...(isIcu
                      ? [
                          {
                            label: "Authoriser — Approved",
                            done: true,
                            pending: false,
                          },
                          {
                            label: "ICU Officer — Pending your sign-off",
                            done: false,
                            pending: true,
                          },
                        ]
                      : [
                          {
                            label: "Authoriser — Pending your action",
                            done: false,
                            pending: true,
                          },
                        ]),
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : step.pending ? "bg-amber-200 animate-pulse" : "border-2 border-muted bg-background"}`}
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
                  onClick={() => {
                    setRejectedId(selected!.id);
                    setRejectedComment(rejectComment);
                    setRejectedIsIcu(isIcu);
                    toast.error("Payment rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success(
                      isIcu
                        ? "ICU sign-off complete. Payment released."
                        : "Payment approved.",
                    );
                    setReviewOpen(false);
                  }}
                >
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
