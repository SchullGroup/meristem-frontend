"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, Eye, Printer, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

export default function DeclarationPage() {
  const { currentUser, registers, shareholders, dividendDeclarations } =
    useStore();
  const [activeTab, setActiveTab] = useState("new");

  const [selectedRegister, setSelectedRegister] = useState("");
  const [divType, setDivType] = useState("FINAL");
  const [rate, setRate] = useState<number | "">("");
  const [date1, setDate1] = useState<Date>();
  const [date2, setDate2] = useState<Date>();
  const [date3, setDate3] = useState<Date>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDecl, setSelectedDecl] = useState<
    (typeof dividendDeclarations)[0] | null
  >(null);

  const register = registers.find((r) => r.id === selectedRegister);
  const stockToday = register?.stockToday || 0;
  const grossLiability = (typeof rate === "number" ? rate : 0) * stockToday;
  const wht = grossLiability * 0.1;
  const netLiability = grossLiability - wht;

  const computeTier = (amount: number) => {
    if (amount <= 500000) return 1;
    if (amount <= 5000000) return 2;
    if (amount <= 50000000) return 3;
    return 4;
  };

  const tier = computeTier(grossLiability);

  const getTierInfo = (t: number) => {
    switch (t) {
      case 1:
        return {
          color: "bg-green-50 border-green-200 text-green-800",
          label: "Auto-Approval",
          req: "None",
        };
      case 2:
        return {
          color: "bg-blue-50 border-blue-200 text-blue-800",
          label: "Manager Approval Required",
          req: "Ops Manager",
        };
      case 3:
        return {
          color: "bg-amber-50 border-amber-200 text-amber-800",
          label: "Compliance Approval Required",
          req: "Internal Control (ICU)",
        };
      default:
        return {
          color: "bg-red-50 border-red-200 text-red-800",
          label: "Board Approval Required",
          req: "MD + CEO dual sign-off",
        };
    }
  };

  const tierInfo = getTierInfo(tier);

  const formatNaira = (num: number) => {
    if (num >= 1_000_000_000) return `₦${(num / 1_000_000_000).toFixed(2)}B`;
    return `₦${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = () => {
    if (register?.status === "TRANSACTION_DISABLED") {
      toast.error(
        "Cannot declare dividend on a Transaction Disabled register.",
      );
      return;
    }
    if (grossLiability > (currentUser?.divTransactionLimit || 0)) {
      toast.error("Transaction value exceeds your authorised limit.");
      return;
    }
    toast.success("Declaration submitted. Next approver has been notified.");
    setActiveTab("auth");
  };

  const pendingDecs = dividendDeclarations.filter((d) =>
    d.status.startsWith("PENDING"),
  );
  const icuDecs = pendingDecs.filter((d) => d.tier >= 3);
  const pendingDecsPg = usePagination(pendingDecs);
  const icuDecsPg = usePagination(icuDecs);
  const historyDecsPg = usePagination(dividendDeclarations);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dividend Declaration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Declare, compute, and route dividends through the tiered approval
          workflow
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="new"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            New Declaration
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
          <TabsTrigger
            value="history"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm hover:text-foreground transition-all"
          >
            Declaration History
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* ── New Declaration ── */}
          <TabsContent value="new">
            {["ENQUIRY_ONLY", "AUDIT_REVIEWER"].includes(
              currentUser?.roles[0] || "",
            ) ? (
              <Card className="mrpsl-card p-12 text-center text-muted-foreground">
                You do not have permission to initiate dividend declarations.
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="mrpsl-card p-6 space-y-6">
                  {/* Row 1: Register / Type / Currency */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="mrpsl-label">Register *</label>
                      <Select
                        value={selectedRegister}
                        onValueChange={(v) => setSelectedRegister(v || "")}
                      >
                        <SelectTrigger className="mrpsl-input">
                          <SelectValue placeholder="Select Active Register" />
                        </SelectTrigger>
                        <SelectContent>
                          {registers
                            .filter((r) => r.status === "ACTIVE")
                            .map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.symbol}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {register && (
                        <p className="text-[13px] bg-muted/60 p-1.5 rounded text-muted-foreground">
                          Type: {register.registerType} · Shareholders:{" "}
                          {register.shareholdersToday.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="mrpsl-label">Dividend Type *</label>
                      <Select
                        value={divType}
                        onValueChange={(v) => setDivType(v || "")}
                      >
                        <SelectTrigger className="mrpsl-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FINAL">Final</SelectItem>
                          <SelectItem value="INTERIM">Interim</SelectItem>
                          <SelectItem value="SPECIAL">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="mrpsl-label">Currency</label>
                      <Select defaultValue="NGN">
                        <SelectTrigger className="mrpsl-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN">NGN (₦)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: Rate + Liability Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="mrpsl-label">
                          Dividend Rate (₦ per share) *
                        </label>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.0000"
                          className="mrpsl-input text-lg tabular"
                          value={rate}
                          onChange={(e) =>
                            setRate(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Switch />
                        <label className="text-sm font-medium text-muted-foreground">
                          Fractional Register
                        </label>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 border border-border/60 grid grid-cols-3 gap-4">
                      <div>
                        <div className="mrpsl-section-title">
                          Gross Liability
                        </div>
                        <div className="text-xl font-bold tabular mt-1">
                          {formatNaira(grossLiability)}
                        </div>
                      </div>
                      <div>
                        <div className="mrpsl-section-title">WHT (10%)</div>
                        <div className="text-xl font-bold tabular mt-1 text-amber-600">
                          {formatNaira(wht)}
                        </div>
                      </div>
                      <div>
                        <div className="mrpsl-section-title">Net Payout</div>
                        <div className="text-xl font-bold tabular mt-1 text-green-700">
                          {formatNaira(netLiability)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tier Banner */}
                  {grossLiability > 0 && (
                    <div
                      className={`p-3 rounded-lg border ${tierInfo.color} text-center animate-in fade-in zoom-in`}
                    >
                      <span className="font-bold tracking-widest text-sm uppercase">
                        TIER {tier} — {tierInfo.label}
                      </span>
                      <p className="text-[13px] mt-0.5 opacity-80">
                        Requires: {tierInfo.req}
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Qualification Date *",
                        date: date1,
                        setDate: setDate1,
                      },
                      {
                        label: "Closure Date *",
                        date: date2,
                        setDate: setDate2,
                      },
                      {
                        label: "Payment Date *",
                        date: date3,
                        setDate: setDate3,
                      },
                    ].map(({ label, date, setDate }) => (
                      <div key={label} className="space-y-2">
                        <label className="mrpsl-label">{label}</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full mrpsl-input justify-start text-left font-normal"
                            >
                              {date ? (
                                format(date, "PPP")
                              ) : (
                                <span className="text-muted-foreground">
                                  Pick a date
                                </span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
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
                    ))}
                  </div>

                  {/* Narrative */}
                  <div className="space-y-2">
                    <label className="mrpsl-label">Narrative</label>
                    <Textarea
                      placeholder="Add notes or context for approvers..."
                      className="resize-none"
                    />
                  </div>

                  {/* Rules */}
                  <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
                    <ul className="space-y-2 text-sm text-primary/80">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" />
                        Dividend computed on units held as at Qualification Date
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" />
                        Initiator cannot authorise their own declaration
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" />
                        Once authorised, computation results are immutable
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-4 w-4 flex items-center justify-center shrink-0 text-[13px]">
                          ●
                        </span>
                        Register status:{" "}
                        <strong className="ml-1">
                          {register?.status || "None Selected"}
                        </strong>
                      </li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewOpen(true)}
                      disabled={!rate || !selectedRegister}
                    >
                      Compute &amp; Preview Liability Table
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={!rate || !selectedRegister}
                    >
                      Submit Declaration
                    </Button>
                  </div>
                </Card>

                {/* Liability Preview Table */}
                {previewOpen && (
                  <Card className="mrpsl-card overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        Preview Liability Table (Sample)
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                          <tr>
                            <th className="px-4 py-3">ACCOUNT NO</th>
                            <th className="px-4 py-3">HOLDER NAME</th>
                            <th className="px-4 py-3 text-right">UNITS</th>
                            <th className="px-4 py-3 text-right">
                              GROSS AMOUNT
                            </th>
                            <th className="px-4 py-3 text-right">WHT</th>
                            <th className="px-4 py-3 text-right">NET AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-[13px]">
                          {shareholders.slice(0, 10).map((s) => {
                            const g =
                              s.holdings *
                              (typeof rate === "number" ? rate : 0);
                            const w = g * 0.1;
                            const n = g - w;
                            return (
                              <tr
                                key={s.id}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-4 py-3 tabular text-muted-foreground">
                                  {s.accountNumber}
                                </td>
                                <td className="px-4 py-3 font-medium">
                                  {s.firstName} {s.lastName}
                                </td>
                                <td className="px-4 py-3 text-right tabular">
                                  {s.holdings.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right tabular">
                                  ₦{g.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right tabular text-amber-600">
                                  ₦{w.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right tabular text-green-700 font-semibold">
                                  ₦{n.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Pending Approval ── */}
          <TabsContent value="auth">
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">TYPE</th>
                      <th className="px-4 py-3 text-right">RATE</th>
                      <th className="px-4 py-3 text-right">GROSS LIABILITY</th>
                      <th className="px-4 py-3">TIER</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingDecsPg.paged.map((d) => {
                      const reg = registers.find((r) => r.id === d.registerId);
                      return (
                        <tr key={d.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                            {d.paymentNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {reg?.symbol}
                          </td>
                          <td className="px-4 py-3">{d.dividendType}</td>
                          <td className="px-4 py-3 text-right tabular">
                            ₦{d.rate.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right tabular font-bold">
                            {formatNaira(d.grossLiability)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-gray-100 text-gray-700 border-0 text-[13px]">
                              Tier {d.tier}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-[13px] ${
                                d.status === "DRAFT"
                                  ? "bg-gray-100 text-gray-600"
                                  : d.status === "AUTHORIZED"
                                    ? "bg-blue-100 text-blue-800"
                                    : d.status === "PAID"
                                      ? "bg-green-100 text-green-800"
                                      : d.status === "REJECTED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {d.status
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDecl(d);
                                setSheetOpen(true);
                              }}
                            >
                              Review &amp; Decide
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {pendingDecsPg.total === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No pending declarations.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
            <TablePagination
              page={pendingDecsPg.page}
              pageSize={pendingDecsPg.pageSize}
              totalPages={pendingDecsPg.totalPages}
              from={pendingDecsPg.from}
              to={pendingDecsPg.to}
              total={pendingDecsPg.total}
              onPageChange={pendingDecsPg.setPage}
              onPageSizeChange={pendingDecsPg.setPageSize}
            />
          </TabsContent>

          <TabsContent value="icu">
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">TYPE</th>
                      <th className="px-4 py-3 text-right">RATE</th>
                      <th className="px-4 py-3 text-right">GROSS LIABILITY</th>
                      <th className="px-4 py-3">TIER</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {icuDecsPg.paged.map((d) => {
                      const reg = registers.find((r) => r.id === d.registerId);
                      return (
                        <tr key={d.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                            {d.paymentNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {reg?.symbol}
                          </td>
                          <td className="px-4 py-3">{d.dividendType}</td>
                          <td className="px-4 py-3 text-right tabular">
                            ₦{d.rate.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right tabular font-bold">
                            {formatNaira(d.grossLiability)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-purple-100 text-purple-800 border-0 text-[13px]">
                              Tier {d.tier}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-[13px] ${
                                d.status === "AUTHORIZED"
                                  ? "bg-blue-100 text-blue-800"
                                  : d.status === "REJECTED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {d.status
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDecl(d);
                                setSheetOpen(true);
                              }}
                            >
                              Review &amp; Decide
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {icuDecsPg.total === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No declarations pending ICU approval.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
            <TablePagination
              page={icuDecsPg.page}
              pageSize={icuDecsPg.pageSize}
              totalPages={icuDecsPg.totalPages}
              from={icuDecsPg.from}
              to={icuDecsPg.to}
              total={icuDecsPg.total}
              onPageChange={icuDecsPg.setPage}
              onPageSizeChange={icuDecsPg.setPageSize}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">PAYMENT NO</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">TYPE</th>
                      <th className="px-4 py-3">QUAL DATE</th>
                      <th className="px-4 py-3 text-right">RATE (₦)</th>
                      <th className="px-4 py-3 text-right">GROSS LIABILITY</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyDecsPg.paged.map((d) => {
                      const reg = registers.find((r) => r.id === d.registerId);
                      return (
                        <tr key={d.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                            {d.paymentNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {reg?.symbol}
                          </td>
                          <td className="px-4 py-3">
                            {d.dividendType === "FINAL" ? "Final" : "Interim"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-[13px]">
                            {d.qualificationDate
                              ? format(
                                  new Date(d.qualificationDate),
                                  "dd MMM yyyy",
                                )
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {d.rate.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold">
                            {formatNaira(d.grossLiability)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border-0 text-[13px] ${
                                d.status === "DRAFT"
                                  ? "bg-gray-100 text-gray-600"
                                  : d.status === "AUTHORIZED"
                                    ? "bg-blue-100 text-blue-800"
                                    : d.status === "PAID"
                                      ? "bg-green-100 text-green-800"
                                      : d.status === "REJECTED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {d.status
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSheetOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast.success("Warrant advice printed")
                                  }
                                >
                                  <Printer className="mr-2 h-4 w-4" /> Print
                                  Warrant Advice
                                </DropdownMenuItem>
                                {d.status === "DRAFT" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() =>
                                        toast.success("Declaration recalled")
                                      }
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />{" "}
                                      Recall Declaration
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {d.status === "REJECTED" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.success(
                                          "Resubmitted for approval",
                                        )
                                      }
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />{" "}
                                      Re-submit
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                    {historyDecsPg.total === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No declaration history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
            <TablePagination
              page={historyDecsPg.page}
              pageSize={historyDecsPg.pageSize}
              totalPages={historyDecsPg.totalPages}
              from={historyDecsPg.from}
              to={historyDecsPg.to}
              total={historyDecsPg.total}
              onPageChange={historyDecsPg.setPage}
              onPageSizeChange={historyDecsPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Dividend Declaration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-8 pb-8">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                {selectedDecl?.dividendType ?? "—"}
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 border-0 text-[13px] tabular-nums">
                Rate: ₦{selectedDecl?.rate.toFixed(4) ?? "0.0000"}
              </Badge>
              <Badge
                className={`border-0 text-[13px] ${selectedDecl && selectedDecl.tier >= 3 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
              >
                Tier {selectedDecl?.tier ?? "—"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="mrpsl-card p-4">
                <div className="mrpsl-section-title">Gross Liability</div>
                <div className="text-xl tabular mt-1 font-bold">
                  {selectedDecl
                    ? formatNaira(selectedDecl.grossLiability)
                    : "—"}
                </div>
              </Card>
              <Card className="mrpsl-card p-4 bg-amber-50 border-amber-200">
                <div className="text-[13px] font-bold uppercase tracking-widest text-amber-700/80">
                  WHT Amount
                </div>
                <div className="text-xl tabular mt-1 font-bold text-amber-600">
                  {selectedDecl ? formatNaira(selectedDecl.whtAmount) : "—"}
                </div>
              </Card>
              <Card className="mrpsl-card p-4 bg-green-50 border-green-200">
                <div className="text-[13px] font-bold uppercase tracking-widest text-green-700/80">
                  Net Liability
                </div>
                <div className="text-xl tabular mt-1 font-bold text-green-700">
                  {selectedDecl ? formatNaira(selectedDecl.netLiability) : "—"}
                </div>
              </Card>
            </div>

            <div className="border border-border/60 rounded-xl p-4">
              <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-4">
                Approval Chain
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Chidinma Nwosu</span>
                    <span className="text-muted-foreground ml-2">
                      ✓ Submitted 2h ago
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center animate-pulse" />
                  <div className="text-sm">
                    <span className="font-semibold">
                      {currentUser?.roles[0].replace(/_/g, " ")}
                    </span>
                    <span className="text-amber-600 ml-2">
                      ⏳ Pending your action
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  <div className="text-sm text-muted-foreground">
                    Board / MD — Awaiting
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="mrpsl-label">Comment</label>
              <Textarea
                placeholder="Required for rejection..."
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/60">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  toast.error("Declaration rejected.");
                  setSheetOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  toast.success("Approved and routed.");
                  setSheetOpen(false);
                }}
              >
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
