"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  CalendarIcon,
} from "lucide-react";
import { usePagination } from "@/lib/use-pagination";
import { TablePagination } from "@/components/custom/table-pagination";

type PositionRow = {
  chn: string;
  accountNo: string;
  holder: string;
  mrpslUnits: number;
  cscsUnits: number;
};

const POSITION_DATA: PositionRow[] = [
  {
    chn: "C00001045EL",
    accountNo: "DANGCEM-10015",
    holder: "Binta Lawal",
    mrpslUnits: 10000,
    cscsUnits: 15000,
  },
  {
    chn: "C00002198KL",
    accountNo: "DANGCEM-10044",
    holder: "Chukwuemeka Obi",
    mrpslUnits: 15000,
    cscsUnits: 15000,
  },
  {
    chn: "C00003312MN",
    accountNo: "DANGCEM-10091",
    holder: "Fatima Aliyu",
    mrpslUnits: 28000,
    cscsUnits: 28000,
  },
  {
    chn: "C00005023RT",
    accountNo: "DANGCEM-10109",
    holder: "Yusuf Mohammed",
    mrpslUnits: 35000,
    cscsUnits: 35000,
  },
  {
    chn: "C00006112BC",
    accountNo: "DANGCEM-10158",
    holder: "Halima Yusuf",
    mrpslUnits: 20000,
    cscsUnits: 20000,
  },
  {
    chn: "C00007712ZZ",
    accountNo: "DANGCEM-10201",
    holder: "Musa Ibrahim",
    mrpslUnits: 2800,
    cscsUnits: 3000,
  },
  {
    chn: "C00009001AA",
    accountNo: "DANGCEM-10233",
    holder: "Adaeze Okwuosa",
    mrpslUnits: 12500,
    cscsUnits: 12500,
  },
  {
    chn: "C00011450BB",
    accountNo: "DANGCEM-10298",
    holder: "Tunde Oyelaran",
    mrpslUnits: 8000,
    cscsUnits: 8000,
  },
];

export default function ReconciliationPage() {
  const { registers } = useStore();
  const [activeTab, setActiveTab] = useState("cscs");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState("");
  const [scopeMode, setScopeMode] = useState("all");
  const [specificChn, setSpecificChn] = useState("");
  const [reconciled, setReconciled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [reconciledData, setReconciledData] =
    useState<PositionRow[]>(POSITION_DATA);
  const [txDate, setTxDate] = useState<Date | undefined>(
    new Date("2026-04-25"),
  );
  const [txDateOpen, setTxDateOpen] = useState(false);
  const [txSymbol, setTxSymbol] = useState("DANGCEM");

  const viewData = reconciled ? reconciledData : POSITION_DATA;
  const discrepancies = viewData.filter((r) => r.mrpslUnits !== r.cscsUnits);
  const mrpslTotal = viewData.reduce((s, r) => s + r.mrpslUnits, 0);
  const cscsTotal = viewData.reduce((s, r) => s + r.cscsUnits, 0);
  const positionPg = usePagination(viewData);

  function runReconciliation() {
    if (!selectedReg) {
      toast.error("Please select a register first.");
      return;
    }
    if (scopeMode === "spec" && !specificChn.trim()) {
      toast.error("Please enter a CHN to reconcile.");
      return;
    }
    setIsRunning(true);
    setTimeout(() => {
      const filtered =
        scopeMode === "spec"
          ? POSITION_DATA.filter(
              (r) => r.chn.toLowerCase() === specificChn.trim().toLowerCase(),
            )
          : POSITION_DATA;
      setReconciledData(filtered);
      setIsRunning(false);
      setReconciled(true);
      if (scopeMode === "spec" && filtered.length === 0) {
        toast.warning(`No record found for CHN: ${specificChn.trim()}`);
      }
    }, 1200);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Certificate Reconciliation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identify and resolve discrepancies between the MRPSL register and CSCS
          positions
        </p>
      </div>

      {/* Tabs + Content — single vertical column */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v || "")}
        className="w-full !flex !flex-col"
      >
        <TabsList className="h-auto p-1 bg-muted rounded-xl w-fit gap-0.5">
          <TabsTrigger
            value="cscs"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            CSCS Update Reconciliation
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="rounded-lg px-5 py-2.5 text-[13px] font-medium whitespace-nowrap
                       text-muted-foreground
                       data-active:bg-background data-active:text-foreground data-active:shadow-sm
                       hover:text-foreground transition-all"
          >
            General Certificate Reconciliation
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {/* ── CSCS Update Reconciliation ── */}
          <TabsContent value="cscs" className="space-y-4">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-800">
                1 flagged transaction awaiting resolution
              </span>
            </div>

            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">CHN</th>
                      <th className="px-4 py-3">Holder Name</th>
                      <th className="px-4 py-3">Register</th>
                      <th className="px-4 py-3">Flagged Date</th>
                      <th className="px-4 py-3 text-right">Attempted Sell</th>
                      <th className="px-4 py-3 text-right">Holdings At Flag</th>
                      <th className="px-4 py-3 text-right">Shortfall</th>
                      <th className="px-4 py-3">Resolution Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="mrpsl-table-row">
                      <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                        C00001045EL
                      </td>
                      <td className="px-4 py-3 font-semibold">Binta Lawal</td>
                      <td className="px-4 py-3 tabular text-[13px]">DANGCEM</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        29 Apr 2026
                      </td>
                      <td className="px-4 py-3 text-right tabular text-red-600 font-semibold">
                        15,000
                      </td>
                      <td className="px-4 py-3 text-right tabular">10,000</td>
                      <td className="px-4 py-3 text-right tabular text-amber-600 font-semibold">
                        5,000
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                          Pending
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => setSheetOpen(true)}>
                          Resolve
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ── General Certificate Reconciliation ── */}
          <TabsContent value="general" className="space-y-4">
            {/* Filter bar */}
            <Card className="mrpsl-card p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select
                  value={selectedReg}
                  onValueChange={(v) => {
                    setSelectedReg(v || "");
                    setReconciled(false);
                  }}
                >
                  <SelectTrigger className="w-64 mrpsl-input">
                    <SelectValue placeholder="Select Register" />
                  </SelectTrigger>
                  <SelectContent>
                    {registers.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <RadioGroup
                  value={scopeMode}
                  onValueChange={(v) => {
                    setScopeMode(v || "all");
                    setReconciled(false);
                    setSpecificChn("");
                  }}
                  className="flex gap-5 items-center"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="all" id="chk-all" />
                    <label htmlFor="chk-all" className="text-sm">
                      All CHNs
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="spec" id="chk-spec" />
                    <label htmlFor="chk-spec" className="text-sm">
                      Specific CHN
                    </label>
                  </div>
                </RadioGroup>

                {scopeMode === "spec" && (
                  <Input
                    placeholder="Enter CHN…"
                    className="w-44 mrpsl-input"
                    value={specificChn}
                    onChange={(e) => {
                      setSpecificChn(e.target.value);
                      setReconciled(false);
                    }}
                  />
                )}

                <Button onClick={runReconciliation} disabled={isRunning}>
                  {isRunning ? "Running…" : "Run Reconciliation"}
                </Button>
              </div>
            </Card>

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Automated reconciliation</strong> runs every first
                Saturday of the month. Discrepancy reports are emailed to{" "}
                <span className="font-medium">
                  reconciliation@meristemregistrars.com
                </span>
                .
              </p>
            </div>

            {/* Discrepancy summary banner — only when reconciled and there are issues */}
            {reconciled && discrepancies.length > 0 && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span className="text-sm font-medium text-red-800">
                  {discrepancies.length} discrepanc
                  {discrepancies.length === 1 ? "y" : "ies"} found — MRPSL is
                  short by {(cscsTotal - mrpslTotal).toLocaleString()} units
                  versus CSCS.
                </span>
              </div>
            )}
            {reconciled && discrepancies.length === 0 && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-green-800">
                  All positions reconcile. No discrepancies found.
                </span>
              </div>
            )}

            {/* Position comparison — full width, two equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MRPSL Register Position */}
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                  <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                    MRPSL Register Position
                  </h3>
                  {reconciled && (
                    <span className="text-[13px] font-mono font-semibold tabular-nums">
                      {mrpslTotal.toLocaleString()} units
                    </span>
                  )}
                </div>
                {!reconciled ? (
                  <div className="p-4 text-sm text-muted-foreground text-center py-10">
                    Run a reconciliation to see MRPSL position data.
                  </div>
                ) : (
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-2.5">CHN / ACCOUNT</th>
                        <th className="px-4 py-2.5">HOLDER NAME</th>
                        <th className="px-4 py-2.5 text-right">UNITS</th>
                        <th className="px-4 py-2.5 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {positionPg.paged.map((row) => {
                        const hasDiscrepancy = row.mrpslUnits !== row.cscsUnits;
                        return (
                          <tr
                            key={row.chn}
                            className={`transition-colors ${hasDiscrepancy ? "bg-red-50/60" : "hover:bg-muted/30"}`}
                          >
                            <td className="px-4 py-2.5">
                              <div className="font-mono text-[12px] text-muted-foreground">
                                {row.chn}
                              </div>
                              <div className="text-[12px] text-muted-foreground/70">
                                {row.accountNo}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-medium">
                              {row.holder}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right tabular-nums font-semibold ${hasDiscrepancy ? "text-red-600" : ""}`}
                            >
                              {row.mrpslUnits.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {hasDiscrepancy ? (
                                <Badge className="bg-red-100 text-red-700 border-0 text-[13px]">
                                  Mismatch
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 border-0 text-[13px]">
                                  Match
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/20">
                        <td
                          colSpan={2}
                          className="px-4 py-2.5 text-[13px] font-bold text-muted-foreground uppercase tracking-wide"
                        >
                          Total
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold">
                          {mrpslTotal.toLocaleString()}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </Card>

              {/* CSCS Position */}
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                  <h3 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                    CSCS Position
                  </h3>
                  {reconciled && (
                    <span className="text-[13px] font-mono font-semibold tabular-nums">
                      {cscsTotal.toLocaleString()} units
                    </span>
                  )}
                </div>
                {!reconciled ? (
                  <div className="p-4 text-sm text-muted-foreground text-center py-10">
                    Run a reconciliation to see CSCS position data.
                  </div>
                ) : (
                  <table className="w-full text-left text-[13px]">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="px-4 py-2.5">CHN / ACCOUNT</th>
                        <th className="px-4 py-2.5">HOLDER NAME</th>
                        <th className="px-4 py-2.5 text-right">UNITS</th>
                        <th className="px-4 py-2.5 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {positionPg.paged.map((row) => {
                        const hasDiscrepancy = row.mrpslUnits !== row.cscsUnits;
                        return (
                          <tr
                            key={row.chn}
                            className={`transition-colors ${hasDiscrepancy ? "bg-amber-50/60" : "hover:bg-muted/30"}`}
                          >
                            <td className="px-4 py-2.5">
                              <div className="font-mono text-[12px] text-muted-foreground">
                                {row.chn}
                              </div>
                              <div className="text-[12px] text-muted-foreground/70">
                                {row.accountNo}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-medium">
                              {row.holder}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right tabular-nums font-semibold ${hasDiscrepancy ? "text-amber-700" : ""}`}
                            >
                              {row.cscsUnits.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {hasDiscrepancy ? (
                                <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                                  Mismatch
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 border-0 text-[13px]">
                                  Match
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/20">
                        <td
                          colSpan={2}
                          className="px-4 py-2.5 text-[13px] font-bold text-muted-foreground uppercase tracking-wide"
                        >
                          Total
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold">
                          {cscsTotal.toLocaleString()}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </Card>
            </div>
            <TablePagination
              page={positionPg.page}
              pageSize={positionPg.pageSize}
              totalPages={positionPg.totalPages}
              from={positionPg.from}
              to={positionPg.to}
              total={positionPg.total}
              onPageChange={positionPg.setPage}
              onPageSizeChange={positionPg.setPageSize}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Discrepancy Resolution Dialog */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discrepancy Resolution</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-8 pb-8">
            {/* Side-by-side ledger view */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  MRPSL Records
                </div>
                <div className="p-4 space-y-2 text-sm tabular">
                  <div className="flex justify-between text-muted-foreground">
                    <span>01 Jan 2026 (Buy)</span>
                    <span>+10,000</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold">
                    <span>Balance</span>
                    <span>10,000</span>
                  </div>
                </div>
              </Card>

              <Card className="mrpsl-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                  CSCS Records
                </div>
                <div className="p-4 space-y-2 text-sm tabular">
                  <div className="flex justify-between text-muted-foreground">
                    <span>01 Jan 2026 (Buy)</span>
                    <span>+10,000</span>
                  </div>
                  <div className="flex justify-between bg-green-50 rounded px-2 py-1 text-green-700">
                    <span>25 Apr 2026 (Buy)</span>
                    <span>+5,000</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold">
                    <span>Balance</span>
                    <span>15,000</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Alert */}
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>Missing purchase identified:</strong> 5,000 units on 25
                Apr 2026 not reflected in MRPSL register.
              </p>
            </div>

            {/* Insert missing transaction */}
            <Card className="mrpsl-card p-5 space-y-4">
              <h3 className="font-semibold text-sm">
                Insert Missing Transaction
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="mrpsl-label">Transaction Date</label>
                  <Popover open={txDateOpen} onOpenChange={setTxDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="mrpsl-input w-full justify-start gap-2 px-3 font-normal text-sm"
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className={txDate ? "" : "text-muted-foreground"}>
                          {txDate
                            ? format(txDate, "dd MMM yyyy")
                            : "Select date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={txDate}
                        onSelect={(d) => {
                          setTxDate(d);
                          setTxDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Transfer No</label>
                  <Input defaultValue="TRN-0099123" className="mrpsl-input" />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Units</label>
                  <Input defaultValue="5000" className="mrpsl-input tabular" />
                </div>
                <div className="space-y-2">
                  <label className="mrpsl-label">Symbol</label>
                  <Select value={txSymbol} onValueChange={setTxSymbol}>
                    <SelectTrigger className="mrpsl-input w-full">
                      <SelectValue placeholder="Select register" />
                    </SelectTrigger>
                    <SelectContent className="w-max">
                      {registers.map((r) => (
                        <SelectItem key={r.id} value={r.symbol}>
                          {r.symbol} — {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  toast.success("Submitted for approval.");
                  setSheetOpen(false);
                }}
              >
                Submit for Approval
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
