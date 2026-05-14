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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, AlertTriangle, AlertCircle, X } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type MarkOffApproval = {
  id: string;
  date: string;
  warrantNo: string;
  account: string;
  holder: string;
  dividend: string;
  amount: number;
  submittedBy: string;
};
type MarkOffHistory = {
  id: string;
  date: string;
  warrantNo: string;
  account: string;
  holder: string;
  amount: number;
  markedBy: string;
  status: string;
};

const PENDING_MARKOFF: MarkOffApproval[] = [
  {
    id: "MO1",
    date: "05 May 2026",
    warrantNo: "WRT-10291",
    account: "DANGCEM-10045",
    holder: "Lukman Bello",
    dividend: "DIV-2025-001",
    amount: 45000,
    submittedBy: "Chidi Okafor",
  },
  {
    id: "MO2",
    date: "04 May 2026",
    warrantNo: "WRT-10345",
    account: "ZENITH-9921",
    holder: "Fatima Abdullahi",
    dividend: "DIV-2025-001",
    amount: 128500,
    submittedBy: "Ngozi Eze",
  },
  {
    id: "MO3",
    date: "04 May 2026",
    warrantNo: "WRT-10412",
    account: "DANGCEM-10102",
    holder: "Emeka Eze",
    dividend: "DIV-2025-002",
    amount: 62000,
    submittedBy: "Aisha Musa",
  },
];

const MARKOFF_HISTORY: MarkOffHistory[] = [
  {
    id: "H1",
    date: "30 Apr 2026",
    warrantNo: "WRT-10100",
    account: "DANGCEM-10001",
    holder: "Ada Nwosu",
    amount: 37500,
    markedBy: "Chidi Okafor",
    status: "APPROVED",
  },
  {
    id: "H2",
    date: "29 Apr 2026",
    warrantNo: "WRT-10099",
    account: "ZENITH-8810",
    holder: "Bello Musa",
    amount: 210000,
    markedBy: "Ngozi Eze",
    status: "APPROVED",
  },
  {
    id: "H3",
    date: "28 Apr 2026",
    warrantNo: "WRT-10088",
    account: "DANGCEM-10030",
    holder: "Sola Adeyemo",
    amount: 55000,
    markedBy: "Aisha Musa",
    status: "REJECTED",
  },
  {
    id: "H4",
    date: "27 Apr 2026",
    warrantNo: "WRT-10075",
    account: "ACCESS-00220",
    holder: "Ifeoma Okafor",
    amount: 98000,
    markedBy: "Chidi Okafor",
    status: "APPROVED",
  },
  {
    id: "H5",
    date: "25 Apr 2026",
    warrantNo: "WRT-10060",
    account: "DANGCEM-10055",
    holder: "Tunde Badmus",
    amount: 19500,
    markedBy: "Ngozi Eze",
    status: "APPROVED",
  },
];

export default function MarkOffPage() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<MarkOffApproval | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  function openReview(row: MarkOffApproval) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

  const pendingMarkoff = PENDING_MARKOFF.filter((row) => row.id !== rejectedId);
  const markoffPg = usePagination(pendingMarkoff);
  const historyPg = usePagination(MARKOFF_HISTORY);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Warrant Mark-Off
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Flag dividend warrants as paid (manual or bulk)
          </p>
        </div>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="manual"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Manual Mark-Off
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            En Bloc Mark-Off
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="manual" className="space-y-6">
            {rejectedId && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-sm text-red-800">
                    Mark-Off Rejected — ID: {rejectedId}
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
            <Card className="mrpsl-card p-6 max-w-xl mx-auto space-y-4 mt-12">
              <h3 className="font-semibold text-lg text-center mb-2">
                Find Warrant
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Warrant No / Account No / CHN"
                  className="mrpsl-input"
                />
                <Button>Search</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card className="mrpsl-card p-4 flex gap-4">
              <Select>
                <SelectTrigger className="w-64 mrpsl-input">
                  <SelectValue placeholder="Register" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="x">DANGCEM</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Date Range</Button>
              <Button>Load Unpaid Warrants</Button>
            </Card>
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
                    <th className="p-3">DIVIDEND</th>
                    <th className="p-3 text-right">AMOUNT (₦)</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {markoffPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.warrantNo}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 text-muted-foreground">
                        {row.dividend}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {row.amount.toLocaleString()}.00
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
              page={markoffPg.page}
              pageSize={markoffPg.pageSize}
              totalPages={markoffPg.totalPages}
              from={markoffPg.from}
              to={markoffPg.to}
              total={markoffPg.total}
              onPageChange={markoffPg.setPage}
              onPageSizeChange={markoffPg.setPageSize}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">WARRANT NO</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3 text-right">AMOUNT (₦)</th>
                    <th className="p-3">MARKED OFF BY</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {historyPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.warrantNo}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {row.amount.toLocaleString()}.00
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.markedBy}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`border-0 text-[13px] ${row.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                        >
                          {row.status.charAt(0) +
                            row.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={historyPg.page}
              pageSize={historyPg.pageSize}
              totalPages={historyPg.totalPages}
              from={historyPg.from}
              to={historyPg.to}
              total={historyPg.total}
              onPageChange={historyPg.setPage}
              onPageSizeChange={historyPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Warrant Mark-Off</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Approving will permanently mark this warrant as{" "}
                  <strong>PAID</strong>. This action cannot be undone.
                </span>
              </div>

              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mrpsl-section-title">Warrant No</div>
                    <div className="font-mono font-bold mt-0.5">
                      {selected.warrantNo}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Dividend</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.dividend}
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
                  <div className="col-span-2">
                    <div className="mrpsl-section-title">Amount</div>
                    <div className="text-2xl tabular-nums font-bold mt-0.5 text-primary">
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
                    toast.error("Mark-off rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success("Warrant marked as paid.");
                    setReviewOpen(false);
                  }}
                >
                  Approve Mark-Off
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
