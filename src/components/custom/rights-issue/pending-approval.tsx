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
  useSubmitForApproval,
} from "@/hooks/useRights";
import { RightsIssue } from "@/types/rights";
import { getRightsIssueShareholders } from "@/actions/rightsActions";

import { toast } from "sonner";
import { cn, exportToCSV } from "@/lib/utils";
// import type { DateRange } from "react-day-picker";
import {
  ShholderRows,
  ShholderTableHead,
  ShholderTfoot,
} from "./entitlement-table";
import { PaginationBar } from "../pagination-bar";
// import { DateRangePicker } from "../date-range-picker";
import { EntitlementStatsSkeleton, EntitlementTableSkeleton } from "./loaders";
import { DataErrorState } from "../ipo/loaders";
import { ApproveRightsDialog, RejectRightsDialog } from "./approval-dialogs";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils/format";

export default function RightsIssuePendingApproval({
  setActiveTab,
}: {
  setActiveTab?: (tab: string) => void;
}) {
  // Filters & List State
  const [authRegister, setAuthRegister] = useState("");
  // const [authDateRange, setAuthDateRange] = useState<DateRange | undefined>(
  //   undefined,
  // );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);
  const debouncedListSearch = useDebounce(searchQuery, 500);

  // Selection state for Review mode
  const [authReviewingBatch, setAuthReviewingBatch] =
    useState<RightsIssue | null>(null);

  // Review mode pagination
  const [authPage, setAuthPage] = useState(0);
  const [authPageSize, setAuthPageSize] = useState(10);

  // Store & Download state
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!authReviewingBatch) return;
    if (!shData?.content || shData.content.length === 0) {
      toast.error("No data available to download");
      return;
    }
    setDownloading(true);
    const toastId = toast.loading("Generating Excel/CSV export...");
    try {
      const allEntitlements = await getRightsIssueShareholders({
        id: authReviewingBatch.id.toString(),
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
        `rights_entitlements_${authReviewingBatch.ref}.csv`,
        headers,
        rows,
      );
      toast.success("Download complete", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to generate CSV: " + err.message, { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  // Dialog states
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  // Registers for filter
  const { data: registersData } = useGetRegisters({ status: "ACTIVE", size: 100 });
  const activeRegisters = registersData?.content || [];

  // Main list query
  const {
    data: pendingList,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useAllRightsIssues({
    registerId: authRegister === "" ? undefined : authRegister,
    page: listPage,
    pageSize: listPageSize,
    search: debouncedListSearch != "" ? debouncedListSearch : undefined,
    status: selectedStatus === "" ? undefined : selectedStatus,
  });

  // Review mode queries
  const submitMutation = useSubmitForApproval();

  const {
    data: shData,
    isLoading: shLoading,
    isError: shError,
    refetch: refetchSh,
  } = useGetRightsIssueShareholders({
    params: {
      id: authReviewingBatch?.id.toString() || "",
      page: authPage,
      pageSize: authPageSize,
    },
    options: {
      enabled: !!authReviewingBatch,
    },
  });

  const filteredList = useMemo(() => {
    if (!pendingList?.content) return [];
    return pendingList?.content.filter((r) => {
      return r.status === "PENDING_AUTH" || r.status === "DRAFT";
      // || r.status === "ICU_REJECTED" || r.status === "AUTH_REJECTED";
    });
  }, [pendingList?.content]);

  const handleSubmitForApproval = () => {
    submitMutation.mutate(authReviewingBatch?.id || "", {
      onSuccess: () => {
        toast.success("Declaration submitted for approval.");
        setAuthReviewingBatch((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: "PENDING_AUTH",
          };
        });
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to submit for approval");
      },
    });
  };

  if (authReviewingBatch === null) {
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
                onValueChange={(v) => setAuthRegister(v ?? "all")}
              >
                <SelectTrigger className="mrpsl-input w-full">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Registers</SelectItem>
                  {activeRegisters.map((r) => (
                    <SelectItem key={r.registerId} value={r.registerId}>
                      {r.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* <DateRangePicker date={authDateRange} setDate={setAuthDateRange} /> */}
            <div className="space-y-1.5">
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v ?? "all")}
              >
                <SelectTrigger className="mrpsl-input w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="PENDING_AUTH">PENDING_AUTH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Batch list */}
        <Card className="mrpsl-card overflow-hidden">
          {listLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading pending declarations...
              </p>
            </div>
          ) : listError ? (
            <DataErrorState
              message="Failed to load pending declarations"
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
                    <th className="px-4 py-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredList?.map((issue: RightsIssue) => (
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
                          ? format(
                            new Date(issue.qualificationDate),
                            "dd MMM yyyy",
                          )
                          : "----"}{" "}
                      </td>
                      <td className="px-4 py-3 font-mono text-right">
                        {issue.totalEntitlements?.toLocaleString() || "0"}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-blue-600 font-semibold">
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
                          {issue.submittedAt
                            ? formatDate(issue.submittedAt)
                            : "----"}{" "}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                          {issue.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAuthReviewingBatch(issue);
                            setAuthPage(1);
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredList?.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-sm text-muted-foreground italic"
                      >
                        No pending approvals
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <PaginationBar
            page={listPage}
            total={pendingList?.pagination.total || 0}
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
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => {
            setAuthReviewingBatch(null);
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pending Approval
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {authReviewingBatch.ref}
        </span>
        <span className="text-muted-foreground text-sm">
          · {authReviewingBatch.registerName} · {authReviewingBatch.offerName}
        </span>
        <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
          {authReviewingBatch.status}
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

      {/* Stats */}
      {shLoading ? (
        <EntitlementStatsSkeleton />
      ) : shError ? (
        <DataErrorState message="Failed to load stats" onRetry={refetchSh} />
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              // label: "Eligible Shareholders",
              label: "Total Shareholders",
              value: shData?.stats?.totalShareholders?.toLocaleString() || "0",
              color: "text-foreground",
            },
            {
              label: "Total Rights Due",
              value: shData?.stats?.totalRightsDue?.toLocaleString() || "0",
              color: "text-blue-600",
            },
            {
              label: "Total Amount Due (₦)",
              value: `₦${shData?.stats?.totalAmountDue.toLocaleString() || "0"}`,
              color: "text-foreground",
            },
            {
              // label: "Fractional Shares",
              label: "Total Units Held",
              value: shData?.stats?.totalUnitsHeld?.toLocaleString() || "0",
              color: "text-amber-600",
            },
          ].map((s) => (
            <Card key={s.label} className="mrpsl-card p-3">
              <div className="mrpsl-section-title">{s.label}</div>
              <div className={cn("text-xl font-mono font-bold mt-1", s.color)}>
                {s.value}
              </div>
            </Card>
          ))}
        </div>
      )}

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
                <ShholderRows
                  rows={shData?.content || []}
                  pageStart={authPage * authPageSize}
                />
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

      {/* Approve / Reject */}
      {authReviewingBatch.status === "DRAFT" ? (
        <Button
          size="lg"
          className="h-12 text-base font-semibold w-full"
          onClick={handleSubmitForApproval}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Submit for Approval
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="destructive"
            size="lg"
            className="h-12 text-base font-semibold"
            onClick={() => setShowReject(true)}
          >
            Reject Declaration
          </Button>
          <Button
            size="lg"
            className="h-12 text-base font-semibold"
            onClick={() => setShowApprove(true)}
          >
            Approve &amp; Enable ICU Approval
          </Button>
        </div>
      )}

      <ApproveRightsDialog
        id={authReviewingBatch.id.toString()}
        refCode={authReviewingBatch.ref}
        open={showApprove}
        onOpenChange={setShowApprove}
        onSuccess={() => {
          setAuthReviewingBatch(null);
          refetchList();
          if (setActiveTab) setActiveTab("icu");
        }}
        type="ops"
      />
      <RejectRightsDialog
        id={authReviewingBatch.id.toString()}
        refCode={authReviewingBatch.ref}
        open={showReject}
        onOpenChange={setShowReject}
        onSuccess={() => {
          setAuthReviewingBatch(null);
          refetchList();
          if (setActiveTab) setActiveTab("declaration");
        }}
        type="ops"
        rightsIssueDetails={authReviewingBatch}
      />
    </div>
  );
}
