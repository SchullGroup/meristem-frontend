"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/custom/table-pagination";
import { useStore } from "@/lib/store";
import { GET_APPROVALS } from "@/actions/approvalsAction";
import { ApprovalItem } from "@/lib/types";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.split(" ");
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

interface GlobalQueueProps {
  search: string;
  setSearch: (s: string) => void;
  moduleFilter: string;
  setModuleFilter: (s: string) => void;
  onReview: (item: ApprovalItem, readOnly?: boolean) => void;
}

export function GlobalQueue({
  search,
  setSearch,
  moduleFilter,
  setModuleFilter,
  onReview,
}: GlobalQueueProps) {
  const { currentUser } = useStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: response, isLoading } = useQuery({
    queryKey: ["approvals-global", search, moduleFilter, page, pageSize],
    queryFn: () =>
      GET_APPROVALS({
        scope: "GLOBAL",
        q: search || undefined,
        module:
          moduleFilter !== "All"
            ? (moduleFilter as
                | "SETUP"
                | "DIVIDENDS"
                | "CERTIFICATES"
                | "ACCOUNT_MAINTENANCE"
                | "OFFERS")
            : undefined,
        page: page - 1,
        size: pageSize,
        performedBy: currentUser?.email,
      }),
    enabled: !!currentUser?.email,
  });

  const items: ApprovalItem[] = response?.data?.content ?? [];
  const totalElements: number = response?.data?.totalElements ?? 0;
  const totalPages: number = response?.data?.totalPages ?? 0;
  const from = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalElements);

  return (
    <div className="space-y-4 mt-0">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search ref or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-64 mrpsl-input"
        />
        <Select
          value={moduleFilter}
          onValueChange={(v) => {
            setModuleFilter(!v || v === "All" ? "All" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48 mrpsl-input">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Modules</SelectItem>
            <SelectItem value="SETUP">Setup</SelectItem>
            <SelectItem value="DIVIDENDS">Dividends</SelectItem>
            <SelectItem value="CERTIFICATES">Certificates</SelectItem>
            <SelectItem value="ACCOUNT_MAINTENANCE">
              Account Maintenance
            </SelectItem>
          </SelectContent>
        </Select>
        <Badge
          variant="outline"
          className="ml-auto text-[13px] text-muted-foreground"
        >
          View only — all pending items across all roles
        </Badge>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="mrpsl-table-header">
            <tr>
              <th className="p-3">REFERENCE</th>
              <th className="p-3">MODULE</th>
              <th className="p-3">TYPE</th>
              <th className="p-3">DESCRIPTION</th>
              <th className="p-3">AMOUNT</th>
              <th className="p-3">TIER</th>
              <th className="p-3">SUBMITTED BY</th>
              <th className="p-3">AWAITING ROLE</th>
              <th className="p-3">AGING</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y text-[13px]">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : items.map((a) => {
                  const agingPct = Math.min(
                    ((a.agingHours ?? 0) / 4) * 100,
                    100,
                  );
                  const agingText =
                    (a.agingHours ?? 0) < 1
                      ? "Just now"
                      : `${Math.floor(a.agingHours ?? 0)}h ago`;
                  return (
                    <tr key={a.id} className="hover:bg-accent/5">
                      <td className="p-3 font-mono text-[13px] text-muted-foreground">
                        {a.id}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-gray-100 text-gray-800 border-0 text-[13px]">
                          {a.module
                            .toLowerCase()
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-sm">
                        {a.transactionType}
                      </td>
                      <td
                        className="p-3 truncate max-w-50"
                        title={a.description}
                      >
                        {a.description}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        {a.amount ? `₦${a.amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="p-3">
                        {a.tier ? (
                          <Badge
                            className={`border-0 text-[13px] ${
                              a.tier === 1
                                ? "bg-green-100 text-green-800"
                                : a.tier === 2
                                  ? "bg-blue-100 text-blue-800"
                                  : a.tier === 3
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            T{a.tier}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        {a.initiatorName ? (
                          <div className="flex items-center gap-2">
                            {a.initiatorName && (
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[13px] font-bold text-primary">
                                  {getInitials(a.initiatorName)}
                                </span>
                              </div>
                            )}
                            <span>{a.initiatorName}</span>
                          </div>
                        ) : (
                          <p className="text-center">-</p>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className="text-[12px] font-medium text-muted-foreground"
                        >
                          {a.currentApproverRole?.replace(/_/g, " ") ?? "—"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 w-24">
                          <Progress value={agingPct} className="h-1.5" />
                          <span
                            className={`text-[13px] whitespace-nowrap ${
                              a.overdue
                                ? "text-red-600 font-bold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {agingText}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReview(a, true)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center">
                  <p className="text-muted-foreground text-sm">
                    No records found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <TablePagination
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        from={from}
        to={to}
        total={totalElements}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />
    </div>
  );
}
