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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function RejectedRightsTab() {
  const [authRegister, setAuthRegister] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);
  const debouncedListSearch = useDebounce(searchQuery, 500);

  // Review mode state
  const [reviewingBatch, setReviewingBatch] = useState<RightsIssue | null>(
    null,
  );
  const [authPage, setAuthPage] = useState(1);
  const [authPageSize, setAuthPageSize] = useState(20);
  const [downloading, setDownloading] = useState(false);

  // Registers for filter
  const { data: registersData, isLoading: loadingRegisters } = useGetRegisters({
    status: "ACTIVE",
    size: 100,
  });
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
        rows,
      );
      toast.success("Download complete", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to generate CSV: " + err.message, { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  // ── Reimbursement Confirmation Modal state ──
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("");

  // ── List view ──
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
                            ? format(
                                new Date(issue.qualificationDate),
                                "dd MMM yyyy",
                              )
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
                            {issue.submittedAt
                              ? formatDate(issue.submittedAt)
                              : "----"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-red-100 text-red-800 border-0 text-[13px]">
                            {issue.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
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
                        </td>
                      </tr>
                    );
                  })}
                  {filteredList.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
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
            total={filteredList.length}
            pageSize={listPageSize}
            onPageChange={setListPage}
            onPageSizeChange={setListPageSize}
            pageBase={1}
          />
        </Card>
      </div>
    );
  }

  // ── Detail / Review view ──
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
          {reviewingBatch.status}
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

      {/* Process Refund — opens gateway confirmation modal */}
      <Button
        size="lg"
        variant="destructive"
        className="h-12 text-base font-semibold w-full"
        disabled={shLoading}
        onClick={() => {
          setSelectedGateway("");
          setIsConfirmOpen(true);
        }}
      >
        Process Reimbursment
      </Button>

      {/* Confirmation Modal (shared) */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Approve Reimbursement
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              You are about to process a refund reimbursement for the following
              declaration.
            </DialogDescription>
          </DialogHeader>

          <div className="m-4 space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50 text-[13px]">
            {reviewingBatch && (
              <>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-sm">
                    Declaration Reference
                  </span>
                  <span className="font-mono font-semibold text-sm">
                    {reviewingBatch?.ref}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-sm">
                    Current Stage
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs font-bold border-0 bg-blue-100 text-blue-800"
                  >
                    {reviewingBatch?.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total Amount
                  </span>
                  <span className="font-mono font-bold text-destructive text-base">
                    ₦{reviewingBatch?.totalAmount.toLocaleString()}
                  </span>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-foreground">
                Select Payment Gateway <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedGateway}
                onValueChange={(value) => setSelectedGateway(value as string)}
              >
                <SelectTrigger className="w-full mrpsl-input">
                  <SelectValue placeholder="Select Payment Gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nibss">NIBSS</SelectItem>
                  <SelectItem value="remita">Remita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              className="text-xs font-bold"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-xs font-bold px-6"
              disabled={!selectedGateway}
              onClick={() => {
                setIsConfirmOpen(false);
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
