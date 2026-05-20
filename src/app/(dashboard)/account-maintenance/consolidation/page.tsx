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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Check, AlertCircle, X } from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type ConsolApproval = {
  id: string;
  date: string;
  sources: string;
  destination: string;
  totalHoldings: number;
  submittedBy: string;
};
type ConsolHistory = {
  id: string;
  date: string;
  sources: string;
  destination: string;
  totalHoldings: number;
  status: string;
  authorisedBy: string;
};

const PENDING_CONSOL_AUTH: ConsolApproval[] = [
  {
    id: "CA1",
    date: "05 May 2026",
    sources: "DANGCEM-001, DANGCEM-089",
    destination: "DANGCEM-001 (BINTA LAWAL)",
    totalHoldings: 15000,
    submittedBy: "Chidi Okafor",
  },
  {
    id: "CA2",
    date: "04 May 2026",
    sources: "ACCESS-220, ACCESS-221",
    destination: "ACCESS-220 (EMEKA OKAFOR)",
    totalHoldings: 42000,
    submittedBy: "Ngozi Eze",
  },
];

const CONSOL_HISTORY: ConsolHistory[] = [
  {
    id: "CH1",
    date: "28 Apr 2026",
    sources: "ZENITH-100, ZENITH-102",
    destination: "ZENITH-100 (FATIMA BELLO)",
    totalHoldings: 28000,
    status: "APPROVED",
    authorisedBy: "Aisha Musa",
  },
  {
    id: "CH2",
    date: "22 Apr 2026",
    sources: "DANGCEM-050, DANGCEM-051",
    destination: "DANGCEM-050 (TUNDE ADEYEMI)",
    totalHoldings: 10500,
    status: "APPROVED",
    authorisedBy: "Chidi Okafor",
  },
  {
    id: "CH3",
    date: "17 Apr 2026",
    sources: "ACCESS-080, ACCESS-085",
    destination: "ACCESS-080 (GRACE NWOSU)",
    totalHoldings: 33000,
    status: "REJECTED",
    authorisedBy: "Ngozi Eze",
  },
];

export default function ConsolidationPage() {
  const { registers } = useStore();
  const [mode, setMode] = useState("single");
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<ConsolApproval | null>(null);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");

  function openReview(row: ConsolApproval) {
    setSelected(row);
    setRejectComment("");
    setReviewOpen(true);
  }

  const pendingConsolAuth = PENDING_CONSOL_AUTH.filter(
    (row) => row.id !== rejectedId,
  );
  const consolAuthPg = usePagination(pendingConsolAuth);
  const consolHistoryPg = usePagination(CONSOL_HISTORY);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Account Consolidation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Merge duplicate shareholder accounts into a single surviving account
          </p>
        </div>
      </div>

      <Tabs defaultValue="consol" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="consol"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Consolidate
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Authorisation
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="consol" className="space-y-6">
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
            <div className="flex gap-4">
              <Select>
                <SelectTrigger className="w-64 mrpsl-input">
                  <SelectValue placeholder="Register *" />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="border rounded-md flex p-1 bg-muted/20">
                <Button
                  variant={mode === "single" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMode("single")}
                >
                  Single
                </Button>
                <Button
                  variant={mode === "bulk" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMode("bulk")}
                >
                  Bulk Upload
                </Button>
              </div>
            </div>

            {mode === "single" && (
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-3 space-y-4">
                  <h3 className="font-semibold text-sm">
                    1. Source Accounts (To be deactivated)
                  </h3>
                  <Card className="mrpsl-card p-4 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Account No or Surname"
                        className="mrpsl-input"
                      />
                      <Button onClick={() => setSourcesLoaded(true)}>
                        Add
                      </Button>
                    </div>
                    {sourcesLoaded && (
                      <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="p-2">
                              <Checkbox defaultChecked />
                            </th>
                            <th className="p-2">ACCT NO</th>
                            <th className="p-2">NAME</th>
                            <th className="p-2">HOLDINGS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono text-[13px]">
                          <tr>
                            <td className="p-2">
                              <Checkbox defaultChecked />
                            </td>
                            <td className="p-2 text-muted-foreground">
                              DANGCEM-001
                            </td>
                            <td className="p-2 font-sans font-medium">
                              BINTA LAWAL
                            </td>
                            <td className="p-2 text-right">5,000</td>
                          </tr>
                          <tr>
                            <td className="p-2">
                              <Checkbox defaultChecked />
                            </td>
                            <td className="p-2 text-muted-foreground">
                              DANGCEM-089
                            </td>
                            <td className="p-2 font-sans font-medium">
                              B. LAWAL
                            </td>
                            <td className="p-2 text-right">10,000</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </Card>
                </div>

                <div className="col-span-2 space-y-4">
                  <h3 className="font-semibold text-sm">
                    2. Destination Account (Surviving)
                  </h3>
                  <Card className="mrpsl-card p-4 space-y-4">
                    <Select disabled={!sourcesLoaded}>
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue placeholder="Select surviving account" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          DANGCEM-001 - BINTA LAWAL
                        </SelectItem>
                        <SelectItem value="2">
                          DANGCEM-089 - B. LAWAL
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {sourcesLoaded && (
                      <div className="bg-muted/20 p-4 rounded-md space-y-3">
                        <div className="text-[13px] text-muted-foreground">
                          Merging 2 accounts into Destination.
                        </div>
                        <div className="text-sm font-bold">
                          Total Holdings after merge:{" "}
                          <span className="font-mono text-primary">15,000</span>
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                          Certificates and Dividend History will be unified.
                        </div>
                        <Textarea
                          placeholder="Comment / Reason *"
                          className="mt-2 focus-visible:ring-primary"
                        />
                        <Button
                          className="w-full mt-2"
                          onClick={() =>
                            toast.success(
                              "Consolidation submitted for authorizer review.",
                            )
                          }
                        >
                          Submit for Authorisation
                        </Button>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {mode === "bulk" && (
              <Card className="mrpsl-card p-12 text-center text-muted-foreground">
                Bulk upload CSV interface.
              </Card>
            )}
          </TabsContent>

          <TabsContent value="auth">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">SOURCE ACCOUNTS</th>
                    <th className="p-3">DESTINATION</th>
                    <th className="p-3">TOTAL HOLDINGS</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {consolAuthPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.sources}
                      </td>
                      <td className="p-3 font-medium">{row.destination}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {row.totalHoldings.toLocaleString()}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => openReview(row)}>
                          Review &amp; Authorise
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={consolAuthPg.page}
              pageSize={consolAuthPg.pageSize}
              totalPages={consolAuthPg.totalPages}
              from={consolAuthPg.from}
              to={consolAuthPg.to}
              total={consolAuthPg.total}
              onPageChange={consolAuthPg.setPage}
              onPageSizeChange={consolAuthPg.setPageSize}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">SOURCE ACCOUNTS</th>
                    <th className="p-3">DESTINATION</th>
                    <th className="p-3">TOTAL HOLDINGS</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">AUTHORISED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {consolHistoryPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.sources}
                      </td>
                      <td className="p-3 font-medium">{row.destination}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {row.totalHoldings.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`border-0 text-[13px] ${row.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                        >
                          {row.status.charAt(0) +
                            row.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.authorisedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={consolHistoryPg.page}
              pageSize={consolHistoryPg.pageSize}
              totalPages={consolHistoryPg.totalPages}
              from={consolHistoryPg.from}
              to={consolHistoryPg.to}
              total={consolHistoryPg.total}
              onPageChange={consolHistoryPg.setPage}
              onPageSizeChange={consolHistoryPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Account Consolidation</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                Approving will permanently deactivate all source accounts and
                transfer their holdings to the destination.
              </div>

              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="space-y-2">
                  <div>
                    <div className="mrpsl-section-title">
                      Source Accounts (to deactivate)
                    </div>
                    <div className="font-mono text-sm mt-0.5 text-muted-foreground">
                      {selected.sources}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">
                      Destination (surviving account)
                    </div>
                    <div className="font-medium text-sm mt-0.5">
                      {selected.destination}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">
                      Total Holdings to Transfer
                    </div>
                    <div className="text-2xl tabular-nums font-bold mt-0.5 text-primary">
                      {selected.totalHoldings.toLocaleString()} units
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
                    toast.error("Consolidation rejected.");
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success("Account consolidation authorised.");
                    setReviewOpen(false);
                  }}
                >
                  Authorise Consolidation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
