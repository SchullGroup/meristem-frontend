"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Loader2, RotateCcw, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useRolePermission } from "@/hooks/usePermission";
import { PaginationBar } from "../pagination-bar";
import {
  useGetConsolidations,
  useReverseConsolidation,
} from "@/hooks/useAccountMaintenance";
import { DataErrorState } from "../ipo/loaders";
import { EntitlementTableSkeleton } from "../rights-issue/loaders";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useGetRegisters } from "@/hooks/useRegisters";
import { DateRangePicker } from "../date-range-picker";
import { formatDate } from "@/lib/utils/format";
import {
  Consolidation,
  ConsolidationAccount,
} from "@/types/account-maintenance";

export default function History({ tab }: { tab: string }) {
  const { currentUser } = useStore();
  const canApprove = useRolePermission(
    "account_maintenance.account_consolidation_approve.approve",
  );

  const { data: activeRegisters, isLoading: isLoadingRegisters } =
    useGetRegisters({ size: 100, status: "ACTIVE" });

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [register, setRegister] = useState("");
  const [status, setStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "REVERSED" | ""
  >("");
  const [reversalTarget, setReversalTarget] = useState<Consolidation | null>(
    null,
  );
  const [reversalReason, setReversalReason] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 500);

  const [selectedRecord, setSelectedRecord] = useState<Consolidation | null>(
    null,
  );

  const { data, isLoading, isError, error, refetch } = useGetConsolidations(
    {
      status: status !== "" ? status : undefined,
      page: currentPage,
      pageSize,
      from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      q: debouncedSearch !== "" ? debouncedSearch : undefined,
      registerId: register !== "" ? register : undefined,
    },
    { enabled: tab === "history" },
  );

  const reverseMutation = useReverseConsolidation();

  const filteredList = useMemo(() => {
    if (!data?.content) return [];
    const resolved = new Set([
      "APPROVED",
      "AUTHORISED",
      "REJECTED",
      "DECLINED",
      "REVERSED",
    ]);
    return data.content.filter((r) => resolved.has(r.status));
  }, [data]);

  function handleReverse() {
    if (!reversalTarget || !currentUser) return;
    reverseMutation.mutate(
      {
        id: reversalTarget.id,
        data: { comment: reversalReason, authorisedBy: currentUser.email },
      },
      {
        onSuccess: () => {
          toast.success("Consolidation reversed successfully");
          setReversalTarget(null);
          setReversalReason("");
          refetch();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reverse consolidation");
        },
      },
    );
  }

  const consolidations = filteredList;
  const totalPages = data?.pagination?.totalPages || 1;
  const total = data?.pagination?.total || 0;

  if (isLoading) return <EntitlementTableSkeleton />;

  return (
    <>
      {/* ── Filters ── */}
      <div className="flex gap-2 items-center flex-wrap mb-4 border p-5 rounded-xl">
        <div className="relative w-1/2">
          <Input
            placeholder="Search CHN or holder…"
            className="pl-9 mrpsl-input w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2">
          <Select value={register} onValueChange={(v) => setRegister(v || "")}>
            <SelectTrigger className="w-full mrpsl-input">
              <SelectValue placeholder="All Registers" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingRegisters ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  <SelectItem value="">All Registers</SelectItem>
                  {activeRegisters?.content?.map((r) => (
                    <SelectItem key={r.registerId} value={r.symbol}>
                      {r.registerName} · {r.symbol}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v || "")}>
            <SelectTrigger className="w-full mrpsl-input">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="REVERSED">Reversed</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-full">
            <DateRangePicker
              className="mt-0"
              date={dateRange}
              setDate={setDateRange}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="mrpsl-card overflow-hidden">
        {isError ? (
          <DataErrorState
            message={error?.message || "Failed to load consolidations."}
            onRetry={refetch}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="p-3 whitespace-nowrap">DATE</th>
                  <th className="p-3 whitespace-nowrap">REGISTER</th>
                  <th className="p-3 whitespace-nowrap">SOURCE ACCOUNTS</th>
                  <th className="p-3 whitespace-nowrap">DESTINATION</th>
                  <th className="p-3 text-right whitespace-nowrap">
                    TOTAL HOLDINGS
                  </th>
                  <th className="p-3 whitespace-nowrap">SUBMITTED BY</th>
                  <th className="p-3 whitespace-nowrap">REASON</th>
                  <th className="p-3 text-center whitespace-nowrap">STATUS</th>
                  <th className="p-3 whitespace-nowrap">AUTHORISED BY</th>
                  {canApprove && (
                    <th className="p-3 whitespace-nowrap text-center">
                      ACTIONS
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y text-[13px]">
                {consolidations.length > 0 ? (
                  consolidations.map((row) => (
                    <tr
                      key={row.id}
                      className="mrpsl-table-row cursor-pointer"
                      onClick={() => setSelectedRecord(row)}
                    >
                      {/* Date */}
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {row.createdAt ? formatDate(row.createdAt) : "—"}
                      </td>

                      {/* Register */}
                      <td className="p-3">
                        {row.registerId ? (
                          <span className="font-mono text-xs font-semibold text-primary">
                            {row.registerId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Source accounts */}
                      <td className="p-3">
                        <SourceAccountsCell accounts={row.sourceAccounts} />
                      </td>

                      {/* Destination */}
                      <td className="p-3">
                        {row.destinationAccount?.accountNumber ||
                        row.destinationAccount?.holderName ? (
                          <div>
                            <p className="font-mono text-xs">
                              {row.destinationAccount.accountNumber || "—"}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {row.destinationAccount.holderName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Total holdings */}
                      <td className="p-3 text-right font-mono font-semibold whitespace-nowrap">
                        {row.totalHoldings > 0 ? (
                          row.totalHoldings.toLocaleString()
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            —
                          </span>
                        )}
                      </td>

                      {/* Submitted by */}
                      <td className="p-3 whitespace-nowrap">
                        {row.initiatorName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="p-3 max-w-45">
                        {(row.reason ?? row.comment) ? (
                          <span
                            title={row.reason ?? row.comment}
                            className="block truncate text-muted-foreground cursor-default"
                          >
                            {row.reason ?? row.comment}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {statusBadge(row.status)}
                      </td>

                      {/* Authorised by */}
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {row.status === "REVERSED" ? (
                          <span
                            title={
                              row.reversalComment
                                ? `Reversal note: ${row.reversalComment}${row.reversedAt ? ` · ${formatDate(row.reversedAt)}` : ""}`
                                : undefined
                            }
                            className="cursor-default"
                          >
                            {row.authorisedBy || "—"}
                          </span>
                        ) : (
                          row.authorisedBy || (
                            <span className="text-muted-foreground">—</span>
                          )
                        )}
                      </td>

                      {/* Actions */}
                      {canApprove && (
                        <td
                          className="p-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.status === "APPROVED" ||
                          row.status === "AUTHORISED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-600 border-amber-300 hover:bg-amber-50 gap-1.5"
                              onClick={() => {
                                setReversalTarget(row);
                                setReversalReason("");
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reverse
                            </Button>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={canApprove ? 10 : 9}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No consolidations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

      {/* Reversal confirmation dialog */}
      <Dialog
        open={!!reversalTarget}
        onOpenChange={(open) => {
          if (!open) {
            setReversalTarget(null);
            setReversalReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Reverse Consolidation #{reversalTarget?.id}
            </DialogTitle>
            <DialogDescription>
              This action will reverse the approved consolidation. Please
              provide a reason before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 px-6">
            <Textarea
              placeholder="Enter reason for reversal…"
              className="min-h-24 resize-none"
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReversalTarget(null);
                setReversalReason("");
              }}
              disabled={reverseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                reversalReason.trim() === "" || reverseMutation.isPending
              }
              onClick={handleReverse}
            >
              {reverseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reversing…
                </>
              ) : (
                "Confirm Reversal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConsolidationDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
}

// ─── Source accounts cell ─────────────────────────────────────────────────────

function SourceAccountsCell({
  accounts,
}: {
  accounts: ConsolidationAccount[];
}) {
  if (!accounts?.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  const labels = accounts
    .map((a) => a?.accountNumber || a?.holderName)
    .filter(Boolean) as string[];

  if (!labels.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (labels.length === 1) {
    return <span className="font-mono text-xs">{labels[0]}</span>;
  }

  return (
    <span title={labels.join(", ")} className="cursor-default">
      <span className="font-mono text-xs">{labels[0]}</span>
      <span className="text-muted-foreground text-xs ml-1">
        +{labels.length - 1} more
      </span>
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    AUTHORISED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-700",
    DECLINED: "bg-red-100 text-red-700",
    REVERSED: "bg-amber-100 text-amber-800",
  };
  return (
    <Badge
      className={`${map[status] ?? "bg-gray-100 text-gray-700"} border-0 text-[12px]`}
    >
      {status}
    </Badge>
  );
};

// ─── Doc preview dialog ───────────────────────────────────────────────────────

function isPdf(url: string) {
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

function DocPreviewDialog({
  doc,
  onClose,
}: {
  doc: { name: string; url: string } | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!doc}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 shrink-0 border-b">
          <DialogTitle className="text-base truncate pr-8">
            {doc?.name || "Document"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {doc &&
            (isPdf(doc.url) ? (
              <iframe
                src={doc.url}
                title={doc.name}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="relative w-full h-full bg-muted/20">
                <Image
                  src={doc.url}
                  alt={doc.name}
                  fill
                  unoptimized
                  className="object-contain p-4"
                />
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Consolidation detail modal ───────────────────────────────────────────────

function ConsolidationDetailModal({
  record,
  onClose,
}: {
  record: Consolidation | null;
  onClose: () => void;
}) {
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
  } | null>(null);

  if (!record) return null;

  const sourceTotal =
    record.sourceAccounts?.reduce((s, a) => s + (a.holdings ?? 0), 0) ?? 0;

  return (
    <>
      <Dialog
        open={!!record}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-w-2xl h-[85vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <DialogTitle>Consolidation #{record.id}</DialogTitle>
              {statusBadge(record.status)}
            </div>
            <DialogDescription>
              {record.createdAt ? formatDate(record.createdAt) : "—"}
              {record.decidedAt && record.decidedAt !== record.createdAt && (
                <> · Decided {formatDate(record.decidedAt)}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-4 space-y-5">
            {/* Meta */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Register</p>
                <p className="font-mono font-semibold text-primary">
                  {record.registerId || "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Submitted By</p>
                <p className="font-medium">{record.initiatorName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Authorised By</p>
                <p className="font-medium">{record.authorisedBy || "—"}</p>
              </div>
            </div>

            {/* Source accounts */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Source Accounts ({record.sourceAccounts?.length ?? 0})
              </p>
              {record.sourceAccounts?.length > 0 ? (
                <div className="divide-y rounded-lg border overflow-hidden">
                  {record.sourceAccounts.map((acc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2.5 text-xs bg-muted/5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{acc.holderName || "—"}</p>
                        <p className="font-mono text-muted-foreground">
                          {acc.accountNumber || "—"}
                        </p>
                      </div>
                      <p className="font-mono font-semibold shrink-0 ml-4">
                        {acc.holdings > 0 ? (
                          acc.holdings.toLocaleString()
                        ) : (
                          <span className="text-muted-foreground font-normal">
                            —
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/20 text-xs font-semibold">
                    <span className="text-muted-foreground">Source total</span>
                    <span className="font-mono">
                      {sourceTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No source accounts recorded.
                </p>
              )}
            </div>

            {/* Destination */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                Destination Account
              </p>
              <div className="rounded-lg border px-3 py-2.5 bg-primary/5 border-primary/20 text-xs space-y-0.5">
                <p className="font-medium">
                  {record.destinationAccount?.holderName || "—"}
                </p>
                <p className="font-mono text-muted-foreground">
                  {record.destinationAccount?.accountNumber || "—"}
                </p>
              </div>
            </div>

            {/* Combined total */}
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 bg-muted/20 text-xs">
              <span className="text-muted-foreground">
                Combined total holdings
              </span>
              <span className="font-bold font-mono text-primary text-base">
                {record.totalHoldings > 0 ? (
                  record.totalHoldings.toLocaleString()
                ) : (
                  <span className="text-muted-foreground font-normal text-sm">
                    —
                  </span>
                )}
              </span>
            </div>

            {/* Reason */}
            {record.comment && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Reason
                </p>
                <p className="text-xs bg-muted/20 rounded-lg px-3 py-2.5 border leading-relaxed">
                  {record.comment}
                </p>
              </div>
            )}

            {/* Rejection comment */}
            {record.rejectionComment && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-destructive mb-1.5">
                  Rejection Comment
                </p>
                <p className="text-xs bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5 leading-relaxed text-destructive">
                  {record.rejectionComment}
                </p>
              </div>
            )}

            {/* Reversal info */}
            {record.status === "REVERSED" && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1.5">
                  Reversal Information
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1.5 text-xs">
                  {record.reversedAt && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Reversed at:
                      </span>
                      <span className="font-medium">
                        {formatDate(record.reversedAt)}
                      </span>
                    </div>
                  )}
                  {record.reversalComment && (
                    <div>
                      <span className="text-muted-foreground">
                        Reversal note:
                      </span>
                      <p className="mt-0.5 leading-relaxed">
                        {record.reversalComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Supporting documents */}
            {record.supportingDocuments &&
              record.supportingDocuments.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Supporting Documents ({record.supportingDocuments.length})
                  </p>
                  <div className="space-y-2">
                    {record.supportingDocuments.map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-muted/10"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate text-xs font-mono">
                          {doc.name || `Document ${i + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer font-medium shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          <DialogFooter className="px-8 py-4 shrink-0 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocPreviewDialog doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  );
}
