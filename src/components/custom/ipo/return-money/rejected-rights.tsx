"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download, Search, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useAllRightsIssues,
  useGetRightsIssueShareholders,
} from "@/hooks/useRights";
import { RightsIssue } from "@/types/rights";
import { getRightsIssueShareholders } from "@/actions/rightsActions";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils";
import {
  ShholderRows,
  ShholderTableHead,
  ShholderTfoot,
} from "../../rights-issue/entitlement-table";
import { PaginationBar } from "../../pagination-bar";
import { EntitlementTableSkeleton } from "../../rights-issue/loaders";
import { DataErrorState } from "../../ipo/loaders";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils/format";

export function RejectedRightsTab() {
  const [authRegister, setAuthRegister] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);
  const debouncedListSearch = useDebounce(searchQuery, 500);

  // Review mode state
  const [reviewingBatch, setReviewingBatch] = useState<RightsIssue | null>(null);
  const [authPage, setAuthPage] = useState(1);
  const [authPageSize, setAuthPageSize] = useState(20);
  const [downloading, setDownloading] = useState(false);
  const [refundedBatches, setRefundedBatches] = useState<string[]>([]);

  // Registers for filter
  const { data: registersData } = useGetRegisters({ status: "ACTIVE", size: 100 });
  const activeRegisters = registersData?.content || [];

  // Get all rights issue declarations
  const {
    data: rightsList,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useAllRightsIssues({
    registerId: authRegister === "" ? undefined : authRegister,
    page: listPage,
    pageSize: listPageSize,
    search: debouncedListSearch !== "" ? debouncedListSearch : undefined,
  });

  // Filter for rejected declarations
  const filteredList = useMemo(() => {
    if (!rightsList?.content) return [];
    return rightsList?.content.filter((r) => {
      return r.status === "AUTH_REJECTED" || r.status === "ICU_REJECTED";
    });
  }, [rightsList?.content]);

  // Review mode details
  const {
    data: shData,
    isLoading: shLoading,
    isError: shError,
    refetch: refetchSh,
  } = useGetRightsIssueShareholders({
    params: {
      id: reviewingBatch?.id.toString() || "",
      page: authPage,
      pageSize: authPageSize,
    },
    options: {
      enabled: !!reviewingBatch,
    },
  });

  const handleDownload = async () => {
    if (!reviewingBatch) return;
    if (!shData?.content || shData.content.length === 0) {
      toast.error("No data available to download");
      return;
    }
    setDownloading(true);
    const toastId = toast.loading("Generating Excel/CSV export...");
    try {
      const allEntitlements = await getRightsIssueShareholders({
        id: reviewingBatch.id.toString(),
        pageSize: shData.pagination.total || 100000,
      });

      const dataToExport = allEntitlements?.data?.entitlements?.content || [];

      const headers = [
        "S/N",
        "Shareholder Name",
        "CHN",
        "Stockbroker Code",
        "Address",
        "Bank Name",
        "Bank Account No",
        "Units Held",
        "Rights Ratio",
        "Rights Due",
        "Amount Due",
      ];

      const rows = dataToExport.map((s: any, idx: number) => [
        idx + 1,
        s.name || "",
        s.chn || "",
        s.brokerCode || "",
        s.address || "",
        s.bankName || "",
        s.bankAccount || "",
        s.unitsHeld,
        s.rightsRatio || "",
        s.rightsDue,
        s.amountPayable,
      ]);

      exportToCSV(
        `rejected_rights_returns_${reviewingBatch.ref}.csv`,
        headers,
        rows
      );
      toast.success("Download complete", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to generate CSV: " + err.message, { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const triggerRefund = (batchId: string, ref: string, amount: number) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Processing return payment for ${ref}...`,
        success: () => {
          setRefundedBatches((prev) => [...prev, batchId]);
          return `Refund of ₦${amount.toLocaleString()} for declaration ${ref} processed successfully.`;
        },
        error: "Refund failed.",
      }
    );
  };

  if (reviewingBatch === null) {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <Card className="mrpsl-card p-5">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 mrpsl-input"
              />
            </div>
            <div className="flex-1 max-w-xs">
              <Select
                value={authRegister}
                onValueChange={(v) => setAuthRegister(v || "")}
              >
                <SelectTrigger className="mrpsl-input w-full">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Registers</SelectItem>
                  {activeRegisters.map((r) => (
                    <SelectItem key={r.registerId} value={r.symbol}>
                      {r.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* List of Rejected Rights Declarations */}
        <Card className="mrpsl-card overflow-hidden">
          {listLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading rejected rights issues...
              </p>
            </div>
          ) : listError ? (
            <DataErrorState
              message="Failed to load rejected rights issues"
              onRetry={refetchList}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3">DECLARATION REF</th>
                    <th className="px-4 py-3">REGISTER</th>
                    <th className="px-4 py-3">RIGHTS ISSUE</th>
                    <th className="px-4 py-3">RECORD DATE</th>
                    <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                    <th className="px-4 py-3 text-right">RIGHTS DECLARED</th>
                    <th className="px-4 py-3 text-right">TOTAL AMOUNT DUE</th>
                    <th className="px-4 py-3">SUBMITTED BY</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredList.map((issue: RightsIssue) => {
                    const isRefunded = refundedBatches.includes(issue.id.toString());
                    return (
                      <tr key={issue.id} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                          {issue.ref}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {issue.registerName}
                        </td>
                        <td className="px-4 py-3 text-sm">{issue.offerName}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[13px]">
                          {issue.qualificationDate
                            ? format(new Date(issue.qualificationDate), "dd MMM yyyy")
                            : "----"}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          {issue.totalEntitlements?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-red-600 font-semibold">
                          {issue.totalEntitlements?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          ₦{issue.totalAmount?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[13px] font-medium">
                            {issue.submittedByName}
                          </div>
                          <div className="text-[13px] text-muted-foreground">
                            {issue.submittedAt ? formatDate(issue.submittedAt) : "----"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-red-100 text-red-800 border-0 text-[13px]">
                            {isRefunded ? "REFUNDED" : issue.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingBatch(issue);
                              setAuthPage(1);
                            }}
                          >
                            Review
                          </Button>
                          {!isRefunded && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                triggerRefund(
                                  issue.id.toString(),
                                  issue.ref,
                                  issue.totalAmount || 0
                                )
                              }
                            >
                              Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredList.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-sm text-muted-foreground italic"
                      >
                        No rejected rights declarations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <PaginationBar
            page={listPage}
            total={rightsList?.pagination.total || 0}
            pageSize={listPageSize}
            onPageChange={setListPage}
            onPageSizeChange={setListPageSize}
            pageBase={1}
          />
        </Card>
      </div>
    );
  }

  /* ── Detail / Review view ── */
  const isBatchRefunded = refundedBatches.includes(reviewingBatch.id.toString());
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => {
            setReviewingBatch(null);
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Rejected Rights
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {reviewingBatch.ref}
        </span>
        <span className="text-muted-foreground text-sm">
          · {reviewingBatch.registerName} · {reviewingBatch.offerName}
        </span>
        <Badge className="bg-red-100 text-red-800 border-0 text-[13px]">
          {isBatchRefunded ? "REFUNDED" : reviewingBatch.status}
        </Badge>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Download CSV
        </Button>
      </div>

      {/* Shareholder table */}
      {shLoading ? (
        <EntitlementTableSkeleton />
      ) : shError ? (
        <DataErrorState
          message="Failed to load shareholders"
          onRetry={refetchSh}
        />
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <ShholderTableHead />
              <tbody className="divide-y">
                <ShholderRows rows={shData?.content || []} />
              </tbody>
              <ShholderTfoot
                rows={shData?.content || []}
                total={shData?.pagination.total || 0}
              />
            </table>
          </div>
        </Card>
      )}

      <PaginationBar
        page={authPage}
        total={shData?.pagination.total || 0}
        onPageChange={setAuthPage}
        pageSize={authPageSize}
        onPageSizeChange={setAuthPageSize}
        pageBase={1}
      />

      {/* Action Payout */}
      {!isBatchRefunded && (
        <Button
          size="lg"
          variant="destructive"
          className="h-12 text-base font-semibold w-full"
          onClick={() =>
            triggerRefund(
              reviewingBatch.id.toString(),
              reviewingBatch.ref,
              reviewingBatch.totalAmount || 0
            )
          }
        >
          Process Refund (₦{reviewingBatch.totalAmount?.toLocaleString() || "0"})
        </Button>
      )}
    </div>
  );
}
