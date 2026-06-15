"use client";

import { useStore } from "@/lib/store";
import {
  Building2,
  BookOpen,
  ClipboardCheck,
  Coins,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGetPrincipalStats } from "@/hooks/usePrincipal"
import { formatNaira } from "@/lib/utils/format";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetDividendDeclarations } from "@/hooks/useDividendPayment";
import { EntitlementTableSkeleton } from "@/components/custom/rights-issue/loaders";
import { DataErrorState } from "@/components/custom/ipo/loaders";


const getDivStatusBadge = (status: string) => {
  switch (status) {
    case "DRAFT":
      return (
        <Badge className="bg-gray-100      text-gray-600   border-0 text-[13px]">
          Draft
        </Badge>
      );
    case "PENDING_TIER2":
      return (
        <Badge className="bg-amber-100     text-amber-800  border-0 text-[13px]">
          Pending Tier 2
        </Badge>
      );
    case "PENDING_TIER3":
      return (
        <Badge className="bg-orange-100    text-orange-800 border-0 text-[13px]">
          Pending Tier 3
        </Badge>
      );
    case "PENDING_TIER4":
      return (
        <Badge className="bg-yellow-100    text-yellow-800 border-0 text-[13px]">
          Pending Tier 4
        </Badge>
      );
    case "AUTHORIZED":
      return (
        <Badge className="bg-blue-100      text-blue-800   border-0 text-[13px]">
          Authorized
        </Badge>
      );
    case "PAID":
      return (
        <Badge className="bg-green-100     text-green-800  border-0 text-[13px]">
          Paid
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-red-100       text-red-700    border-0 text-[13px]">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100      text-gray-700   border-0 text-[13px]">
          {status}
        </Badge>
      );
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
          Active
        </Badge>
      );
    case "TRANSACTION_DISABLED":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
          Disabled
        </Badge>
      );
    case "INACTIVE":
      return (
        <Badge className="bg-gray-100 text-gray-600 border-0 text-[13px]">
          Inactive
        </Badge>
      );
    default:
      return <Badge className="text-[13px]">{status}</Badge>;
  }
};

export default function DashboardHome() {
  const {
    currentUser,
    pendingApprovals,
  } = useStore();
  const router = useRouter();

  const { data: principalStats, isLoading: principalStatsLoading } = useGetPrincipalStats();

  const { data: registers, isLoading: activeRegistersLoading } = useGetRegisters({
    status: "ACTIVE",
    size: 5,
    sortBy: "asc"
  });

  const { data: dividendDeclarations, isLoading: declarationsLoading, isError: declarationError, refetch: refetchDecl, error: declarationErrorMsg } = useGetDividendDeclarations({
    size: 5,
    status: "AUTHORIZED"
  })



  const totalPrincipals = principalStats?.totalPrincipals || 0;
  const activeRegisters = registers?.pagination?.total || 0;

  const pendingCount = pendingApprovals.filter(
    (a) => a.status === "PENDING",
  ).length;


  const topPending = [...pendingApprovals]
    .filter((a) => a.status === "PENDING")
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )
    .slice(0, 5);


  if (!currentUser) return null;


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Good morning, {currentUser?.firstName ?? currentUser?.username}.
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentUser?.roles?.[0]?.replace(/_/g, " ") ??
            (currentUser?.roles && currentUser?.roles[0]?.replace(/_/g, " ")) ??
            "User"}{" "}
          Dashboard
        </p>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="mrpsl-section-title">Total Principals</span>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            {principalStatsLoading ? (
              <span className="h-12 w-12 animate-pulse bg-muted rounded-sm  tabular-nums">
              </span>
            ) : <span className="text-3xl font-bold tabular-nums">
              {totalPrincipals}
            </span>}
            <div className="text-[13px] text-green-600 mt-1 font-medium">
              +1 this month
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="mrpsl-section-title">Active Registers</span>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            {activeRegistersLoading ? (
              <span className="h-12 w-12 animate-pulse bg-muted rounded-sm  tabular-nums">
              </span>
            ) : <span className="text-3xl font-bold tabular-nums">
              {activeRegisters}
            </span>}
            <div className="text-[13px] text-muted-foreground mt-1">
              Across all principals
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="mrpsl-section-title">Pending Approvals</span>
            <ClipboardCheck
              className={`h-4 w-4 ${pendingCount > 0 ? "text-destructive" : "text-muted-foreground"}`}
            />
          </div>
          <div className="mt-2">
            <span
              className={`text-3xl font-bold tabular-nums ${pendingCount > 0 ? "text-destructive" : ""}`}
            >
              {pendingCount}
            </span>
            <div className="text-[13px] text-muted-foreground mt-1">
              Items awaiting action
            </div>
          </div>
        </Card>

        <Card className="mrpsl-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="mrpsl-section-title">Declared Dividends YTD</span>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold tabular-nums">
              {dividendDeclarations?.data?.totalElements || 0}
            </span>
            <div className="text-[13px] text-muted-foreground mt-1">
              Authorized payouts
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Two Columns */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Dividend Declarations
          </h2>
          <Card className="mrpsl-card overflow-hidden">
            {declarationsLoading ? <EntitlementTableSkeleton /> : declarationError ? (<DataErrorState message={declarationErrorMsg?.message || "Failed to fetch dividend declarations"} onRetry={refetchDecl} />) :
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">Register</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Gross Liability</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividendDeclarations?.data?.content?.length && dividendDeclarations?.data?.content?.length > 0 ? (
                      dividendDeclarations.data?.content?.map((div) => (
                        <tr key={div.id} className="mrpsl-table-row">
                          <td className="px-4 py-3 font-medium">
                            {div.registerSymbol}
                          </td>
                          <td className="px-4 py-3">{div.dividendType}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            ₦{div.rate.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatNaira(div.grossLiability)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[13px]">
                              Tier {div.tier}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {getDivStatusBadge(div.status)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[13px]"
                              onClick={() =>
                                router.push("/dividends/declaration")
                              }
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground text-sm"
                        >
                          No recent declarations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>}
          </Card>
        </div>

        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Pending Approvals Queue
          </h2>
          <Card className="mrpsl-card">
            {topPending.length > 0 ? (
              <div className="divide-y divide-border">
                {topPending.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col gap-2 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium line-clamp-1 flex-1 pr-4">
                        {item.description}
                      </span>
                      {item.tier && (
                        <Badge
                          variant="outline"
                          className="text-[13px] shrink-0"
                        >
                          T{item.tier}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] text-muted-foreground">
                        3h ago
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[13px]"
                        onClick={() => router.push("/approvals")}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <CheckCircle className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                <span className="text-sm text-muted-foreground">
                  No pending approvals
                </span>
              </div>
            )}
            {topPending.length > 0 && (
              <div className="p-2 border-t bg-muted/20">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[13px] text-muted-foreground"
                  onClick={() => router.push("/approvals")}
                >
                  View all {pendingCount} pending items
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Row 3: Register Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Active Register Overview
        </h2>
        <Card className="mrpsl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-4 py-3">Register</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Shareholders</th>
                  <th className="px-4 py-3">Stock in Issue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registers?.content?.map((reg) => (
                  <tr key={reg.registerId} className="mrpsl-table-row">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{reg.symbol}</div>
                      <div className="text-[13px] text-muted-foreground truncate max-w-[200px]">
                        {reg.registerName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {reg.registerType}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[13px]">
                        {reg.registerType.replace(/\b\w/g, (c) =>
                          c.toUpperCase(),
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {reg.currentShareholdersSize?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {reg.currentStockInIssue?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(reg.status)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[13px]"
                        onClick={() =>
                          router.push(
                            `/setup/registers?search=${reg.symbol}`,
                          )
                        }
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
