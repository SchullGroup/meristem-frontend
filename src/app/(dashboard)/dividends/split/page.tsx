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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, AlertCircle, X } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type SplitApproval = {
  id: string;
  date: string;
  warrantNo: string;
  account: string;
  holder: string;
  totalAmount: number;
  parts: number;
  submittedBy: string;
};

const PENDING_SPLITS: SplitApproval[] = [
  {
    id: "SP1",
    date: "05 May 2026",
    warrantNo: "WRT-89412",
    account: "DANGCEM-10029",
    holder: "Adaeze Okonkwo",
    totalAmount: 45000,
    parts: 2,
    submittedBy: "Chidi Okafor",
  },
  {
    id: "SP2",
    date: "04 May 2026",
    warrantNo: "WRT-89330",
    account: "ZENITH-9710",
    holder: "Emeka Ude",
    totalAmount: 184000,
    parts: 3,
    submittedBy: "Ngozi Eze",
  },
];

const SPLIT_PARTS: Record<string, { account: string; amount: number }[]> = {
  SP1: [
    { account: "DANGCEM-10029", amount: 25000 },
    { account: "DANGCEM-10030", amount: 20000 },
  ],
  SP2: [
    { account: "ZENITH-9710", amount: 80000 },
    { account: "ZENITH-9711", amount: 60000 },
    { account: "ZENITH-9712", amount: 44000 },
  ],
};

export default function DivSplitPage() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<SplitApproval | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  function openReview(row: SplitApproval) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

  const pendingSplits = PENDING_SPLITS.filter((row) => row.id !== rejectedId);
  const splitPg = usePagination(pendingSplits);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dividend Split</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Split a single dividend warrant to multiple destination accounts
          </p>
        </div>
      </div>

      <Tabs defaultValue="split" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="split"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Split
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="split" className="space-y-6">
            {rejectedId && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm text-red-800">
                    Request Rejected — ID: {rejectedId}
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
            <div className="grid grid-cols-2 gap-6">
              <Card className="mrpsl-card p-6 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Step 1: Locate Eligible Dividend
                </h3>
                <div className="space-y-4">
                  <Select>
                    <SelectTrigger className="mrpsl-input">
                      <SelectValue placeholder="Register" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x">DANGCEM</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Account Search"
                      className="mrpsl-input"
                    />
                    <Button variant="outline">Lookup</Button>
                  </div>
                  <Select>
                    <SelectTrigger className="mrpsl-input">
                      <SelectValue placeholder="Select Dividend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x">DIV-2025-001</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted/20 p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Warrant No
                    </span>
                    <span className="font-mono font-medium">WRT-89412</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Net Amount
                    </span>
                    <span className="font-mono font-bold text-green-600">
                      ₦45,000.00
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <span className="text-[13px] bg-amber-100 text-amber-800 px-2 rounded">
                      UNPAID
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="mrpsl-card p-6 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Step 2: Configure Split
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Number of Parts</label>
                    <Select defaultValue="2">
                      <SelectTrigger className="mrpsl-input w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Destination Account"
                        className="mrpsl-input flex-1"
                      />
                      <Input
                        type="number"
                        defaultValue="25000"
                        className="mrpsl-input w-32 font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Destination Account"
                        className="mrpsl-input flex-1"
                      />
                      <Input
                        type="number"
                        defaultValue="20000"
                        className="mrpsl-input w-32 font-mono"
                      />
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded text-sm font-mono text-center">
                    Total: ₦45,000.00 / ₦45,000.00 ✓
                  </div>
                  <Textarea
                    placeholder="Reason..."
                    className="focus-visible:ring-primary"
                  />
                  <Button
                    className="w-full"
                    onClick={() => toast.success("Split submitted")}
                  >
                    Submit for Approval
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="auth">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">WARRANT NO</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3 text-right">TOTAL AMOUNT (₦)</th>
                    <th className="p-3 text-right">PARTS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {splitPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.warrantNo}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {row.totalAmount.toLocaleString()}.00
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {row.parts}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => openReview(row)}>
                          Review &amp; Decide
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={splitPg.page}
              pageSize={splitPg.pageSize}
              totalPages={splitPg.totalPages}
              from={splitPg.from}
              to={splitPg.to}
              total={splitPg.total}
              onPageChange={splitPg.setPage}
              onPageSizeChange={splitPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Dividend Split</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mrpsl-section-title">Warrant No</div>
                    <div className="font-mono font-bold mt-0.5">
                      {selected.warrantNo}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Account</div>
                    <div className="font-mono text-sm mt-0.5">
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
                    <div className="mrpsl-section-title">Total Amount</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5 text-primary">
                      ₦{selected.totalAmount.toLocaleString()}.00
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                  Split Breakdown ({selected.parts} parts)
                </h4>
                <div className="space-y-2">
                  {(SPLIT_PARTS[selected.id] ?? []).map((part, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0"
                    >
                      <span className="text-sm font-mono text-muted-foreground">
                        {part.account}
                      </span>
                      <span className="text-sm font-mono font-semibold">
                        ₦{part.amount.toLocaleString()}.00
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold text-sm">
                    <span>Total</span>
                    <span className="font-mono text-primary">
                      ₦{selected.totalAmount.toLocaleString()}.00
                    </span>
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
                    {
                      label: "Authoriser — Pending your action",
                      done: false,
                      pending: true,
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100" : "bg-amber-200 animate-pulse"}`}
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
                    toast.error("Split rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success("Dividend split approved.");
                    setReviewOpen(false);
                  }}
                >
                  Approve Split
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
