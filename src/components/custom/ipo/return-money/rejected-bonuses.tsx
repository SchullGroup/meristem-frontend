"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import {
  GET_DECLARATIONS,
  GET_DECLARATION_BY_ID,
  GET_SHAREHOLDERS_BY_DECLARATION_ID,
} from "@/actions/bonusIssuesAction";
import { formatDateOnly } from "@/utils/helperFunctions";
import { useDebounce } from "@/hooks/useDebounce";
import { DataErrorState } from "../loaders";
import { PaginationBar } from "../../pagination-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function RejectedBonusesTab() {
  const [authRegister, setAuthRegister] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedListSearch = useDebounce(searchQuery, 500);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);

  // Review mode state
  const [reviewingBatchId, setReviewingBatchId] = useState<string | null>(null);
  const [authPage, setAuthPage] = useState(1);
  const [authPageSize, setAuthPageSize] = useState(20);

  // Registers for filter
  const { data: registersData, isLoading: loadingRegisters } = useGetRegisters({
    status: "ACTIVE",
    size: 100,
  });
  const activeRegisters = registersData?.content || [];

  // Get bonus declarations
  const {
    data: declarationsData,
    isLoading: listLoading,
    isError: listError,
    error: listErrorMsg,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["bonus-declarations"],
    queryFn: () =>
      GET_DECLARATIONS({
        page: listPage,
        pageSize: listPageSize,
        registerId: authRegister !== "" ? authRegister : undefined,
        search:
          debouncedListSearch?.length > 3 ? debouncedListSearch : undefined,
      }),
  });

  // Filter for rejected declarations
  const filteredList = useMemo(() => {
    if (!declarationsData?.content) return [];
    return declarationsData?.content.filter(
      (d: { status: string }) =>
        d.status === "AUTH_REJECTED" || d.status === "ICU_REJECTED",
    );
  }, [declarationsData]);

  // Review detail queries
  const { data: activeReviewData, isLoading: isActiveReviewLoading } = useQuery(
    {
      queryKey: ["bonus-declaration", reviewingBatchId],
      queryFn: () => GET_DECLARATION_BY_ID(reviewingBatchId as string),
      enabled: !!reviewingBatchId,
    },
  );

  const activeReview = activeReviewData?.data;

  const { data: entitlementData, isLoading: isEntitlementLoading } = useQuery({
    queryKey: ["bonus-entitlements", reviewingBatchId, authPage],
    queryFn: () =>
      GET_SHAREHOLDERS_BY_DECLARATION_ID(reviewingBatchId as string, {
        page: authPage,
        pageSize: authPageSize,
      }),
    enabled: !!reviewingBatchId,
  });

  const entitlementList = entitlementData?.data?.entitlements?.content || [];
  const entitlementTotal =
    entitlementData?.data?.entitlements?.totalElements || 0;
  const entitlementTotalPages =
    entitlementData?.data?.entitlements?.totalPages || 1;

  // ── Reimbursement Confirmation Modal state ──
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("");

  // ── List view ──
  if (reviewingBatchId === null) {
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

        {/* List of Rejected Bonus Declarations */}
        <Card className="mrpsl-card overflow-hidden">
          {listLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading rejected bonus issues...
              </p>
            </div>
          ) : listError ? (
            <DataErrorState
              onRetry={refetchList}
              message={
                listErrorMsg?.message || "Failed to load bonus declarations"
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="px-4 py-3">DECLARATION REF</th>
                    <th className="px-4 py-3">REGISTER</th>
                    <th className="px-4 py-3">BONUS NAME</th>
                    <th className="px-4 py-3">RECORD DATE</th>
                    <th className="px-4 py-3 text-right">TOTAL SHAREHOLDERS</th>
                    <th className="px-4 py-3 text-right">BONUS SHARES DUE</th>
                    <th className="px-4 py-3 text-right">
                      FRACTIONAL REMAINDER
                    </th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredList.map((issue: any) => {
                    return (
                      <tr key={issue.id} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                          {issue.ref}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {issue.registerName}
                        </td>
                        <td className="px-4 py-3 text-sm">{issue.bonusName}</td>
                        <td className="px-4 py-3 text-muted-foreground text-[13px]">
                          {issue.qualificationDate
                            ? formatDateOnly(issue.qualificationDate)
                            : "----"}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          {issue.totalShareholders?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-red-600 font-semibold">
                          {issue.totalBonusShares?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3 font-mono text-right">
                          {issue.totalFractionalRemainder?.toFixed(4) ||
                            "0.0000"}
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
                              setReviewingBatchId(issue.id.toString());
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
                        colSpan={10}
                        className="px-4 py-12 text-center text-sm text-muted-foreground italic"
                      >
                        No rejected bonus declarations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <PaginationBar
            page={listPage}
            total={declarationsData?.data?.totalElements || 0}
            totalPages={declarationsData?.data?.totalPages || 1}
            pageSize={listPageSize}
            onPageChange={setListPage}
            onPageSizeChange={setListPageSize}
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
            setReviewingBatchId(null);
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Rejected Bonuses
        </Button>
        {activeReview && (
          <>
            <div className="h-5 w-px bg-border mx-1" />
            <span className="font-mono text-sm font-semibold">
              {activeReview.ref}
            </span>
            <span className="text-muted-foreground text-sm">
              · {activeReview.registerName} · {activeReview.bonusName}
            </span>
            <Badge className="bg-red-100 text-red-800 border-0 text-[13px]">
              {activeReview.status}
            </Badge>
          </>
        )}
      </div>

      {/* Shareholder table */}
      {isEntitlementLoading || isActiveReviewLoading ? (
        <div className="p-8 text-center text-muted-foreground font-medium">
          Loading shareholder lists...
        </div>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-2.5">ACCOUNT NO</th>
                  <th className="px-4 py-2.5">HOLDER NAME</th>
                  <th className="px-4 py-2.5 text-right">UNITS AT QUAL DATE</th>
                  <th className="px-4 py-2.5 text-right">BONUS DUE</th>
                  <th className="px-4 py-2.5 text-right">FRACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entitlementList.map((s: any, i: number) => (
                  <tr key={i} className="mrpsl-table-row font-mono text-[13px]">
                    <td className="px-4 py-2.5">{s?.accountNumber}</td>
                    <td className="px-4 py-2.5 font-sans font-medium">
                      {s?.name || s?.shareholderName}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {s?.unitsAtQualDate?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-red-600 font-bold">
                      {s?.bonusDue?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-600">
                      {s?.fractionalRemainder?.toFixed(4)}
                    </td>
                  </tr>
                ))}
                {entitlementList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No entitlement records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <PaginationBar
        page={authPage}
        total={entitlementTotal}
        totalPages={entitlementTotalPages}
        pageSize={authPageSize}
        onPageChange={setAuthPage}
        onPageSizeChange={setAuthPageSize}
      />

      {/* Process Refund — opens gateway confirmation modal */}
      {activeReview && (
        <Button
          size="lg"
          className="h-12 text-base font-semibold w-full"
          disabled={isEntitlementLoading}
          onClick={() => {
            setSelectedGateway("");
            setIsConfirmOpen(true);
          }}
        >
          Process Reimbursment
        </Button>
      )}

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
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
            {activeReview && (
              <>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground text-sm">
                    Declaration Reference
                  </span>
                  <span className="font-mono font-semibold text-sm">
                    {activeReview?.ref}
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
                    {activeReview?.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total Amount
                  </span>
                  <span className="font-mono font-bold text-destructive text-base">
                    ₦{activeReview?.totalAmount.toLocaleString()}
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
