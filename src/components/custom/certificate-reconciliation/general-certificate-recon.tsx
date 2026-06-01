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
import {
    Info,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetReconciliations } from "@/hooks/useCscs";
import { PaginationBar } from "../pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";


export default function GeneralCertificateReconciliation() {
    const { data: activeRegisters } = useGetRegisters({
        status: "ACTIVE",
        size: 100
    })


    const [selectedReg, setSelectedReg] = useState("");
    const [scopeMode, setScopeMode] = useState("all");
    const [specificChn, setSpecificChn] = useState("");
    const [reconciled, setReconciled] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading, isError, error, refetch, isFetching } = useGetReconciliations(
        {
            register: selectedReg,
            chn: scopeMode === "spec" ? specificChn : undefined,
            page: currentPage,
            size: pageSize,
        },
        {
            enabled: reconciled && !!selectedReg && (scopeMode === "all" || (scopeMode === "spec" && specificChn.trim().length >= 4)),
        }
    );

    const handlePageSizeChange = (value: number) => {
        setPageSize(value);
        setCurrentPage(0);
    };

    const isRunning = isLoading || isFetching;

    const runReconciliation = () => {
        if (!selectedReg) {
            toast.error("Please select a register first.");
            return;
        }
        if (scopeMode === "spec" && !specificChn.trim()) {
            toast.error("Please enter a CHN to reconcile.");
            return;
        }
        setReconciled(true);
    };

    const mrpslList = data?.mrpslPositions?.data?.content || [];
    const cscsList = data?.cscsPositions?.data?.content || [];
    const maxLength = Math.max(mrpslList.length, cscsList.length);
    const pagedRows = [];
    for (let i = 0; i < maxLength; i++) {
        const mrpslItem = mrpslList[i];
        const cscsItem = cscsList[i];
        pagedRows.push({
            chn: mrpslItem?.chn || cscsItem?.chn || "",
            accountNo: mrpslItem?.accountNo || "",
            holder: mrpslItem?.name || cscsItem?.holderName || "",
            mrpslUnits: mrpslItem?.units || 0,
            cscsUnits: cscsItem?.units || 0,
        });
    }

    const positionPg = {
        paged: pagedRows,
    };

    const mrpslTotal = data?.mrpslTotalUnits || 0;
    const cscsTotal = data?.cscsTotalUnits || 0;
    const discrepancies = pagedRows.filter((row) => row.mrpslUnits !== row.cscsUnits);

    return (
        <>
            <Card className="mrpsl-card p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Select
                        value={selectedReg}
                        onValueChange={(v) => {
                            setSelectedReg(v || "");
                            setReconciled(false);
                            setCurrentPage(0);
                        }}
                    >
                        <SelectTrigger className="w-64 mrpsl-input">
                            <SelectValue placeholder="Select Register" />
                        </SelectTrigger>
                        <SelectContent>
                            {activeRegisters?.content?.map((r) => (
                                <SelectItem key={r.registerId} value={r.registerId}>
                                    {r.registerName}
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
                            setCurrentPage(0);
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
                                setCurrentPage(0);
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

            {reconciled && isLoading ? (
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
                                        {formatNumber(data?.cscsTotalUnits)} units
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
                    <PaginationBar
                        page={currentPage}
                        pageSize={pageSize}
                        onPageChange={(page) => setCurrentPage(page)}
                        onPageSizeChange={handlePageSizeChange}
                        total={data?.cscsPositions?.data?.totalElements || data?.mrpslPositions?.data?.totalElements || 0}
                        totalPages={data?.cscsPositions?.data?.totalPages || data?.mrpslPositions?.data?.totalPages || 0}
                    />
                </>
            )}

        </>
    );
}
