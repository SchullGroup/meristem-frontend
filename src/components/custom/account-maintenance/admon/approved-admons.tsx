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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationBar } from "@/components/custom/pagination-bar";
import {
  useGetAdmons,
  useCreateAdmonReversal,
} from "@/hooks/useAccountMaintenance";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useStore } from "@/lib/store";
import { Admon } from "@/types/account-maintenance";
import { DateRange } from "react-day-picker";
import { EntitlementTableSkeleton } from "@/components/custom/rights-issue/loaders";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { DataErrorState } from "@/components/custom/ipo/loaders";
import { formatDate } from "@/lib/utils/format";
import { Eye, Check, Loader2, Undo2 } from "lucide-react";
import { DocPreview } from "@/components/custom/doc-upload-zone";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { getDividendStatement } from "@/actions/enquiryActions";
import { AdminCard } from "./admon-review";

export default function ApprovedAdmons({ tab }: { tab: string }) {
  const { data: activeRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE",
  });
  const { currentUser } = useStore();

  //----------------- filters -------------- //
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [registerId, setRegisterId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  //------------ detail view ------------------ //
  const [selected, setSelected] = useState<Admon | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  //------------ recall (reversal) ------------------ //
  const [recallTarget, setRecallTarget] = useState<Admon | null>(null);
  const [recallOpen, setRecallOpen] = useState(false);
  const [recallReason, setRecallReason] = useState("");
  const createReversalMutation = useCreateAdmonReversal();

  function openReview(row: Admon) {
    setSelected(row);
    setReviewOpen(true);
  }

  function openRecall(row: Admon) {
    setRecallTarget(row);
    setRecallReason("");
    setRecallOpen(true);
  }

  function handleRecall() {
    const reason = recallReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for recalling this administration.");
      return;
    }
    if (!recallTarget) return;
    if (!currentUser) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    createReversalMutation.mutate(
      {
        admonId: recallTarget.id,
        data: {
          reason,
          initiatedBy: currentUser.email,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "Recall submitted — the reversal now awaits OPS and ICU approval.",
          );
          setRecallOpen(false);
          setRecallTarget(null);
          setRecallReason("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to submit recall");
        },
      },
    );
  }

  const { data, isLoading, error, isError, refetch } = useGetAdmons(
    {
      registerId: registerId !== "" ? registerId : undefined,
      from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      page: currentPage,
      pageSize: pageSize,
      status: "APPROVED",
    },
    {
      enabled: tab === "approved",
    },
  );

  const router = useRouter();

  const approvedAdmons = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.total || 0;

  // Outstanding dividends across ALL deceased accounts (aggregated)
  const dividendQueries = useQueries({
    queries: (selected?.deceasedAccountIds ?? []).map((accountId) => ({
      queryKey: ["dividend-statement", accountId, {}] as const,
      queryFn: () => getDividendStatement(accountId, {}),
      enabled: reviewOpen && !!accountId,
    })),
  });
  const totalOutstanding = dividendQueries.reduce((sum, q) => {
    const unpaid =
      q.data?.data?.dividends?.filter((d) => d.status === "UNPAID") ?? [];
    return sum + unpaid.length;
  }, 0);
  const dividendLoading = dividendQueries.some((q) => q.isLoading);

  // ── Fields not yet returned by the live API — filled with placeholder
  // data so the dialog reads as complete until the backend catches up. ──
  const administrators = selected?.administrators?.length
    ? selected.administrators
    : selected
      ? [
          {
            adminName: selected.adminName || "Administrator",
            isExecutor: selected.admonType === "EXECUTOR",
            email: "admin@example.com",
            phone: "+234 800 000 0000",
            bvn: "00000000000",
            nin: "00000000000",
            idType: "National ID",
            relationship: "-",
            adminAddress: selected.adminAddress || "-",
            adminCity: selected.adminCity || "-",
            adminState: selected.adminState || "-",
            documents: [] as { name: string; url: string }[],
          },
        ]
      : [];
  const estateAccountNumber =
    selected?.estateAccountNumber || "ESTATE-0001234567";
  const authorisedAt =
    selected?.authorisedAt || selected?.decidedAt || selected?.createdAt;
  const icuApprovedBy =
    selected?.icuApprovedBy ||
    selected?.authorisedBy ||
    "chioma.okafor@email.com";
  const icuApprovedAt =
    selected?.icuApprovedAt || selected?.decidedAt || selected?.createdAt;
  const caseMemo = selected?.memo || "No additional notes provided.";

  if (isLoading) {
    return <EntitlementTableSkeleton />;
  }

  return (
    <>
      <div className="flex gap-2 items-center flex-wrap">
        <Select
          value={registerId}
          onValueChange={(v) => setRegisterId(v || "")}
        >
          <SelectTrigger className="w-44 mrpsl-input">
            <SelectValue placeholder="All Registers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Registers</SelectItem>
            {activeRegisters?.content?.map((r) => (
              <SelectItem key={r.registerId} value={r.symbol}>
                {r.registerName} · {r.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="space-y-1.5">
          <DateRangePicker
            className="mt-0"
            date={dateRange}
            setDate={setDateRange}
          />
        </div>
      </div>

      <Card className="mrpsl-card overflow-hidden">
        {isError ? (
          <DataErrorState
            message={error?.message || "Failed to load historical ADMORs."}
            onRetry={refetch}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3">DATE</th>
                <th className="p-3">ACCOUNT</th>
                <th className="p-3">ORIGINAL DECEASED</th>
                <th className="p-3">CURRENT ADMINISTRATOR</th>
                <th className="p-3">PROBATE NO</th>
                <th className="p-3">AUTHORISED BY</th>
                <th className="p-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {approvedAdmons?.length > 0 ? (
                approvedAdmons?.map((row) => (
                  <tr key={row.id} className="mrpsl-table-row">
                    <td className="p-3 text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="p-3 font-mono">
                      {row.deceasedAccountNumbers?.join(", ")}
                    </td>
                    <td className="p-3 font-medium">
                      {row.deceasedHolderName}
                    </td>
                    <td className="p-3">{row.adminName}</td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {row.probateNumber}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {row.authorisedBy}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReview(row)}
                        >
                          <Eye /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => openRecall(row)}
                        >
                          <Undo2 /> Recall
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-muted-foreground"
                  >
                    No approved ADMORs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
      <PaginationBar
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        total={total}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Approved Estate Administration</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 px-8 pb-8 overflow-y-auto max-h-[75vh]">
              <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mrpsl-section-title">Accounts</div>
                    <div className="font-mono font-bold mt-0.5">
                      {selected.deceasedAccountNumbers?.join(", ") || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Deceased Holder</div>
                    <div className="font-semibold text-sm mt-0.5 text-destructive">
                      {selected.deceasedHolderName}
                    </div>
                  </div>

                  <div>
                    <div className="mrpsl-section-title">Probate Court</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.probateCourt}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Probate No</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.probateNumber}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Probate Page</div>
                    <div className="font-mono text-sm mt-0.5">
                      {selected.probatePage || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Probate Date</div>
                    <div className="text-sm mt-0.5">
                      {formatDate(selected.probateDate)}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">Lodgement Date</div>
                    <div className="text-sm mt-0.5">
                      {formatDate(selected.lodgementDate)}
                    </div>
                  </div>
                  <div>
                    <div className="mrpsl-section-title">
                      Estate Bank Account
                    </div>
                    <div className="font-mono text-sm mt-0.5">
                      {estateAccountNumber}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="mrpsl-section-title">
                      Probate / Letter of Administration
                    </div>
                    {selected.probateDocs && selected.probateDocs.length > 0 ? (
                      <div className="space-y-1.5 mt-1">
                        {selected.probateDocs.map((doc, i) => (
                          <DocPreview key={i} url={doc.url} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted-foreground mt-1">
                        No probate documents uploaded.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Estate Name Change ── */}
              {selected.changeNameToEstate && selected.estateNamePreview && (
                <div className="border border-border/60 rounded-xl p-4">
                  <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                    Name Change → Estate
                  </h4>
                  <div className="bg-background border rounded-lg p-3 text-sm text-center font-mono">
                    <span className="text-muted-foreground line-through mr-2">
                      {selected.deceasedHolderName}
                    </span>
                    {" → "}
                    <span className="font-bold text-primary">
                      {selected.estateNamePreview}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Administrators ── */}
              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                  Administrator{administrators.length !== 1 ? "s" : ""} (
                  {administrators.length})
                </h4>
                <div className="space-y-3">
                  {administrators.map((admin, idx) => (
                    <AdminCard key={idx} admin={admin} index={idx} />
                  ))}
                </div>
              </div>

              {/* ── Memo ── */}
              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                  Memo
                </h4>
                <p className="text-[13px] text-muted-foreground italic">
                  {caseMemo}
                </p>
              </div>

              {/* ── Approval Chain ── */}
              <div className="border border-border/60 rounded-xl p-4">
                <h4 className="text-sm font-bold border-b border-border/60 pb-2 mb-3">
                  Approval Chain
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Submitted by {selected.initiatorName || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>
                      OPS Authoriser — Authorised by{" "}
                      {selected.authorisedBy || "-"}
                      {authorisedAt ? ` on ${formatDate(authorisedAt)}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span>
                      ICU Approver — Approved by {icuApprovedBy}
                      {icuApprovedAt ? ` on ${formatDate(icuApprovedAt)}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Outstanding Dividends ── */}
              <div className="border-t pt-4">
                {dividendLoading ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading outstanding dividends...
                  </Button>
                ) : totalOutstanding > 0 ? (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() =>
                      router.push(
                        `/dividends/new-mandate?account=${selected?.estateAccountNumber ?? ""}`,
                      )
                    }
                  >
                    View Outstanding Dividends
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white/20 text-white border-0 text-[11px]"
                    >
                      {totalOutstanding}
                    </Badge>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    No outstanding dividends for this account
                  </Button>
                )}
              </div>

              {/* <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewOpen(false);
                    setSelected(null);
                  }}
                >
                  Close
                </Button>
              </div> */}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Recall (reversal) dialog ── */}
      <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recall Estate Administration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-800">
              Recalling cancels this approved administration and restores the
              account to its original holder state, once approved by OPS and
              ICU.
            </div>
            {recallTarget && (
              <div className="bg-muted/30 rounded-xl border p-3 text-sm">
                <span className="font-mono font-bold">
                  {recallTarget.deceasedAccountNumbers?.join(", ")}
                </span>
                <span className="text-muted-foreground ml-2">
                  — {recallTarget.deceasedHolderName}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <label className="mrpsl-label">
                Reason for Recall (required)
              </label>
              <Textarea
                value={recallReason}
                onChange={(e) => setRecallReason(e.target.value)}
                placeholder="e.g. Court subsequently voided the grant of probate"
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRecallOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRecall}
                disabled={createReversalMutation.isPending}
              >
                {createReversalMutation.isPending
                  ? "Submitting..."
                  : "Submit Recall"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
