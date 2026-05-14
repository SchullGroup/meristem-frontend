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

type PendingConsol = {
  id: string;
  date: string;
  account: string;
  holder: string;
  certCount: number;
  totalUnits: number;
  submittedBy: string;
};

const PENDING_CONSOLS: PendingConsol[] = [
  {
    id: "CO1",
    date: "28 Apr 2026",
    account: "DANGCEM-10015",
    holder: "Binta Lawal",
    certCount: 2,
    totalUnits: 20000,
    submittedBy: "Chidi Okafor",
  },
  {
    id: "CO2",
    date: "27 Apr 2026",
    account: "ACCESS-00553",
    holder: "Ngozi Eze",
    certCount: 3,
    totalUnits: 35000,
    submittedBy: "Ngozi Eze",
  },
];

export default function ConsolidationPage() {
  const { registers } = useStore();
  const [certsLoaded, setCertsLoaded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<PendingConsol | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  function openReview(row: PendingConsol) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

  const pendingConsols = PENDING_CONSOLS.filter((row) => row.id !== rejectedId);
  const consolPg = usePagination(pendingConsols);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Certificate Consolidation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Merge multiple certificates for a single account into one
          </p>
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Consolidation
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="new" className="space-y-6">
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
            <Card className="mrpsl-card p-4 flex gap-4">
              <Select>
                <SelectTrigger className="w-64 mrpsl-input">
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
              <Input
                placeholder="Account No or CHN"
                className="mrpsl-input w-64"
              />
              <Button onClick={() => setCertsLoaded(true)}>
                Load Certificates
              </Button>
            </Card>

            {certsLoaded && (
              <div className="space-y-4 animate-in fade-in">
                <Card className="mrpsl-card">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="p-3 w-10"></th>
                        <th className="p-3">CERT NO</th>
                        <th className="p-3 text-right">UNITS</th>
                        <th className="p-3">ISSUE DATE</th>
                        <th className="p-3">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {["CERT-001", "CERT-002", "CERT-003"].map((c) => (
                        <tr key={c} className="hover:bg-accent/5">
                          <td className="p-3">
                            <Checkbox defaultChecked={c !== "CERT-003"} />
                          </td>
                          <td className="p-3 font-mono text-[13px]">{c}</td>
                          <td className="p-3 font-mono text-right">10,000</td>
                          <td className="p-3 text-muted-foreground text-[13px]">
                            01 Jan 2026
                          </td>
                          <td className="p-3">ACTIVE</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <div className="sticky bottom-4 z-10">
                  <Card className="mrpsl-card bg-card shadow-lg border-primary/25 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">
                          2
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">
                          2 certificates selected
                        </div>
                        <div className="text-[13px] text-muted-foreground tabular-nums mt-0.5">
                          20,000 total units
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        toast.success(
                          "Consolidation submitted for authorizer review.",
                        )
                      }
                    >
                      Consolidate Selected
                    </Button>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3 text-right">CERTIFICATES</th>
                    <th className="p-3 text-right">TOTAL UNITS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {consolPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.holder}</td>
                      <td className="p-3 text-right tabular-nums">
                        {row.certCount} certs
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold">
                        {row.totalUnits.toLocaleString()}
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
                  {consolPg.total === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center text-muted-foreground"
                      >
                        No pending consolidation approvals.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={consolPg.page}
              pageSize={consolPg.pageSize}
              totalPages={consolPg.totalPages}
              from={consolPg.from}
              to={consolPg.to}
              total={consolPg.total}
              onPageChange={consolPg.setPage}
              onPageSizeChange={consolPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Certificate Consolidation</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
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
                    <div className="mrpsl-section-title">
                      Certificates to Merge
                    </div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.certCount}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Total Units</div>
                    <div className="text-xl tabular-nums font-bold mt-0.5">
                      {selected.totalUnits.toLocaleString()}
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
                    toast.error("Consolidation rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success("Consolidation approved and processed.");
                    setReviewOpen(false);
                  }}
                >
                  Approve Consolidation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
