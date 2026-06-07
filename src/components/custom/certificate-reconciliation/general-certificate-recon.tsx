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
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Info, CheckCircle2, XCircle } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetReconciliations } from "@/hooks/useCscs";
import { PaginationBar } from "../pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";

export default function GeneralCertificateReconciliation() {
  const { data: activeRegisters } = useGetRegisters({
    status: "ACTIVE",
    size: 100,
  });

  const [selectedReg, setSelectedReg] = useState("");
  const [scopeMode, setScopeMode] = useState("all");
  const [specificChn, setSpecificChn] = useState("");
  const [reconciled, setReconciled] = useState(false);
  // ✅ Shared pagination state
  const [page, setPage] = useState(0);        // 0‑based
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetReconciliations(
      {
        register: selectedReg,
        chn: scopeMode === "spec" ? specificChn : undefined,
        page: page,
        size: pageSize,
      },
      {
        enabled:
          reconciled &&
          !!selectedReg &&
          (scopeMode === "all" ||
            (scopeMode === "spec" && specificChn.trim().length >= 4)),
      },
    );

  const {
    data: cscsData,
    isLoading: cscsLoading,
    isFetching: cscsFetching,
  } = useGetReconciliations(
    {
      register: selectedReg,
      chn: scopeMode === "spec" ? specificChn : undefined,
      page: page,
      size: pageSize,
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

  const isRunning = isLoading || isFetching || cscsLoading || cscsFetching;

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

  const mrpslList = data?.mrpslPositions?.content || [];
  const cscsList = cscsData?.cscsPositions?.content || [];

  // NOTE: Discrepancies are calculated per page, not globally
  // To show true total discrepancies, the backend should return a discrepancy count
  const discrepancies = mrpslList.filter((item) => {
    const cscsItem = cscsList.find((c) => c.chn === item.chn);
    return (cscsItem?.units || 0) !== item.units;
  });

  const mrpslTotal = data?.mrpslTotalUnits || 0;
  const cscsTotal = cscsData?.cscsTotalUnits || 0;

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
              {activeRegisters?.content?.map((r) => (
                <SelectItem key={r.registerId} value={r.symbol}>
                  {r.registerName} - {r.symbol}
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
      {reconciled && discrepancies.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="text-sm font-medium text-red-800">
            {discrepancies.length} discrepanc
            {discrepancies.length === 1 ? "y" : "ies"} found — MRPSL is short by{" "}
            {(cscsTotal - mrpslTotal).toLocaleString()} units versus CSCS.
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

      {reconciled && (isLoading || cscsLoading) ? (
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
                    {formatNumber(data?.mrpslTotalUnits)} units
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
                      <th className="px-4 py-2.5">UNITS</th>
                      <th className="px-4 py-2.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {mrpslList.map((row) => {
                      const cscsItem = cscsList.find((c) => c.chn === row.chn);
                      const hasDiscrepancy =
                        (cscsItem?.units || 0) !== row.units;
                      return (
                        <tr
                          key={row.id}
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
                            {row.name}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right tabular-nums font-semibold ${hasDiscrepancy ? "text-red-600" : ""}`}
                          >
                            {row.units.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {hasDiscrepancy ? (
                              <Badge className="bg-red-100 text-red-800 border-0 text-[13px]">
                                Mismatch
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700 border-0 text-[13px]">
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
                    {formatNumber(cscsData?.cscsTotalUnits)} units
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
                      <th className="px-4 py-2.5">UNITS</th>
                      <th className="px-4 py-2.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {cscsList.map((row) => {
                      const mrpslItem = mrpslList.find(
                        (m) => m.chn === row.chn,
                      );
                      const hasDiscrepancy =
                        (mrpslItem?.units || 0) !== row.units;
                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors ${hasDiscrepancy ? "bg-amber-50/60" : "hover:bg-muted/30"}`}
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-mono text-[12px] text-muted-foreground">
                              {row.chn}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            {row.holderName}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right tabular-nums font-semibold ${hasDiscrepancy ? "text-amber-700" : ""}`}
                          >
                            {row.units.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {hasDiscrepancy ? (
                              <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                                Mismatch
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700 border-0 text-[13px]">
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

          {/* ✅ Single pagination bar */}
          <div className="mt-4">
            <PaginationBar
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              total={data?.mrpslPositions?.totalElements || 0}
              totalPages={data?.mrpslPositions?.totalPages || 0}
            // If both tables have the same total count, use either.
            // If they differ, you may want to show the max or a note.
            />
          </div>
        </>
      )}
    </>
  );
}
