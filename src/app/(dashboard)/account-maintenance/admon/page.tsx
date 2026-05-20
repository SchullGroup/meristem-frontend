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
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  Upload,
  Check,
  AlertCircle,
  X,
  Pencil,
} from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import { TablePagination } from "@/components/custom/table-pagination";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { DocUploadZone } from "@/components/custom/doc-upload-zone";
import { getDocType } from "@/lib/mocks/doc-types";

type AdmonApproval = {
  id: string;
  date: string;
  account: string;
  deceased: string;
  adminName: string;
  probateNo: string;
  submittedBy: string;
};
type AdmonHistory = {
  id: string;
  date: string;
  account: string;
  deceased: string;
  adminName: string;
  status: string;
  authorisedBy: string;
};

const PENDING_ADMON: AdmonApproval[] = [
  {
    id: "AD1",
    date: "05 May 2026",
    account: "DANGCEM-1902",
    deceased: "Ade John",
    adminName: "Estate of Ade John",
    probateNo: "P/2026/0041",
    submittedBy: "Chidi Okafor",
  },
  {
    id: "AD2",
    date: "03 May 2026",
    account: "ZENITH-0812",
    deceased: "Grace Nwosu",
    adminName: "Ikenna Nwosu (Executor)",
    probateNo: "P/2026/0028",
    submittedBy: "Ngozi Eze",
  },
];

const ADMON_HISTORY: AdmonHistory[] = [
  {
    id: "H1",
    date: "28 Apr 2026",
    account: "DANGCEM-0445",
    deceased: "Bola Adesanya",
    adminName: "Estate of Bola Adesanya",
    status: "APPROVED",
    authorisedBy: "Aisha Musa",
  },
  {
    id: "H2",
    date: "21 Apr 2026",
    account: "ACCESS-0223",
    deceased: "Emeka Okafor Sr.",
    adminName: "Chukwuemeka Okafor (Exec)",
    status: "APPROVED",
    authorisedBy: "Chidi Okafor",
  },
  {
    id: "H3",
    date: "15 Apr 2026",
    account: "ZENITH-1120",
    deceased: "Yetunde Alabi",
    adminName: "Estate of Yetunde Alabi",
    status: "REJECTED",
    authorisedBy: "Ngozi Eze",
  },
];

const PENDING_REVERSALS: AdmonApproval[] = [
  {
    id: "RV1",
    date: "04 May 2026",
    account: "DANGCEM-0300",
    deceased: "Kunle Arowolo",
    adminName: "Estate of Kunle Arowolo",
    probateNo: "P/2025/0190",
    submittedBy: "Aisha Musa",
  },
];

type ReviewMode = "auth" | "reversal";

export default function AdmonPage() {
  const { registers } = useStore();
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [date, setDate] = useState<Date>();
  const [date2, setDate2] = useState<Date>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selected, setSelected] = useState<AdmonApproval | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("auth");
  const [activeTab, setActiveTab] = useState("new");
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [rejectedComment, setRejectedComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [rejectedMode, setRejectedMode] = useState<ReviewMode>("auth");
  const [editingRejected, setEditingRejected] = useState<AdmonApproval | null>(
    null,
  );

  function openReview(row: AdmonApproval, mode: ReviewMode) {
    setSelected(row);
    setReviewMode(mode);
    setRejectComment("");
    setReviewOpen(true);
  }

  const pendingAdmon = PENDING_ADMON.filter(
    (row) => !(row.id === rejectedId && rejectedMode === "auth"),
  );
  const admonPg = usePagination(pendingAdmon);
  const pendingReversals = PENDING_REVERSALS.filter(
    (row) => !(row.id === rejectedId && rejectedMode === "reversal"),
  );
  const reversalPg = usePagination(pendingReversals);
  const admonHistoryPg = usePagination(ADMON_HISTORY);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Estate Administration (ADMON)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transfer account administration from deceased holders to their
            estates
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "new")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Administration
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Pending Authorisation
          </TabsTrigger>
          <TabsTrigger
            value="rev"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Reverse Administration
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="new" className="space-y-6">
            {rejectedId && (
              <Card className="mrpsl-card p-4 border-l-4 border-l-red-500 bg-red-50/40 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-sm text-red-800">
                      {rejectedMode === "reversal"
                        ? "Reversal"
                        : "Administration"}{" "}
                      Rejected — ID: {rejectedId}
                    </div>
                    <div className="text-[13px] text-red-700">
                      {rejectedComment || "No comment provided."}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRejectedId(null);
                      setRejectedComment("");
                      setEditingRejected(null);
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 pl-8">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 gap-1.5"
                    onClick={() => {
                      const all = [...PENDING_ADMON, ...PENDING_REVERSALS];
                      const item = all.find((r) => r.id === rejectedId);
                      if (item) {
                        setEditingRejected(item);
                        setAccountLoaded(true);
                      }
                      setRejectedId(null);
                      setRejectedComment("");
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit &amp; Resubmit
                  </Button>
                </div>
              </Card>
            )}
            {editingRejected && (
              <Card className="mrpsl-card p-3 border-l-4 border-l-amber-400 bg-amber-50/60 border-amber-200 flex items-center gap-3">
                <Pencil className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-[13px] text-amber-800 font-medium flex-1">
                  Editing rejected administration for account{" "}
                  <span className="font-semibold">
                    {editingRejected.account}
                  </span>{" "}
                  — deceased{" "}
                  <span className="font-semibold">
                    {editingRejected.deceased}
                  </span>
                  . Update the details below and resubmit.
                </p>
                <button
                  onClick={() => {
                    setEditingRejected(null);
                    setAccountLoaded(false);
                  }}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )}
            <Card className="mrpsl-card p-6 space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">
                1. Deceased Account Selection
              </h3>
              <div className="flex gap-4">
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
                <div className="flex gap-2 flex-1">
                  <Input
                    placeholder="Account No or Name"
                    className="mrpsl-input"
                  />
                  <Button onClick={() => setAccountLoaded(true)}>Search</Button>
                </div>
              </div>
              {accountLoaded && (
                <table className="w-full text-left text-sm mt-4">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="p-2">
                        <Checkbox defaultChecked />
                      </th>
                      <th className="p-2">ACCT NO</th>
                      <th className="p-2">HOLDER NAME</th>
                      <th className="p-2">CHN</th>
                      <th className="p-2">HOLDINGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-[13px] border-b">
                    <tr className="hover:bg-accent/5">
                      <td className="p-2">
                        <Checkbox defaultChecked />
                      </td>
                      <td className="p-2">DANGCEM-1902</td>
                      <td className="p-2 font-sans font-medium text-destructive">
                        ADE JOHN (DECEASED)
                      </td>
                      <td className="p-2">C0000889EL</td>
                      <td className="p-2 text-right">150,000</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </Card>

            {accountLoaded && (
              <Card className="mrpsl-card p-6 space-y-6 animate-in fade-in">
                <h3 className="font-semibold text-sm border-b pb-2">
                  2. Administrator Details
                </h3>

                <div className="flex items-center space-x-2">
                  <Checkbox id="exec" />
                  <label
                    htmlFor="exec"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Is this an Executor (not Administrator)?
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Probate Court *</label>
                    <Input className="mrpsl-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Probate Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mrpsl-input justify-start text-left font-normal"
                        >
                          {date ? (
                            format(date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Probate Page *</label>
                    <Input className="mrpsl-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Lodgement Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full mrpsl-input justify-start text-left font-normal"
                        >
                          {date2 ? (
                            format(date2, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date2}
                          onSelect={setDate2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Admin Address *</label>
                    <Textarea className="mrpsl-input" rows={1} />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Admin City *</label>
                    <Input className="mrpsl-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="mrpsl-label">Admin State *</label>
                    <Select>
                      <SelectTrigger className="mrpsl-input">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {NIGERIA_STATE_NAMES.map((s) => (
                          <SelectItem
                            key={s}
                            value={s.toLowerCase().replace(/\s+/g, "-")}
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="mrpsl-label">Memo</label>
                    <Textarea className="mrpsl-input" rows={1} />
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const probate = getDocType(
                        "Probate / Letters of Administration",
                      );
                      return (
                        <DocUploadZone
                          label="Probate / Letters of Administration"
                          required
                          fileTypes={probate?.fileTypes ?? ["PDF"]}
                          maxSizeMB={probate?.maxSizeMB ?? 10}
                        />
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-muted/20 border rounded-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Change Holder Address to Admin Address
                    </span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Change Holder Name to Estate Name
                    </span>
                    <Switch defaultChecked />
                  </div>
                  <div className="bg-background border p-3 rounded text-sm text-center font-mono">
                    <span className="text-muted-foreground line-through mr-2">
                      ADE JOHN
                    </span>{" "}
                    →{" "}
                    <span className="font-bold text-primary">
                      Estate of ADE JOHN
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size="lg"
                    onClick={() =>
                      toast.success(
                        "Administration request submitted. Approver has been notified.",
                      )
                    }
                  >
                    Submit for Authorisation
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="auth">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">DECEASED</th>
                    <th className="p-3">ADMINISTRATOR / EXECUTOR</th>
                    <th className="p-3">PROBATE NO</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {admonPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium text-destructive">
                        {row.deceased}
                      </td>
                      <td className="p-3">{row.adminName}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.probateNo}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => openReview(row, "auth")}
                        >
                          Review &amp; Authorise
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={admonPg.page}
              pageSize={admonPg.pageSize}
              totalPages={admonPg.totalPages}
              from={admonPg.from}
              to={admonPg.to}
              total={admonPg.total}
              onPageChange={admonPg.setPage}
              onPageSizeChange={admonPg.setPageSize}
            />
          </TabsContent>

          <TabsContent value="rev" className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              Reversals cancel a previously approved administration and restore
              the original account state.
            </div>
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">ORIGINAL DECEASED</th>
                    <th className="p-3">CURRENT ADMINISTRATOR</th>
                    <th className="p-3">PROBATE NO</th>
                    <th className="p-3">SUBMITTED BY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {reversalPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.deceased}</td>
                      <td className="p-3">{row.adminName}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {row.probateNo}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {row.submittedBy}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openReview(row, "reversal")}
                        >
                          Review &amp; Authorise
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <TablePagination
              page={reversalPg.page}
              pageSize={reversalPg.pageSize}
              totalPages={reversalPg.totalPages}
              from={reversalPg.from}
              to={reversalPg.to}
              total={reversalPg.total}
              onPageChange={reversalPg.setPage}
              onPageSizeChange={reversalPg.setPageSize}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">DATE</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">DECEASED</th>
                    <th className="p-3">ADMINISTRATOR / EXECUTOR</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">AUTHORISED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {admonHistoryPg.paged.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="p-3 text-muted-foreground">{row.date}</td>
                      <td className="p-3 font-mono">{row.account}</td>
                      <td className="p-3 font-medium">{row.deceased}</td>
                      <td className="p-3">{row.adminName}</td>
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
              page={admonHistoryPg.page}
              pageSize={admonHistoryPg.pageSize}
              totalPages={admonHistoryPg.totalPages}
              from={admonHistoryPg.from}
              to={admonHistoryPg.to}
              total={admonHistoryPg.total}
              onPageChange={admonHistoryPg.setPage}
              onPageSizeChange={admonHistoryPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reviewMode === "reversal"
                ? "Review Administration Reversal"
                : "Review Estate Administration"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 px-8 pb-8">
              {reviewMode === "reversal" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  Authorising this reversal will cancel the existing
                  administration and restore the account to its original holder
                  state.
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
                    <div className="mrpsl-section-title">Probate No</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.probateNo}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">
                      {reviewMode === "reversal"
                        ? "Original Deceased"
                        : "Deceased Holder"}
                    </div>
                    <div className="font-semibold text-sm mt-0.5 text-destructive">
                      {selected.deceased}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">
                      {reviewMode === "reversal"
                        ? "Current Administrator"
                        : "Administrator / Executor"}
                    </div>
                    <div className="text-sm mt-0.5">{selected.adminName}</div>
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
                    setRejectedMode(reviewMode);
                    toast.error(
                      reviewMode === "reversal"
                        ? "Reversal rejected."
                        : "Administration rejected.",
                    );
                    setReviewOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toast.success(
                      reviewMode === "reversal"
                        ? "Administration reversal authorised."
                        : "Administration authorised.",
                    );
                    setReviewOpen(false);
                  }}
                >
                  {reviewMode === "reversal"
                    ? "Authorise Reversal"
                    : "Authorise Administration"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
