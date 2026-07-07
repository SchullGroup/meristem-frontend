"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, CheckCheck, HelpCircle, Loader2, Plus, X } from "lucide-react";
import { useGetReconciliations } from "@/hooks/useCscs";
import { formatDate, formatNumber } from "@/lib/utils/format";
import { CscsReconciliationRecord, ReconciliationFlaggedTransaction } from "@/types/cscs";
import { PaginationBar } from "../pagination-bar";
import DiscrepancyResolutionForm from "./discrepancy-resolution";
import { CREATE_CSCS_TRANSACTION } from "@/actions/cscsActions";
import { useStore } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";


export interface ReconciliationReviewProps {
  selectedTransaction: ReconciliationFlaggedTransaction;
  open: boolean;
  setOpen: (open: boolean) => void;

}

export const ReconciliationView = ({ selectedTransaction, open, setOpen }: ReconciliationReviewProps) => {
  const currentUser = useStore((s) => s.currentUser);
  const queryClient = useQueryClient();
  const [mrpslPage, setMrpslPage] = useState(0);
  const [cscsPage, setCscsPage] = useState(0);
  const [mrpslPageSize, setMrpslPageSize] = useState(20);
  const [cscsPageSize, setCscsPageSize] = useState(20);

  // Add state for missing list pagination
  const [missingPage, setMissingPage] = useState(1);
  const [missingPageSize, setMissingPageSize] = useState(5); // default 5 items per page

  // batch-insert state
  const [isBatchInserting, setIsBatchInserting] = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);

  // open discrepancy modal
  const [selectedMissing, setSelectedMissing] = useState<CscsReconciliationRecord | null>(null)
  const [insertModalOpen, setInsertModalOpen] = useState(false)

  const handleOpenRowInsert = (item: CscsReconciliationRecord) => {
    setSelectedMissing(item);
    setInsertModalOpen(true);
  };

  const handleOpenEmptyInsert = () => {
    setSelectedMissing(null);
    setInsertModalOpen(true);
  };

  const handleCloseModal = () => {
    setInsertModalOpen(false);
    setSelectedMissing(null);
  };

  /**
   * Batch-insert all missing transactions in parallel.
   * Uses Promise.all so that if ANY request fails the entire
   * operation is treated as rolled back — no partial inserts are
   * silently accepted.
   */
  const handleInsertAllMissing = async () => {
    if (!currentUser) {
      toast.error("Your session has expired. Please log in to continue.");
      return;
    }
    if (!missingDataList.length) return;

    setIsBatchInserting(true);
    setBatchConfirmOpen(false);

    const payloads = missingDataList.map((item) => ({
      chn: selectedTransaction.chn,
      register: selectedTransaction.register,
      units: item.units,
      transactionDate: format(new Date(item.transactionDate), "yyyy-MM-dd"),
      transferNo: item.transferNo ?? "",
      type: item.type,
      transStatus: "PENDING" as const,
      processedBy: currentUser.email,
    }));

    try {
      await Promise.all(payloads.map((payload) => CREATE_CSCS_TRANSACTION(payload)));

      // Invalidate relevant queries so the UI reflects the inserts
      queryClient.invalidateQueries({ queryKey: ["reconciliation-flagged-transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["reconciliations"], exact: false });

      toast.success(
        `Successfully inserted ${missingDataList.length} missing transaction${missingDataList.length !== 1 ? "s" : ""}.`
      );
    } catch (err: any) {
      // Any failure means we surface the error; Promise.all already
      // rejected on the first failure so no further requests ran.
      toast.error(
        err?.message ||
        "One or more inserts failed. No changes were saved — please try again."
      );
    } finally {
      setIsBatchInserting(false);
    }
  };

  // FETCH SIDE-BY-SIDE LEDGERS 
  const { data: reconData, isFetching: isLoadingLedger } = useGetReconciliations({
    register: selectedTransaction?.register || "",
    chn: selectedTransaction?.chn || "",
    mrpslPage,
    mrpslPageSize,
    cscsPage,
    cscsPageSize,
  }, {
    enabled: open && !!selectedTransaction?.chn && !!selectedTransaction?.register,
    refetchOnWindowFocus: false,
  });

  // Extract raw payload content arrays
  // mrpsl table
  const mrpslRawList = reconData?.mrpsl?.content || [];
  const mrpslTotal = reconData?.mrpsl?.totalElements || 0
  const mrpslPageCount = reconData?.mrpsl?.totalPages || 1

  // cscs table
  const cscsRawList = reconData?.cscs?.content || [];
  const cscsTotal = reconData?.cscs?.totalElements || 0
  const cscsPageCount = reconData?.cscs?.totalPages || 1

  // missing data
  const missingDataList = reconData?.missingData || [];


  // Reset to page 1 whenever the missing data changes
  useEffect(() => {
    //eslint-disable-next-line
    setMissingPage(1);
  }, [missingDataList.length]);

  // Compute paginated slice
  const missingTotal = missingDataList.length || 0;
  const paginatedMissingList = missingDataList.slice(
    (missingPage - 1) * missingPageSize,
    missingPage * missingPageSize
  );

  const handleMissingPageSizeChange = (size: number) => {
    setMissingPageSize(size);
    setMissingPage(1); // reset to first page
  };

  return (
    <div className="space-y-5 animate-in fade-in-40 duration-200">

      {/* BACK TO AUDIT DESK BAR CONTROL */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
          }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pending List
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-base font-bold text-foreground tracking-tight">
          Resolution Desk: {selectedTransaction.holderName} ({selectedTransaction.chn})
        </h2>
      </div>

      {/* Informational Alert Flag Banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Missing purchase identified:</strong> {formatNumber(selectedTransaction?.shortfall)} units on {formatDate(selectedTransaction?.transactionDate)} not reflected in MRPSL register.
        </p>
      </div>

      {/* DISCREPANCY IDENTIFICATION BLOCK (Renders isolated missingData values) */}
      <Card className="border border-red-200 bg-red-50/20 overflow-hidden shadow-sm">
        <div className="px-4 py-2 bg-red-100/60 border-b border-red-200 text-xs font-bold uppercase tracking-wider text-red-800 flex items-center justify-between gap-1.5">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-red-600" />
            Missing Transactions ({missingDataList.length})
          </span>

          {/* Batch insert — two-step confirm to avoid accidental fires */}
          {missingDataList.length > 1 && (
            batchConfirmOpen ? (
              <span className="flex items-center gap-1.5">
                <span className="text-[11px] font-normal text-red-700 normal-case">Insert all {missingDataList.length} transactions?</span>
                <Button
                  size="sm"
                  className="h-6 px-2 text-[11px] bg-red-600 hover:bg-red-700 text-white"
                  disabled={isBatchInserting}
                  onClick={handleInsertAllMissing}
                >
                  {isBatchInserting ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Inserting...</>
                  ) : (
                    <><CheckCheck className="h-3 w-3 mr-1" />Confirm</>)}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px] text-red-700 hover:bg-red-200"
                  disabled={isBatchInserting}
                  onClick={() => setBatchConfirmOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[11px] text-red-700 hover:bg-red-200 normal-case font-semibold"
                disabled={isBatchInserting}
                onClick={() => setBatchConfirmOpen(true)}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Insert All
              </Button>
            )
          )}
        </div>
        <div className="p-3 bg-background divide-y divide-border/40 text-xs">
          {isLoadingLedger ? (
            <div className="py-3 text-center text-muted-foreground animate-pulse">Running data comparisons...</div>
          ) : paginatedMissingList.length > 0 ? (
            paginatedMissingList.map((item, idx) => (
              <div key={item.id || idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">{formatDate(item.transactionDate)} &mdash; <span className="text-red-600 font-medium">{item.type}</span></span>
                  <span className="text-muted-foreground text-[11px]">Transaction No: {item.transferNo || "---"}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-red-600 text-sm">{formatNumber(item.units)}</span>
                  <p className="text-[10px] text-muted-foreground">Status: {item.transStatus || "UNRESOLVED"}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRowInsert(item)}
                  >
                    Insert Missing
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground italic flex items-center justify-center gap-2">
              No missing transactions found for this account              </div>
          )}
        </div>

        {missingTotal > 0 && <PaginationBar
          page={missingPage}
          total={missingTotal}
          pageSize={missingPageSize}
          onPageChange={setMissingPage}
          onPageSizeChange={handleMissingPageSizeChange}
          pageBase={1}
        />}
      </Card>

      {/* STACKED HISTORICAL LOG TRAIL SCHEMAS */}
      {isLoadingLedger ? (
        <div className="h-44 flex flex-col items-center justify-center border border-border/40 rounded-xl bg-muted/10 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Pulling ledger positions...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* STACKED VIEW 1: MRPSL RECORDS */}
          <Card className="overflow-hidden shadow-sm flex flex-col border border-border">
            <div className="px-4 py-2 bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              MRPSL Records ({mrpslTotal})
            </div>
            <div className="p-3 divide-y divide-border/40 text-xs bg-background">
              {mrpslRawList.map((pos) => (
                <div key={pos.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <p className="font-medium text-foreground">{formatDate(pos.transactionDate)} <span className={`${pos.type === "SELL" ? "text-red-600" : "text-green-600"}`}>({pos.type})</span></p>
                    <span className="text-[10px] text-muted-foreground">Transfer No: {pos.transferNo}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">{formatNumber(pos?.units)}</span>
                </div>
              ))}
              {mrpslRawList.length === 0 && (
                <div className="text-center py-6 text-muted-foreground italic">No tracked entries on this ledger segment index.</div>
              )}
            </div>

            {/* Pagination */}
            <PaginationBar
              page={mrpslPage}
              pageSize={mrpslPageSize}
              onPageSizeChange={setMrpslPageSize}
              totalPages={mrpslPageCount}
              total={mrpslTotal}
              onPageChange={(value) => setMrpslPage(value)}
            />
          </Card>

          {/* SIDE VIEW 2: CSCS RECORDS */}
          <Card className="overflow-hidden shadow-sm flex flex-col border border-border">
            <div className="px-4 py-2 bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              CSCS Records ({cscsTotal})
            </div>
            <div className="p-3 divide-y divide-border/40 text-xs bg-background">
              {cscsRawList.map((pos) => (
                <div key={pos.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <p className="font-medium text-foreground">{formatDate(pos.transactionDate)} <span className={`${pos.type === "SELL" ? "text-red-600" : "text-green-600"}`}>({pos.type})</span></p>
                    <span className="text-[10px] text-muted-foreground">Status: {pos.transStatus}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">{formatNumber(pos.units)}</span>
                </div>
              ))}
              {cscsRawList.length === 0 && (
                <div className="text-center py-6 text-muted-foreground italic">No matching clearing entries found on this page.</div>
              )}
            </div>

            {/* Pagination */}
            <PaginationBar
              page={cscsPage}
              pageSize={cscsPageSize}
              onPageSizeChange={setCscsPageSize}
              totalPages={cscsPageCount}
              total={cscsTotal}
              onPageChange={setCscsPage}
            />
          </Card>

        </div>
      )}

      {/* ADD MISSING TRANSACTIONS */}
      {missingDataList && missingDataList.length > 0 && <Button onClick={handleOpenEmptyInsert} className="gap-2 w-full">
        <Plus className="h-4 w-4" />
        Insert Missing Transaction
      </Button>}

      {/* DISCREPANCY RESOLUTION MODAL */}
      <DiscrepancyResolutionForm
        open={insertModalOpen}
        onClose={handleCloseModal}
        selectedTransaction={selectedTransaction as unknown as CscsReconciliationRecord}
        missingTransaction={selectedMissing}
      />
    </div>
  )
}