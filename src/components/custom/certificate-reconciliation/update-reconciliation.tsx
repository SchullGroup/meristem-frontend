"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, HelpCircle, Loader2, Search } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetReconciliations, useReconciliationFlaggedTransactions, useUpdateCscsTransaction } from "@/hooks/useCscs";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { PaginationBar } from "../pagination-bar";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { DateRangePicker } from "../date-range-picker";
import { DateRange } from "react-day-picker";
import StatusBadge from "../status-badge";
import { ProcessedTransaction, ReconciliationFlaggedTransaction } from "@/types/cscs";

export default function UpdateReconciliation({ tab }: { tab: string }) {
  const { data: activeRegisters, isLoading: loadingRegisters } = useGetRegisters({
    status: "ACTIVE",
    size: 100,
  });

  // Controls whether we slice out of the primary table and show the Desk Workspace workspace
  const [workspaceActive, setWorkspaceActive] = useState(false);

  const [status, setStatus] = useState<"PENDING" | "RESOLVED" | "">("");
  const [register, setRegister] = useState("");
  const [txDateRange, setTxDateRange] = useState<DateRange | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<ReconciliationFlaggedTransaction | null>(null);

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);

  const debouncedSearch = useDebounce(search, 500);
  const [txUnits, setTxUnits] = useState(0);

  // ── PRIMARY DATA TABLE STREAM LISTING ──────────────────────────────
  const { data, isLoading, isError, error, refetch } =
    useReconciliationFlaggedTransactions(
      {
        search: debouncedSearch || undefined,
        register: register !== "" ? register : undefined,
        startDate: txDateRange?.from ? format(txDateRange.from, "yyyy-MM-dd") : undefined,
        endDate: txDateRange?.to ? format(txDateRange.to, "yyyy-MM-dd") : undefined,
        status: status !== "" ? status : undefined,
        page: currentPage,
        size: pageSize,
      },
      {
        enabled: tab === "cscs",
        select: (data) => data.data,
      },
    );

  // ── NETWORK LAYER QUERY: FETCH SIDE-BY-SIDE LEDGERS ─────────────────
  const { data: reconData, isFetching: isLoadingLedger } = useGetReconciliations({
    register: selectedTransaction?.register || "",
    chn: selectedTransaction?.chn || "",
    page: 0,       // Pull page 0 completely
    size: 100,     // Request a wide baseline layer so we can run virtual split splicing safely
  }, {
    enabled: workspaceActive && !!selectedTransaction?.chn && !!selectedTransaction?.register,
    refetchOnWindowFocus: false,
  });

  // Extract raw payload content arrays
  const mrpslRawList = reconData?.mrpsl?.content || [];
  const cscsRawList = reconData?.cscs?.content || [];
  const missingDataList = reconData?.missingData || [];
  const mrpslTotal = reconData?.mrpsl?.totalElements || 0
  const cscsTotal = reconData?.mrpsl?.totalElements || 0


  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(0);
  };

  // ── NETWORK LAYER MUTATION: RESOLVE TRANSACTION ────────────────────
  const { mutate: updateCscsTransaction, isPending: isSubmitting } = useUpdateCscsTransaction();

  const handleApproval = () => {
    if (!selectedTransaction?.id) return;

    if (txUnits <= 0) {
      toast.error("All insertion form fields are explicitly required.");
      return;
    }

    const updatePayload: Partial<ProcessedTransaction> = {
      units: txUnits,
    };

    updateCscsTransaction({
      id: selectedTransaction.id,
      data: updatePayload,
    }, {
      onSuccess: () => {
        toast.success("Missing transaction inserted successfully. Ledger balances updated.");
        setTxUnits(0);
        setSelectedTransaction(null);
        setWorkspaceActive(false);
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to submit transaction adjustments.");
      },
    });
  };

  // ── VIEW BRANCHING: IF RESOLUTION WORKSPACE IS ACTIVE ───────────────
  if (workspaceActive && selectedTransaction) {
    return (
      <div className="space-y-5 animate-in fade-in-40 duration-200">

        {/* BACK TO AUDIT DESK BAR CONTROL */}
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setWorkspaceActive(false);
              setTxUnits(0);
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pending List
          </Button>
          <div className="h-4 w-px bg-border" />
          <h2 className="text-base font-bold text-foreground tracking-tight">
            Resolution Desk: {selectedTransaction.holderName} ({selectedTransaction.chn})
          </h2>
        </div>

        {/* Informational Alert Flag Banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Missing purchase identified:</strong> {formatNumber(selectedTransaction?.shortfall)} units on {formatDate(selectedTransaction?.transactionDate)} not reflected in MRPSL register.
          </p>
        </div>

        {/* DISCREPANCY IDENTIFICATION BLOCK (Renders isolated missingData values) */}
        <Card className="border border-red-200 bg-red-50/20 overflow-hidden shadow-sm">
          <div className="px-4 py-2 bg-red-100/60 border-b border-red-200 text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-red-600" />
            Missing Transactions ({missingDataList.length})
          </div>
          <div className="p-3 bg-background divide-y divide-border/40 text-xs">
            {isLoadingLedger ? (
              <div className="py-3 text-center text-muted-foreground animate-pulse">Running data comparisons...</div>
            ) : missingDataList.length > 0 ? (
              missingDataList.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">{item.transactionDate} &mdash; <span className="text-red-600 font-medium">{item.type}</span></span>
                    <span className="text-muted-foreground text-[11px]">Ref ID: {item.transferNo || "---"}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-red-600 text-sm">{formatNumber(item.units)}</span>
                    <p className="text-[10px] text-muted-foreground">Status: {item.transStatus || "UNRESOLVED"}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground italic flex items-center justify-center gap-2">
                No missing transactions found for this account              </div>
            )}
          </div>
        </Card>

        {/* STACKED HISTORICAL LOG TRAIL SCHEMAS */}
        {isLoadingLedger ? (
          <div className="h-44 flex flex-col items-center justify-center border border-border/40 rounded-xl bg-muted/10 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Pulling ledger positions...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">

            {/* STACKED VIEW 1: MRPSL RECORDS */}
            <Card className="overflow-hidden shadow-sm flex flex-col border border-border">
              <div className="px-4 py-2 bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                MRPSL Records ({mrpslTotal})
              </div>
              <div className="p-3 divide-y divide-border/40 text-xs bg-background">
                {mrpslRawList.map((pos) => (
                  <div key={pos.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{pos.transactionDate} ({pos.type})</span>
                      <span className="text-[10px] text-muted-foreground">Ref: {pos.transferNo}</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">{formatNumber(pos?.units)}</span>
                  </div>
                ))}
                {mrpslRawList.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground italic">No tracked entries on this ledger segment index.</div>
                )}
              </div>
            </Card>

            {/* SIDE VIEW 2: CSCS RECORDS */}
            <Card className="overflow-hidden shadow-sm flex flex-col border border-border">
              <div className="px-4 py-2 bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                CSCS Records ({cscsTotal})
              </div>
              <div className="p-3 divide-y divide-border/40 text-xs bg-background">
                {cscsRawList.map((pos) => (
                  <div key={pos.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{pos.transactionDate} ({pos.type})</span>
                      <span className="text-[10px] text-muted-foreground">Status: {pos.transStatus}</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">{formatNumber(pos.units)}</span>
                  </div>
                ))}
                {cscsRawList.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground italic">No matching clearing entries found on this page.</div>
                )}
              </div>
            </Card>

          </div>
        )}

        {/* INSERT FORM SECTION BLOCK LAYOUT */}
        <Card className="mrpsl-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">Insert Missing Transaction</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="mrpsl-label">Transaction Date</label>
              <Input value={selectedTransaction?.transactionDate || ""} disabled className="mrpsl-input tabular opacity-80" />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Transfer No</label>
              <Input name="transferNo" value={selectedTransaction?.transferNo || ""} disabled className="mrpsl-input tabular opacity-80" />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Units</label>
              <Input
                name="units"
                type="number"
                value={txUnits || ""}
                onChange={(e) => setTxUnits(Number(e.target.value))}
                className="mrpsl-input tabular"
                placeholder={`Target discrepancy shortfall: ${formatNumber(selectedTransaction?.shortfall)}`}
              />
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Symbol</label>
              <Input name="symbol" value={selectedTransaction?.register || ""} disabled className="mrpsl-input tabular opacity-80" />
            </div>
          </div>
          <Button className="w-full" disabled={isSubmitting || txUnits <= 0} onClick={handleApproval}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Correction Pipeline...
              </>
            ) : (
              "Submit for Approval"
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-sm font-medium text-amber-800">
          {data?.totalElements || 0} flagged transaction awaiting resolution
        </span>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search CHN or holder…"
            className="pl-9 mrpsl-input"
            value={search}
            type="search"
            name="search-reconciliation"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={register} onValueChange={(v) => setRegister(v || "All")}>
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            {loadingRegisters ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="animate-spin w-4 h-4" />
              </div>
            ) : (
              <>
                <SelectItem value="">All Registers</SelectItem>
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

        <Select value={status} onValueChange={(v) => setStatus(v || "")}>
          <SelectTrigger className="w-40 mrpsl-input">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <DateRangePicker
          date={txDateRange}
          setDate={setTxDateRange}
          placeholder="Select Date Range"
        />
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <PendingListSkeleton cols={9} />
          ) : isError ? (
            <DataErrorState
              message={returnErrorMessage(error as ErrorLike)}
              onRetry={refetch}
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">CHN</th>
                  <th className="px-4 py-3">Holder Name</th>
                  <th className="px-4 py-3">Register</th>
                  <th className="px-4 py-3">Flagged Date</th>
                  <th className="px-4 py-3">Attempted Sell</th>
                  <th className="px-4 py-3">Holdings At Flag</th>
                  <th className="px-4 py-3">Shortfall</th>
                  <th className="px-4 py-3">Resolution Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Array.isArray(data?.content) && data?.content?.length > 0 ? (
                  data?.content?.map((row) => (
                    <tr key={row.id} className="mrpsl-table-row">
                      <td className="px-4 py-3 tabular text-[13px] text-muted-foreground">
                        {row.chn}
                      </td>
                      <td className="px-4 py-3 tabular text-[13px]">
                        {row.holderName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {row.register}
                      </td>
                      <td className="px-4 py-3 text-center tabular text-red-600 font-semibold">
                        {row.transactionDate
                          ? formatDate(row.transactionDate)
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-center tabular text-red-600 font-semibold">
                        {formatNumber(row.attempted)}
                      </td>
                      <td className="px-4 py-3 text-center tabular">
                        {formatNumber(row.holdings)}
                      </td>
                      <td className="px-4 py-3 text-center tabular text-amber-600 font-semibold">
                        {formatNumber(row.shortfall)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => { setWorkspaceActive(true); setSelectedTransaction(row) }}>
                          Resolve
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      No reconciliation data available for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <PaginationBar
          page={currentPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          totalPages={data?.totalPages || 1}
          total={data?.totalElements || 0}
          onPageChange={(value) => setCurrentPage(value)}
        />
      </Card>


    </div>
  );
}
