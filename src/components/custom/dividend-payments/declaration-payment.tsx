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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Play, MousePointerClick } from "lucide-react";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getDividendNumbers } from "@/actions/dividendReportActions";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useInitiatePaymentRun,
  useApprovePaymentRun,
  useGetDeclarationPayment,
  useDownloadNibssFile,
} from "@/hooks/useDividendPayment";
import { formatNumber } from "@/lib/utils/format";
import { PaymentRowContent } from "@/actions/dividendPayments";
import { PaginationBar } from "../pagination-bar";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { DataErrorState } from "../ipo/loaders";

export default function DeclarationPayment({ tab }: { tab: string }) {
  const currentUser = useStore((state) => state.currentUser);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // ── Filters ------------
  const [selectedRegister, setSelectedRegister] = useState("");
  const [selectedDiv, setSelectedDiv] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  // ── Payment-run state ------──────────────────────
  const [gateway, setGateway] = useState("nibss");
  const [payRunInitiated, setPayRunInitiated] = useState(false);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);

  // ── Data fetching ------──────────────────────────
  const { data: activeRegisters, isLoading: loadingRegisters } =
    useGetRegisters({ size: 100, status: "ACTIVE" });

  // Dividend numbers filtered by the chosen register
  const { data: activeDividends, isLoading: loadingDividends } = useQuery({
    queryKey: ["dividend-numbers", selectedRegister],
    queryFn: () =>
      getDividendNumbers({
        registerId: selectedRegister !== "" ? selectedRegister : undefined,
        status: "AUTHORIZED",
      }),
    enabled: tab === "decl" && !!selectedRegister,
  });

  const registers = activeRegisters?.content || [];
  const dividendNumbers = activeDividends?.data || [];

  const initiateMutation = useInitiatePaymentRun();
  const approveMutation = useApprovePaymentRun();
  const downloadNibssMutation = useDownloadNibssFile();

  // Only fetch declaration payment when both register AND dividend are chosen
  const readyToFetch = tab === "decl" && !!selectedRegister && !!selectedDiv;

  const {
    data: declarationResponse,
    isLoading: fetchingPayments,
    isError,
    error,
    refetch,
  } = useGetDeclarationPayment(
    {
      registerId: selectedRegister !== "" ? selectedRegister : undefined,
      paymentNumber: selectedDiv !== "" ? selectedDiv : undefined,
      status: paymentStatus !== "" ? paymentStatus.toUpperCase() : undefined,
      page,
      size: pageSize,
    },
    { enabled: readyToFetch },
  );

  const stats = declarationResponse?.data;
  const paymentRows = stats?.rows?.content || [];
  const total = stats?.rows?.totalElements || 0;
  const totalPages = stats?.rows?.totalPages || 1;

  // ── Helpers ------------

  /** Reset payment-run state whenever the user changes either filter */
  function handleRegisterChange(value: string) {
    setSelectedRegister(value);
    setSelectedDiv(""); // dividend list changes — clear stale selection
    resetPayRun();
  }

  function handleDivChange(value: string) {
    setSelectedDiv(value);
    resetPayRun();
  }

  function resetPayRun() {
    setPayRunInitiated(false);
    setActiveRunId(null);
  }

  // ── Actions ------------

  function initiatePaymentRun() {
    if (!gateway || gateway === "") {
      toast.error("Please select a payment gateway");
      return;
    }

    if (declarationResponse?.data?.declarationId == null) {
      toast.error("Please select a dividend number.");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    initiateMutation.mutate(
      {
        declarationId: declarationResponse.data.declarationId.toString(),
        gateway,
        initiatedBy: currentUser.email,
      },
      {
        onSuccess: (res) => {
          setPayRunInitiated(true);
          if (res.data?.id) setActiveRunId(res.data.id);
          toast.info(
            "Preview generated. Review the NIBSS file below, then approve.",
          );
        },
        onError: (err) => {
          toast.error(err.message || "Failed to initiate payment run.");
        },
      },
    );
  }

  function approvePaymentRun() {
    if (!activeRunId) {
      toast.error("No active payment run to approve.");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    approveMutation.mutate(
      {
        id: activeRunId,
        body: {
          comment: "Approved via dashboard",
          authorisedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success("Payment run submitted for ICU approval.");
          resetPayRun();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to approve payment run.");
        },
      },
    );
  }

  function handleDownloadNibss() {
    if (!activeRunId) {
      toast.error(
        "Please initiate a payment run first to generate a NIBSS file.",
      );
      return;
    }

    downloadNibssMutation.mutate(activeRunId, {
      onSuccess: (data) => {
        const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PAY-DIV-${activeRunId}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("NIBSS file downloaded successfully.");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to download NIBSS file.");
      },
    });
  }

  // ── Derived display values ------─────────────────
  const unpaid = Math.max(
    0,
    (stats?.totalEligible ?? 0) -
    (stats?.successful ?? 0) -
    (stats?.failedAttempts ?? 0),
  );

  // ── Render ------------─
  return (
    <>
      {/* ── Filter bar ------───────────────────── */}
      <div className="flex gap-4 items-end">
        <Select
          value={selectedRegister}
          onValueChange={(value) => handleRegisterChange(value || "")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Register" />
          </SelectTrigger>
          <SelectContent>
            {loadingRegisters ? (
              <SelectItem disabled className="text-muted-foreground text-sm">
                Loading Registers...
              </SelectItem>
            ) : (
              registers.map((r) => (
                <SelectItem key={r.registerId} value={r.symbol}>
                  {r.symbol}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select
          value={selectedDiv}
          onValueChange={(value) => handleDivChange(value || "")}
          disabled={!selectedRegister}
        >
          <SelectTrigger className="w-64 mrpsl-input">
            <SelectValue placeholder="Dividend" />
          </SelectTrigger>
          <SelectContent>
            {loadingDividends ? (
              <SelectItem disabled className="text-muted-foreground text-sm">
                Loading Dividends...
              </SelectItem>
            ) : dividendNumbers.length > 0 ? (
              dividendNumbers.map((d: string) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))
            ) : (
              <SelectItem disabled className="text-sm text-muted-foreground">
                No dividend numbers found.
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <Select
          value={paymentStatus}
          onValueChange={(value) => {
            setPaymentStatus(value || "");
            setPage(0);
          }}
          disabled={!selectedDiv && !selectedRegister}
        >
          <SelectTrigger
            className="w-48 mrpsl-input"
            id="payment-status-filter"
          >
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Initial empty state (neither filter selected) ─────────────────── */}
      {!readyToFetch && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="rounded-full bg-muted p-5">
            <MousePointerClick className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mt-1">
              {!selectedRegister
                ? "Start by selecting a register, then choose a dividend number."
                : "Select a dividend number to load the payment declaration."}
            </p>
          </div>
        </div>
      )}

      {/* ── Everything below only shown when both filters are set ─────────── */}
      {readyToFetch && (
        <>
          {/* Gateway + action controls */}
          <Card className="p-5 border-l-4 border-primary bg-muted/10">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="shrink-0">
                <h3 className="font-semibold text-sm mb-3">PAYMENT GATEWAY</h3>
                <Select
                  value={gateway}
                  onValueChange={(value) => {
                    setGateway(value || "");
                  }}
                >
                  <SelectTrigger
                    className="w-48 mrpsl-input"
                    id="payment-gateway"
                  >
                    <SelectValue placeholder="Payment Gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nibss">NIBSS</SelectItem>
                    <SelectItem value="remita">Remita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 items-center ml-auto flex-wrap">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleDownloadNibss}
                  disabled={downloadNibssMutation.isPending || !activeRunId}
                >
                  <Download className="h-4 w-4" /> Download NIBSS File (.txt)
                </Button>

                <Button
                  size="lg"
                  onClick={initiatePaymentRun}
                  disabled={initiateMutation.isPending || !!activeRunId}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {initiateMutation.isPending
                    ? "Initiating…"
                    : activeRunId
                      ? "Run Initiated"
                      : "Initiate Payment Run"}
                </Button>

                {payRunInitiated && (
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={approvePaymentRun}
                    disabled={approveMutation.isPending || !activeRunId}
                  >
                    {approveMutation.isPending
                      ? "Approving…"
                      : "Approve Payment Run"}
                  </Button>
                )}

                {/* Allow user to cancel/reset an initiated run */}
                {activeRunId && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={resetPayRun}
                    className="text-muted-foreground"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Stats cards */}
          <div className="grid grid-cols-5 gap-3">
            <Card className="p-4">
              <div className="mrpsl-section-title">Total Eligible</div>
              {fetchingPayments ? (
                <div className="bg-muted/50 rounded-md w-12 h-12 animate-pulse"></div>
              ) : (
                <div className="text-2xl font-mono mt-1 font-bold">
                  {formatNumber(stats?.totalEligible ?? 0)}
                </div>
              )}
            </Card>
            <Card className="p-4">
              <div className="mrpsl-section-title">Total Amount (₦)</div>
              <div className="text-xl font-mono mt-1 font-bold">
                {fetchingPayments ? (
                  <div className="bg-muted/50 rounded-md w-12 h-12 animate-pulse"></div>
                ) : (
                  formatNumber(stats?.totalPayout ?? 0)
                )}
              </div>
            </Card>
            <Card className="p-4">
              <div className="mrpsl-section-title">Paid</div>
              <div className="text-2xl font-mono mt-1 font-bold text-green-600">
                {fetchingPayments ? (
                  <div className="bg-muted/60 rounded-md w-12 h-12 animate-pulse"></div>
                ) : (
                  formatNumber(stats?.successful ?? 0)
                )}
              </div>
            </Card>
            <Card className="p-4">
              <div className="mrpsl-section-title">Unpaid</div>
              <div className="text-2xl font-mono mt-1 font-bold text-amber-600">
                {fetchingPayments ? (
                  <div className="bg-muted/50 rounded-md w-12 h-12 animate-pulse"></div>
                ) : (
                  formatNumber(unpaid)
                )}
              </div>
            </Card>
            <Card className="p-4">
              <div className="mrpsl-section-title">Failed</div>
              <div className="text-2xl font-mono mt-1 font-bold text-red-600">
                {fetchingPayments ? (
                  <div className="bg-muted/50 rounded-md w-12 h-12 animate-pulse"></div>
                ) : (
                  formatNumber(stats?.failedAttempts ?? 0)
                )}
              </div>
            </Card>
          </div>

          {/* Payment records table */}
          <Card className="mrpsl-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/20 border-b flex items-center justify-between">
              <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
                Payment File — {formatNumber(stats?.rows?.totalElements ?? 0)}{" "}
                records
              </span>
            </div>

            {fetchingPayments ? (
              <EntitlementTableSkeleton />
            ) : isError ? (
              <DataErrorState
                message={error?.message || "Failed to load dividend payments."}
                onRetry={refetch}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="p-3">SERIAL NO</th>
                      <th className="p-3">ACCOUNT NO</th>
                      <th className="p-3">HOLDER NAME</th>
                      <th className="p-3">BANK SORT CODE</th>
                      <th className="p-3">AMOUNT (₦)</th>
                      <th className="p-3">NARRATION</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono text-[13px]">
                    {paymentRows.length > 0 ? (
                      paymentRows.map((row: PaymentRowContent) => (
                        <tr key={row.serial} className="hover:bg-accent/5">
                          <td className="p-3 text-muted-foreground">
                            {String(row.serial).padStart(3, "0")}
                          </td>
                          <td className="p-3">{row.accountNumber}</td>
                          <td className="p-3 font-sans font-medium">
                            {row.holderName}
                          </td>
                          <td className="p-3">{row.bankSortCode}</td>
                          <td className="p-3 text-right tabular-nums">
                            {row.amount > 0 ? formatNumber(row.amount) : "—"}
                          </td>
                          <td className="p-3 text-muted-foreground text-[12px]">
                            {row.narration}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={`border-0 text-[12px] ${row.status === "PAID"
                                ? "bg-green-100 text-green-800"
                                : row.status === "FAILED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                                }`}
                            >
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-muted-foreground font-sans"
                        >
                          No records found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <PaginationBar
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </>
  );
}
