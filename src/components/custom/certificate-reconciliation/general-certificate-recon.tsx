"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Info, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetReconciliations } from "@/hooks/useCscs";
import { PaginationBar } from "../pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { DateRangePicker } from "../date-range-picker";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export default function GeneralCertificateReconciliation() {
  const { data: activeRegisters, isLoading: loadingRegisters } = useGetRegisters({
    status: "ACTIVE",
    size: 100,
  });

  const [selectedReg, setSelectedReg] = useState("");
  const [scopeMode, setScopeMode] = useState("all");
  const [specificChn, setSpecificChn] = useState("");
  const [reconciled, setReconciled] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    undefined,
  );

  // ✅ Shared pagination state
  const [page, setPage] = useState(0);        // 0‑based
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetReconciliations(
      {
        register: selectedReg,
        chn: scopeMode === "spec" ? specificChn : undefined,
        startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        mrpslPage: page,
        mrpslPageSize: pageSize,
        cscsPage: page,
        cscsPageSize: pageSize,
      },
      {
        enabled:
          reconciled &&
          !!selectedReg &&
          (scopeMode === "all" ||
            (scopeMode === "spec" && specificChn.trim().length >= 4)),
      },
    );

  // ✅ Single handler for page size change
  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(0);       // reset to first page
  };

  const isRunning = isFetching;


  const runReconciliation = () => {
    if (!selectedReg) {
      toast.error("Please select a register first.");
      return;
    }
    if (scopeMode === "spec" && !specificChn.trim()) {
      toast.error("Please enter a CHN to reconcile.");
      return;
    }
    setPage(0);
    setReconciled(true);
  };

  const mrpslList = data?.mrpsl?.content || [];
  const cscsList = data?.cscs?.content || [];
  const missingDataList = data?.missingData || [];

  const mrpslTotal = data?.mrpsl?.totalElements || 0;
  const cscsTotal = data?.cscs?.totalElements || 0;

  // Isolate number of anomalous transaction records found
  const missingRecordsCount = missingDataList.length;

  return (
    <>
      <Card className="mrpsl-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={selectedReg}
            onValueChange={(v) => {
              setSelectedReg(v || "");
              setReconciled(false);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-64 mrpsl-input">
              <SelectValue placeholder="Select Register" />
            </SelectTrigger>
            <SelectContent>
              {loadingRegisters ? (
                <div className="py-10 flex items-center justify-center">
                  <Loader2 className="animate-spin w-4 h-4" />
                </div>
              ) : (
                <>
                  {activeRegisters?.content?.map((r) => (
                    <SelectItem key={r.registerId} value={r.symbol}>
                      <span className="font-bold">{r.registerName}</span>{" "}
                      -{" "}
                      <span className="text-xs translate-y-0.5">{r.symbol}</span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          <DateRangePicker
            className="mt-0"
            date={dateRange}
            setDate={setDateRange}
          />

          <RadioGroup
            value={scopeMode}
            onValueChange={(v) => {
              setScopeMode(v || "all");
              setReconciled(false);
              setSpecificChn("");
              setPage(0);
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
                setPage(0);
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
          <strong>Automated reconciliation</strong> runs every first Saturday of
          the month. Discrepancy reports are emailed to{" "}
          <span className="font-medium">
            reconciliation@meristemregistrars.com
          </span>
          .
        </p>
      </div>

      {/* Discrepancy summary banner — only when reconciled and there are issues */}
      {reconciled && !isLoading && !isFetching && !isError && (
        <>
          {missingRecordsCount > 0 ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span className="text-sm font-medium text-red-800">
                Ledger Variance Found: {missingRecordsCount} unmapped historical ledger transaction records isolated from systemic sync logs.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-green-800">
                All positions match perfectly. No unmapped transaction records detected.
              </span>
            </div>
          )}
        </>
      )}

      {reconciled && (isLoading || isFetching) ? (
        <div className="py-8">
          <PendingListSkeleton cols={9} />
        </div>
      ) : reconciled && isError ? (
        <div className="py-8">
          <DataErrorState
            message={returnErrorMessage(error as ErrorLike)}
            onRetry={refetch}
          />
        </div>
      ) : (
        <>
          {/* SIDE-BY-SIDE DOUBLE COMPARISON VIEW BLOCKS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* MRPSL MATRIX LIST CARD */}
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  MRPSL Register Balances
                </h3>
                <span className="text-xs font-mono font-bold text-foreground">
                  Records: {formatNumber(mrpslTotal)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/20 text-muted-foreground text-[10px] uppercase font-bold tracking-wider border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left">CHN / Account</th>
                      <th className="px-4 py-2.5 text-left">Holder Name</th>
                      <th className="px-4 py-2.5 text-right">Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {mrpslList.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-medium text-muted-foreground">{row.chn}</td>
                        <td className="px-4 py-2.5 font-medium">{row.holderName}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatNumber(row?.units)}</td>
                      </tr>
                    ))}
                    {mrpslList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-muted-foreground italic">No historical aggregate rows indexed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* CSCS MATRIX LIST CARD */}
            <Card className="mrpsl-card overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  CSCS Cleared Balances
                </h3>
                <span className="text-xs font-mono font-bold text-foreground">
                  Records: {formatNumber(cscsTotal)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/20 text-muted-foreground text-[10px] uppercase font-bold tracking-wider border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left">CHN / Account</th>
                      <th className="px-4 py-2.5 text-left">Holder Name</th>
                      <th className="px-4 py-2.5 text-right">Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {cscsList.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-medium text-muted-foreground">{row.chn}</td>
                        <td className="px-4 py-2.5 font-medium">{row.holderName}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatNumber(row?.units)}</td>
                      </tr>
                    ))}
                    {cscsList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-muted-foreground italic">No clearing ledger items recovered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* SHARED PAGINATION SYSTEM CONSOLE CONTROLLER */}
          <div className="mt-4">
            <PaginationBar
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              total={Math.max(cscsTotal, mrpslTotal)}
              totalPages={data?.cscs?.totalPages || 1}
            />
          </div>
        </>

      )}
    </>
  );
}
