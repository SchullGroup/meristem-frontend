"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useGetRegisters } from "@/hooks/useRegisters";
import {
  useGetUnpaidWarrantMarkoff,
  useSubmitBulkWarrantMarkoff,
} from "@/hooks/useWarrantMarkoff";
import { WarrantMarkOffParams } from "@/actions/warrantMarkoffActions";
import { TablePagination } from "@/components/custom/table-pagination";
import { DataErrorState } from "../ipo/loaders";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { EnBlocConfirmDialog } from "./dialogs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DateInput from "@/components/ui/date-input";
import { format } from "date-fns";

export default function EnBlocMarkoff() {
  const { currentUser, registers: storeRegisters } = useStore();

  // Active registers from API
  const { data: activeRegisters, isLoading: loadingRegisters } =
    useGetRegisters({ status: "ACTIVE", size: 100 });

  const [registerId, setRegisterId] = useState("");
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Active filter settings used for the loaded query
  const [loadedFilters, setLoadedFilters] = useState<{
    registerId: string;
    dateFrom: string;
    dateTo: string;
  } | null>(null);

  const [queryParams, setQueryParams] = useState<WarrantMarkOffParams | null>(
    null,
  );

  // Unpaid warrants query
  const {
    data: response,
    isLoading: isLoadingUnpaid,
    isError: isErrorUnpaid,
    error: unpaidError,
    refetch: refetchUnpaid,
  } = useGetUnpaidWarrantMarkoff(queryParams!, { enabled: !!queryParams });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submitBulkMutation = useSubmitBulkWarrantMarkoff();

  const handleLoad = () => {
    if (!registerId) {
      toast.error("Please select a register.");
      return;
    }
    if (!dateFrom || !dateTo) {
      toast.error("Please enter a valid date range.");
      return;
    }

    const filters = {
      registerId,
      dateFrom: format(dateFrom, "yyyy-MM-dd"),
      dateTo: format(dateTo, "yyyy-MM-dd"),
    };
    setLoadedFilters(filters);
    setPage(1);
    setSelectedIds(new Set());
    setQueryParams({
      registerId,
      dateFrom: format(dateFrom, "yyyy-MM-dd"),
      dateTo: format(dateTo, "yyyy-MM-dd"),
      page: 0,
      size: pageSize,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (!loadedFilters) return;
    setPage(newPage);
    setQueryParams({
      ...loadedFilters,
      page: newPage - 1,
      size: pageSize,
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    if (!loadedFilters) return;
    setPageSize(newSize);
    setPage(1);
    setQueryParams({
      ...loadedFilters,
      page: 0,
      size: newSize,
    });
  };

  const warrants = response?.data?.content || [];
  const totalElements = response?.data?.totalElements || 0;
  const totalPages = response?.data?.totalPages || 0;

  const allChecked =
    warrants.length > 0 && warrants.every((w) => selectedIds.has(w.id));

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        warrants.forEach((w) => next.delete(w.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        warrants.forEach((w) => next.add(w.id));
        return next;
      });
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Find selection total using loaded warrants across selection
  // Note: we can map the selected warrants to sum their net amount
  const selectedWarrants = warrants.filter((w) => selectedIds.has(w.id));
  const selectionTotal = selectedWarrants.reduce((s, w) => s + w.netAmount, 0);

  const handleSubmitClick = () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one warrant.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = (reason: string) => {
    submitBulkMutation.mutate(
      {
        warrantIds: Array.from(selectedIds).map((id) => id.toString()) as any,
        reason: reason.trim(),
        submittedBy:
          currentUser?.username ||
          `${currentUser?.firstName} ${currentUser?.lastName}` ||
          currentUser?.email ||
          "System",
      },
      {
        onSuccess: (res) => {
          if (res?.isSuccessful) {
            toast.success(
              `${selectedIds.size} warrant${
                selectedIds.size !== 1 ? "s" : ""
              } submitted for 1st level approval.`,
            );
            setSelectedIds(new Set());
            setConfirmOpen(false);
            refetchUnpaid();
          } else {
            toast.error(res?.responseMessage || "Failed to submit mark-off.");
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to submit mark-off.");
        },
      },
    );
  };

  // Get registers list from query fallback to store and map to unified format
  const registersList = (activeRegisters?.content || storeRegisters || []).map(
    (r: any) => ({
      id: String(r.registerId || r.id),
      symbol: r.symbol,
      status: r.status,
    }),
  );

  return (
    <div className="space-y-4">
      <Card className="mrpsl-card p-4">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          <div className="space-y-1.5">
            <label className="mrpsl-label">Register</label>
            <Select
              value={registerId}
              onValueChange={(v) => setRegisterId(v || "")}
            >
              <SelectTrigger className="mrpsl-input">
                <SelectValue placeholder="Select register" />
              </SelectTrigger>
              <SelectContent>
                {loadingRegisters && (
                  <SelectItem disabled value="loading">
                    Loading...
                  </SelectItem>
                )}
                {registersList
                  .filter((r) => r.status === "ACTIVE")
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.symbol}
                    </SelectItem>
                  ))}
                {registersList.filter((r) => r.status === "ACTIVE").length ===
                  0 && <SelectItem value="DANGCEM">DANGCEM</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <DateInput
              label="From"
              date={dateFrom}
              setDate={(value) => setDateFrom(value)}
            />
          </div>
          <div className="space-y-1.5">
            <DateInput
              label="To"
              date={dateTo}
              setDate={(value) => setDateTo(value)}
            />
          </div>
          <Button onClick={handleLoad} disabled={isLoadingUnpaid}>
            {isLoadingUnpaid && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Load Unpaid Warrants
          </Button>
        </div>
      </Card>

      {isLoadingUnpaid && <EntitlementTableSkeleton />}

      {isErrorUnpaid && (
        <DataErrorState
          message={unpaidError?.message || "Failed to load unpaid warrants."}
          onRetry={refetchUnpaid}
        />
      )}

      {queryParams &&
        !isLoadingUnpaid &&
        !isErrorUnpaid &&
        warrants.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-xl text-muted-foreground">
            No unpaid warrants found for the selected register and date range.
          </div>
        )}

      {queryParams &&
        !isLoadingUnpaid &&
        !isErrorUnpaid &&
        warrants.length > 0 && (
          <div className="space-y-4">
            <Card className="mrpsl-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="p-3">WARRANT NO</th>
                    <th className="p-3">ACCOUNT</th>
                    <th className="p-3">HOLDER</th>
                    <th className="p-3">DIVIDEND</th>
                    <th className="p-3">AMOUNT (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                  {warrants.map((w) => (
                    <tr
                      key={w.id}
                      className={`mrpsl-table-row ${
                        selectedIds.has(w.id) ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(w.id)}
                          onChange={() => toggleRow(w.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono">{w.warrantNumber}</td>
                      <td className="p-3 font-mono">{w.accountNumber}</td>
                      <td className="p-3 font-medium">{w.holderName}</td>
                      <td className="p-3 text-muted-foreground">
                        {w.registerSymbol || w.paymentNumber || "N/A"}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {w.netAmount.toLocaleString()}.00
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <TablePagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              from={(page - 1) * pageSize + 1}
              to={Math.min(page * pageSize, totalElements)}
              total={totalElements}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />

            {selectedIds.size > 0 && (
              <div className="sticky bottom-0 bg-background border border-border/60 rounded-b-xl px-4 py-3 flex items-center justify-between shadow-md">
                <span className="text-sm font-medium">
                  {selectedIds.size} warrant{selectedIds.size !== 1 ? "s" : ""}{" "}
                  selected — Total:{" "}
                  <span className="font-mono font-bold text-primary">
                    ₦{selectionTotal.toLocaleString()}.00
                  </span>
                </span>
                <Button onClick={handleSubmitClick}>
                  Submit Selected for Mark-Off
                </Button>
              </div>
            )}
          </div>
        )}

      <EnBlocConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        selectedCount={selectedIds.size}
        selectionTotal={selectionTotal}
        onConfirm={handleConfirmSubmit}
        isConfirming={submitBulkMutation.isPending}
      />
    </div>
  );
}
