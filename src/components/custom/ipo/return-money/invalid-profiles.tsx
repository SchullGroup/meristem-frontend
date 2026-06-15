"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowRightLeft } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { toast } from "sonner";

// Mock data representing invalid subscription profiles (data issues requiring returns)
const MOCK_INVALID_PROFILES = [
  {
    id: "1",
    investorName: "Olatunde Martins Coker",
    accountNumber: "0055112233",
    unitsApplied: 30000,
    amountPaid: 750000,
    profileIssue: "Missing signature mandate card & signature upload",
    dateSubmitted: "2026-05-11",
    status: "PENDING_RETURN",
  },
  {
    id: "2",
    investorName: "Nneka Blessing Onyema",
    accountNumber: "0099887766",
    unitsApplied: 60000,
    amountPaid: 1500000,
    profileIssue: "Invalid corporate incorporation number / RC Number mismatch",
    dateSubmitted: "2026-05-16",
    status: "PENDING_RETURN",
  },
  {
    id: "3",
    investorName: "Tunde Kolawole Shittu",
    accountNumber: "0011223344",
    unitsApplied: 8000,
    amountPaid: 200000,
    profileIssue: "Incomplete KYC - Missing valid identity document (ID)",
    dateSubmitted: "2026-05-19",
    status: "REFUNDED",
  },
];

export function InvalidProfilesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [records, setRecords] = useState(MOCK_INVALID_PROFILES);

  const filteredRecords = records.filter(
    (r) =>
      r.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.accountNumber.includes(searchQuery) ||
      r.profileIssue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = filteredRecords
        .filter((r) => r.status === "PENDING_RETURN")
        .map((r) => r.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const triggerRefund = (ids: string[]) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Processing refund(s)...",
        success: () => {
          setRecords((prev) =>
            prev.map((r) => (ids.includes(r.id) ? { ...r, status: "REFUNDED" } : r))
          );
          setSelectedIds([]);
          return `Refund of ₦${formatNumber(
            records
              .filter((r) => ids.includes(r.id))
              .reduce((sum, item) => sum + item.amountPaid, 0)
          )} processed successfully.`;
        },
        error: "Refund execution failed.",
      }
    );
  };

  const selectedRefundAmount = records
    .filter((r) => selectedIds.includes(r.id))
    .reduce((sum, item) => sum + item.amountPaid, 0);

  return (
    <div className="space-y-4">
      {/* Action and Search Controls */}
      <div className="flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investor, account, issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 mrpsl-input"
          />
        </div>

        {selectedIds.length > 0 && (
          <Button
            className="gap-2 bg-red-600 hover:bg-red-700"
            onClick={() => triggerRefund(selectedIds)}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Refund Selected (₦{formatNumber(selectedRefundAmount)})
          </Button>
        )}
      </div>

      {/* Main Table */}
      <Card className="mrpsl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3 w-10">
                  <Checkbox
                    checked={
                      filteredRecords.length > 0 &&
                      filteredRecords
                        .filter((r) => r.status === "PENDING_RETURN")
                        .every((r) => selectedIds.includes(r.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-3">INVESTOR DETAILS</th>
                <th className="p-3">UNITS APPLIED</th>
                <th className="p-3">AMOUNT PAID (₦)</th>
                <th className="p-3">PROFILE COMPLIANCE ISSUE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-[13px]">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-accent/5">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        disabled={row.status === "REFUNDED"}
                        onCheckedChange={(checked) =>
                          handleSelectRow(row.id, !!checked)
                        }
                      />
                    </td>
                    <td className="p-3 font-sans font-medium">
                      <div>{row.investorName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        A/C: {row.accountNumber}
                      </div>
                    </td>
                    <td className="p-3 tabular-nums">
                      {formatNumber(row.unitsApplied)}
                    </td>
                    <td className="p-3 tabular-nums font-bold">
                      {formatNumber(row.amountPaid)}
                    </td>
                    <td className="p-3 font-sans text-red-600 text-[12px]">
                      {row.profileIssue}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`border-0 text-[11px] font-bold ${
                          row.status === "REFUNDED"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.status === "REFUNDED" ? "Refunded" : "Pending Return"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {row.status === "PENDING_RETURN" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => triggerRefund([row.id])}
                          className="h-7 text-xs"
                        >
                          Refund
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-sans">
                          No Action
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground font-sans"
                  >
                    No invalid profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
