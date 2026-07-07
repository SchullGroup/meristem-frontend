import { useState } from "react";
import {
  ArrowLeft,
  Download,
  Search,
  Loader2,
  FileCheck2,
  FileX2,
} from "lucide-react";

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
import { cn, exportToCSV } from "@/lib/utils";
import {
  ShholderRows,
  ShholderTableHead,
  ShholderTfoot,
} from "./entitlement-table";
import { PaginationBar } from "../pagination-bar";
import { EntitlementStatsSkeleton, EntitlementTableSkeleton } from "./loaders";
import { DataErrorState } from "../ipo/loaders";
import { ApproveRightsDialog, RejectRightsDialog } from "./approval-dialogs";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";

export default function RightsIssueICUApproval({
  setActiveTab,
}: {
  setActiveTab?: (tab: string) => void;
}) {
  const [icuReviewingBatch, setIcuReviewingBatch] =
    useState<RightsIssue | null>(null);

  // Download state
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!icuReviewingBatch) return;
    if (!shData?.content || shData.content.length === 0) {
      toast.error("No data available to download");
      return;
    }
    setDownloading(true);
    const toastId = toast.loading("Generating Excel/CSV export...");
    try {
      const allEntitlements = await getRightsIssueShareholders({
        id: icuReviewingBatch.id.toString(),
        page: 0,
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
        "Amount Due (NGN)",
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
        `rights_entitlements_${icuReviewingBatch.ref}.csv`,
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

  // Filters & List State
  const [authRegister, setAuthRegister] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);
  const debouncedListSearch = useDebounce(searchQuery, 500);

  // Review mode pagination
  const [authPage, setAuthPage] = useState(1);
  const [authPageSize, setAuthPageSize] = useState(20);

  // Dialog states
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  // Registers for filter
  const { data: registersData, isLoading: loadingRegisters } = useGetRegisters({
    status: "ACTIVE",
    size: 100,
  });
  const activeRegisters = registersData?.content || [];

  // Main list query
  const {
    data: icuIlist,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useAllRightsIssues({
    registerId: authRegister === "" ? undefined : authRegister,
    page: listPage,
    pageSize: listPageSize,
    status: "PENDING_ICU",
    search: debouncedListSearch !== "" ? debouncedListSearch : undefined,
  });

  const {
    data: shData,
    isLoading: shLoading,
    isError: shError,
    refetch: refetchSh,
  } = useGetRightsIssueShareholders({
    params: {
      id: icuReviewingBatch?.id.toString() || "",
      page: authPage,
      pageSize: authPageSize,
    },
    options: {
      enabled: !!icuReviewingBatch,
    },
  });

  if (icuReviewingBatch === null) {
    return (
      <>
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
                onValueChange={(v) => setAuthRegister(v ?? "")}
              >
                <SelectTrigger className="mrpsl-input w-full">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  {loadingRegisters ? (
                    <div className="py-10 flex items-center justify-center">
                      <Loader2 className="animate-spin w-4 h-4" />
                    </div>
                  ) : (
                    <>
                      <SelectItem value="">All Register</SelectItem>
                      {activeRegisters?.map((r) => (
                        <SelectItem key={r.registerId} value={r.symbol}>
                          <span className="font-bold">{r.registerName}</span> -{" "}
                          <span className="text-xs translate-y-0.5">
                            {r.symbol}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* <DateRangePicker date={authDateRange} setDate={setAuthDateRange} /> */}
          </div>
        </Card>

        {/* ── Queue view ── */}
        <Card className="mrpsl-card overflow-hidden">
          {listLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading pending icu declarations...
              </p>
            </div>
          ) : listError ? (
            <DataErrorState
              message="Failed to load pending declarations"
              onRetry={refetchList}
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">BATCH REF</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">RIGHTS ISSUE</th>
                  <th className="px-4 py-3">QUALIFICATION DATE</th>
                  <th className="px-4 py-3 text-right">ELIGIBLE SHs</th>
                  <th className="px-4 py-3 text-right">RIGHTS DECLARED</th>
                  <th className="px-4 py-3 text-right">TOTAL AMOUNT DUE</th>
                  <th className="px-4 py-3">SUBMITTED BY</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {icuIlist?.content?.map((issue: RightsIssue) => (
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
                        : "----"}
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
                          ? format(new Date(issue.submittedAt), "dd MMM yyyy")
                          : "----"}
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
                          setIcuReviewingBatch(issue);
                        }}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!icuIlist?.content || icuIlist?.content.length === 0) && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm text-muted-foreground italic"
                    >
                      No pending ICU approvals
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {icuIlist?.pagination ? (
            <PaginationBar
              page={listPage}
              total={icuIlist?.pagination.total || 0}
              onPageChange={setListPage}
              pageSize={listPageSize}
              onPageSizeChange={setListPageSize}
              pageBase={1}
            />
          ) : null}
        </Card>
      </>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Ops approval record */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIcuReviewingBatch(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to ICU Queue
        </Button>

        <div className="h-5 w-px bg-border mx-1" />
        <span className="font-mono text-sm font-semibold">
          {icuReviewingBatch?.ref}
        </span>
        <span className="text-muted-foreground text-sm">
          · {icuReviewingBatch?.registerName} · {icuReviewingBatch?.offerName}
        </span>
        <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
          {icuReviewingBatch?.status}
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
              //   label: "Rights Declared",
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

      {/* Actions */}
      {icuReviewingBatch?.status === "PENDING_ICU" ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="destructive"
            size="lg"
            className="h-12 text-base font-semibold"
            onClick={() => {
              setShowReject(true);
            }}
          >
            Return to Ops
          </Button>
          <Button
            size="lg"
            className="h-12 text-base font-semibold"
            onClick={() => {
              setShowApprove(true);
            }}
          >
            ICU Approve &amp; Clear for Allotment
          </Button>
        </div>
      ) : (
        <Card
          className={cn(
            "mrpsl-card p-4 flex items-center gap-3",
            icuReviewingBatch?.status === "ICU_APPROVED"
              ? "bg-green-50 border-green-200"
              : "bg-red-50/60 border-red-200",
          )}
        >
          {icuReviewingBatch?.status === "ICU_APPROVED" ? (
            <>
              <FileCheck2 className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm font-semibold text-green-800">
                This submission has been ICU approved and cleared for allotment
                processing.
              </p>
            </>
          ) : (
            <>
              <FileX2 className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm font-semibold text-red-800">
                This submission was returned to Operations for review.
              </p>
            </>
          )}
        </Card>
      )}

      <ApproveRightsDialog
        id={icuReviewingBatch.id.toString()}
        refCode={icuReviewingBatch.ref}
        open={showApprove}
        onOpenChange={setShowApprove}
        onSuccess={() => {
          setIcuReviewingBatch(null);
          refetchList();
          if (setActiveTab) setActiveTab("allotment");
        }}
        type="icu"
      />
      <RejectRightsDialog
        id={icuReviewingBatch.id.toString()}
        refCode={icuReviewingBatch.ref}
        open={showReject}
        onOpenChange={setShowReject}
        onSuccess={() => {
          setIcuReviewingBatch(null);
          refetchList();
          if (setActiveTab) setActiveTab("auth");
        }}
        type="icu"
        rightsIssueDetails={icuReviewingBatch}
      />
    </div>
  );
}
