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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Download, Play } from "lucide-react";
import { useStore } from "@/lib/store";
import { usePagination } from "@/lib/use-pagination";
import { useQuery } from "@tanstack/react-query";
import { getDividendNumbers } from "@/actions/dividendReportActions";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useInitiatePaymentRun,
  useApprovePaymentRun,
  useGetDeclarationPayment,
  useDownloadNibssFile,
} from "@/hooks/useDividendPayment";
import { TablePagination } from "@/components/custom/table-pagination";
import { formatNumber } from "@/lib/utils/format";
import { PaymentRowContent } from "@/actions/dividendPayments";

export default function DeclarationPayment({ tab }: { tab: string }) {
  const currentUser = useStore((state) => state.currentUser);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  const { data: activeDividends } = useQuery({
    queryKey: ["dividend-numbers"],
    queryFn: () => getDividendNumbers(),
  });

  const registers = activeRegisters?.content || [];
  const dividendNumbers = activeDividends?.data || [];

  const initiateMutation = useInitiatePaymentRun();
  const approveMutation = useApprovePaymentRun();
  const downloadNibssMutation = useDownloadNibssFile();

  const [selectedRegister, setSelectedRegister] = useState("");
  const [selectedDiv, setSelectedDiv] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [gateway, setGateway] = useState("nibss");
  const [payRunInitiated, setPayRunInitiated] = useState(false);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);

  const { data: declarationResponse, isLoading: fetchingPayments } =
    useGetDeclarationPayment(
      {
        registerId: selectedRegister !== "" ? selectedRegister : undefined,
        paymentNumber: selectedDiv !== "" ? selectedDiv : undefined,
        status: paymentStatus !== "" ? paymentStatus.toUpperCase() : undefined,
        page: page,
        size: pageSize,
      },
      {
        enabled: tab === "decl",
      },
    );

  const stats = declarationResponse?.data;
  const paymentRows = stats?.rows?.content || [];
  const total = stats?.rows?.totalElements || 0;
  const paged = usePagination(paymentRows);

  function initiatePaymentRun() {
    if (!selectedRegister || !selectedDiv) {
      toast.error("Please select a register and dividend first.");
      return;
    }

    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    initiateMutation.mutate(
      {
        declarationId: selectedRegister,
        gateway,
        initiatedBy: currentUser?.email,
      },
      {
        onSuccess: (res) => {
          setPayRunInitiated(true);
          if (res.data?.id) {
            setActiveRunId(res.data.id);
          }
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
          authorisedBy: currentUser?.email,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Payment run submitted for ICU approval.`);
          setPayRunInitiated(false);
          setActiveRunId(null);
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

  return (
    <>
      <div className="flex gap-4 items-end">
        <Select
          value={selectedRegister}
          onValueChange={(v) => setSelectedRegister(v || "")}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Register" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Registers</SelectItem>
            {registers.map((r) => (
              <SelectItem key={r.registerId} value={r.registerId}>
                {r.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedDiv}
          onValueChange={(v) => setSelectedDiv(v || "")}
        >
          <SelectTrigger className="w-64 mrpsl-input">
            <SelectValue placeholder="Dividend" />
          </SelectTrigger>
          <SelectContent>
            {dividendNumbers.map((d: string) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gateway + action controls — single horizontal bar */}
      <Card className="p-5 border-l-4 border-primary bg-muted/10">
        <div className="flex items-center gap-8 flex-wrap">
          <div className="shrink-0">
            <h3 className="font-semibold text-sm mb-3">
              Select Payment Gateway
            </h3>
            <RadioGroup
              value={gateway}
              onValueChange={setGateway}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nibss" id="g1" />
                <label
                  htmlFor="g1"
                  className="text-sm font-medium cursor-pointer"
                >
                  NIBSS{" "}
                  <span className="text-[13px] text-muted-foreground font-normal">
                    — Nigeria Inter-Bank Settlement System
                  </span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remita" id="g2" />
                <label
                  htmlFor="g2"
                  className="text-sm font-medium cursor-pointer"
                >
                  Remita{" "}
                  <span className="text-[13px] text-muted-foreground font-normal">
                    — SystemSpecs
                  </span>
                </label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex gap-3 items-center ml-auto flex-wrap">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleDownloadNibss}
              disabled={downloadNibssMutation.isPending}
            >
              <Download className="h-4 w-4" /> Download NIBSS File (.txt)
            </Button>
            <Button
              size="lg"
              onClick={initiatePaymentRun}
              disabled={initiateMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" /> Initiate Payment Run
            </Button>
            {payRunInitiated && (
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={approvePaymentRun}
                disabled={approveMutation.isPending}
              >
                Approve Payment Run
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="mrpsl-section-title">Total Eligible</div>
          <div className="text-2xl font-mono mt-1 font-bold">
            {formatNumber(stats?.totalEligible || 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mrpsl-section-title">Total Amount (₦)</div>
          <div className="text-xl font-mono mt-1 font-bold">
            {formatNumber(stats?.totalPayout || 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mrpsl-section-title">Paid</div>
          <div className="text-2xl font-mono mt-1 font-bold text-green-600">
            {formatNumber(stats?.successful || 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mrpsl-section-title">Unpaid</div>
          <div className="text-2xl font-mono mt-1 font-bold text-amber-600">
            {formatNumber(
              (stats?.totalEligible || 0) -
                (stats?.successful || 0) -
                (stats?.failedAttempts || 0),
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mrpsl-section-title">Failed</div>
          <div className="text-2xl font-mono mt-1 font-bold text-red-600">
            {formatNumber(stats?.failedAttempts || 0)}
          </div>
        </Card>
      </div>

      {/* Full payment records table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/20 border-b flex items-center justify-between">
          <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">
            Payment File — {formatNumber(stats?.rows?.totalElements || 0)}{" "}
            records
          </span>
          <Select
            value={paymentStatus}
            onValueChange={(v) => setPaymentStatus(v || "All")}
          >
            <SelectTrigger className="w-48 mrpsl-input">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              {fetchingPayments ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground font-sans"
                  >
                    Loading payment records...
                  </td>
                </tr>
              ) : paymentRows.length > 0 ? (
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
                        className={`border-0 text-[12px] ${row.status === "PAID" ? "bg-green-100 text-green-800" : row.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}
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
                    {selectedRegister && selectedDiv
                      ? "No records found matching filters."
                      : "Select a register and dividend to load payment records."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalPages={paged.totalPages}
        total={total}
        from={paged.from}
        to={paged.to}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}
