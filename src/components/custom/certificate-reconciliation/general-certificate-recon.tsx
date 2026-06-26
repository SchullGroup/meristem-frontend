"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Info, CheckCircle2, XCircle } from "lucide-react";
import { useGetReconciliations } from "@/hooks/useCscs";
import { PaginationBar } from "../pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { DateRangePicker } from "../date-range-picker";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import RegisterSelect from "../register-select";

export default function GeneralCertificateReconciliation() {
  const [mrpslPage, setMrpslPage] = useState(0);
  const [cscsPage, setCscsPage] = useState(0);
  const [mrpslPageSize, setMrpslPageSize] = useState(10);
  const [cscsPageSize, setCscsPageSize] = useState(10);

  const [selectedReg, setSelectedReg] = useState("");
  const [scopeMode, setScopeMode] = useState("all");
  const [specificChn, setSpecificChn] = useState("");
  const [reconciled, setReconciled] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    undefined,
  );


  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetReconciliations(
      {
        register: selectedReg,
        chn: scopeMode === "spec" ? specificChn : undefined,
        startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        mrpslPage,
        mrpslPageSize,
        cscsPage,
        cscsPageSize,
      },
      {
        enabled:
          reconciled &&
          !!selectedReg &&
          (scopeMode === "all" ||
            (scopeMode === "spec" && specificChn.trim().length >= 4)),
      },
    );

  const isRunning = isFetching;

  // mrpsl table
  const mrpslRawList = data?.mrpsl?.content || [];
  const mrpslTotal = data?.mrpsl?.totalElements || 0
  const mrpslPageCount = data?.mrpsl?.totalPages || 1

  // cscs table
  const cscsRawList = data?.cscs?.content || [];
  const cscsTotal = data?.cscs?.totalElements || 0
  const cscsPageCount = data?.cscs?.totalPages || 1

  const missingDataList = data?.missingData || [];

  const missingRecordsCount = missingDataList.length;


  const runReconciliation = () => {
    if (!selectedReg) {
      toast.error("Please select a register first.");
      return;
    }
    if (scopeMode === "spec" && !specificChn.trim()) {
      toast.error("Please enter a CHN to reconcile.");
      return;
    }
    setMrpslPage(0);
    setCscsPage(0);
    setReconciled(true);
  };




  return (
    <>
      <Card className="mrpsl-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <RegisterSelect value={selectedReg} label="Select Register" onChange={(v) => {
            setSelectedReg(v || "");
            setReconciled(false);
            setMrpslPage(0);
            setCscsPage(0);
          }}
          />


          <div className="space-y-1.5">
            <label className="mrpsl-label">DATE RANGE</label>
            <DateRangePicker
              className="mt-0"
              date={dateRange}
              setDate={setDateRange}
            />
          </div>

          <RadioGroup
            value={scopeMode}
            onValueChange={(v) => {
              setScopeMode(v || "all");
              setReconciled(false);
              setSpecificChn("");
              setMrpslPage(0);
              setCscsPage(0);
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
                setMrpslPage(0);
                setCscsPage(0);
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
                    {mrpslRawList?.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-medium text-muted-foreground">{row.chn}</td>
                        <td className="px-4 py-2.5 font-medium">{row.holderName}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatNumber(row?.units)}</td>
                      </tr>
                    ))}
                    {mrpslRawList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-muted-foreground italic">No historical aggregate rows indexed.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <PaginationBar
                  page={mrpslPage}
                  pageSize={mrpslPageSize}
                  onPageSizeChange={setMrpslPageSize}
                  totalPages={mrpslPageCount}
                  total={mrpslTotal}
                  onPageChange={(value) => setMrpslPage(value)}
                />
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
                    {cscsRawList.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono font-medium text-muted-foreground">{row.chn}</td>
                        <td className="px-4 py-2.5 font-medium">{row.holderName}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatNumber(row?.units)}</td>
                      </tr>
                    ))}
                    {cscsRawList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-muted-foreground italic">No clearing ledger items recovered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <PaginationBar
                  page={cscsPage}
                  pageSize={cscsPageSize}
                  onPageSizeChange={setCscsPageSize}
                  totalPages={cscsPageCount}
                  total={cscsTotal}
                  onPageChange={setCscsPage}
                />
              </div>
            </Card>
          </div>


        </>

      )}
    </>
  );
}
