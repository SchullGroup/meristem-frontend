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

// Mock data representing invalid accounts (bounced bank returns / verification errors)
const MOCK_INVALID_ACCOUNTS = [
  {
    id: "1",
    investorName: "Okey Samuel Kalu",
    bankName: "First Bank of Nigeria",
    invalidAccountNumber: "308273612", // 9 digits (invalid length)
    amountToReturn: 850000,
    errorType: "NUBAN Length Verification Failed",
    resolvedDate: null,
    status: "PENDING_RETURN",
  },
  {
    id: "2",
    investorName: "Amina Yusuf Gombe",
    bankName: "United Bank for Africa",
    invalidAccountNumber: "1029384756",
    amountToReturn: 2300000,
    errorType: "Account Name Mismatch (Name mismatch against NIP database)",
    resolvedDate: null,
    status: "PENDING_RETURN",
  },
  {
    id: "3",
    investorName: "Kenneth Enyinna Nwosu",
    bankName: "Fidelity Bank",
    invalidAccountNumber: "5081928374",
    amountToReturn: 540000,
    errorType: "Account Dormant or Closed",
    resolvedDate: "2026-06-01",
    status: "REFUNDED",
  },
];

export function InvalidAccountsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [records, setRecords] = useState(MOCK_INVALID_ACCOUNTS);

  const filteredRecords = records.filter(
    (r) =>
      r.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invalidAccountNumber.includes(searchQuery) ||
      r.errorType.toLowerCase().includes(searchQuery.toLowerCase())
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
              .reduce((sum, item) => sum + item.amountToReturn, 0)
          )} processed successfully.`;
        },
        error: "Refund execution failed.",
      }
    );
  };

  const selectedRefundAmount = records
    .filter((r) => selectedIds.includes(r.id))
    .reduce((sum, item) => sum + item.amountToReturn, 0);

  return (
    <div className="space-y-4">
      {/* Action and Search Controls */}
      <div className="flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search investor, account, error..."
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
                <th className="p-3">BANK NAME</th>
                <th className="p-3">ACCOUNT NUMBER</th>
                <th className="p-3">AMOUNT TO RETURN (₦)</th>
                <th className="p-3">VERIFICATION ISSUE</th>
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
                      {row.investorName}
                    </td>
                    <td className="p-3 font-sans text-muted-foreground">
                      {row.bankName}
                    </td>
                    <td className="p-3 font-bold text-red-600">
                      {row.invalidAccountNumber}
                    </td>
                    <td className="p-3 tabular-nums font-bold">
                      {formatNumber(row.amountToReturn)}
                    </td>
                    <td className="p-3 font-sans text-muted-foreground text-[12px]">
                      {row.errorType}
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
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground font-sans"
                  >
                    No invalid accounts found.
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
