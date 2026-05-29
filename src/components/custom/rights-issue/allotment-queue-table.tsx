"use client";

import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RightsIssue } from "@/types/rights";
import { PaginationBar } from "../pagination-bar";
import { DataErrorState } from "../ipo/loaders";
import { format } from "date-fns";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useAllRightsIssues } from "@/hooks/useRights";
import { useDebounce } from "@/hooks/useDebounce";

interface AllotmentQueueTableProps {
  onSelectIssue: (issue: RightsIssue) => void;
}

export function AllotmentQueueTable({
  onSelectIssue,
}: AllotmentQueueTableProps) {
  // Filters & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegister, setSelectedRegister] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState("ICU_APPROVED");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedListSearch = useDebounce(searchQuery, 500);

  // Live Register options for filter
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });

  // Main list fetch
  const {
    data: icuApprovedList,
    isLoading,
    isError,
    refetch: refetchList,
  } = useAllRightsIssues({
    search: debouncedListSearch != "" ? debouncedListSearch : undefined,
    page: currentPage,
    pageSize,
    registerId: selectedRegister === "" ? undefined : selectedRegister,
    status: selectedStatus === "" ? undefined : selectedStatus,
  });

  const filteredList = useMemo(() => {
    if (!icuApprovedList?.content) return [];
    return icuApprovedList?.content.filter((r) => {
      return r.status === "ICU_APPROVED" || r.status === "ALLOTTED";
    });
  }, [icuApprovedList?.content]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="mrpsl-card p-5">
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference or name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 mrpsl-input"
            />
          </div>
          <div className="max-w-xs">
            <Select
              value={selectedRegister}
              onValueChange={(v) => {
                setSelectedRegister(v || "");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="mrpsl-input w-full">
                <SelectValue placeholder="All Registers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Registers</SelectItem>
                {activeRegisters?.content?.map((r) => (
                  <SelectItem key={r.registerId} value={r.registerId}>
                    {r.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <SelectItem value="ICU_APPROVED">ICU Approved</SelectItem>
                <SelectItem value="ALLOTTED">Allotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="mrpsl-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20">
          <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
            ICU Approved — Ready for Allotment
          </p>
        </div>
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading ICU Approved declarations...
            </p>
          </div>
        ) : isError ? (
          <DataErrorState
            message="Failed to load ICU approved declarations"
            onRetry={refetchList}
          />
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">DECLARATION REF</th>
                  <th className="px-4 py-3">REGISTER</th>
                  <th className="px-4 py-3">RIGHTS ISSUE</th>
                  <th className="px-4 py-3">RATIO</th>
                  <th className="px-4 py-3">ISSUE PRICE</th>
                  {/* <th className="px-4 py-3 text-right">APPROVED</th> */}
                  <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                  <th className="px-4 py-3">ICU APPROVER</th>
                  <th className="px-4 py-3">ICU DATE</th>
                  <th className="px-4 py-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredList?.map((issue: RightsIssue) => (
                  <tr
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="mrpsl-table-row cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                      {issue?.ref}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {issue?.registerId}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {issue?.offerName}
                    </td>
                    <td className="px-4 py-3 font-mono">{issue?.ratio}</td>
                    <td className="px-4 py-3 font-mono">{issue?.issuePrice}</td>
                    {/* <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                      {issue?.totalEntitlements}
                    </td> */}
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {issue?.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {issue?.icuApprovedByName}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {issue?.icuApprovedAt
                        ? format(new Date(issue?.icuApprovedAt), "dd-MMM-yyyy")
                        : "----"}
                    </td>
                    <td className="px-4 py-3">
                      {issue?.status === "ALLOTTED" ? (
                        <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                          Allotted
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-0 text-[13px]">
                          Pending Allotment
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {(!filteredList || filteredList?.length === 0) && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm text-muted-foreground italic"
                    >
                      No pending allotments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationBar
              page={currentPage}
              total={icuApprovedList?.pagination?.total || 0}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageBase={1}
            />
          </>
        )}
      </Card>
    </div>
  );
}
