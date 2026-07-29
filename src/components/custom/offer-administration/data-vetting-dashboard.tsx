"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Copy, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/custom/stat-card";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { toast } from "sonner";
import {
  useIpoBatchesByOffer,
  useIpoVettingSummary,
  useIpoVettingApplications,
  useIpoDuplicateGroups,
  useResolveIpoDuplicate,
} from "@/hooks/useIPO";
import { useStore } from "@/lib/store";
import type { IPOSubscriber } from "@/types/ipo";

interface DataVettingDashboardProps {
  activeOffer?: { id: string; offerName?: string } | null;
}

const num = (n?: number | null) => (n ?? 0).toLocaleString();

export function DataVettingDashboard({ activeOffer }: DataVettingDashboardProps) {
  const { currentUser } = useStore();
  const [selectedBatch, setSelectedBatch] = useState("");
  const [validSearch, setValidSearch] = useState("");
  const [rejectedSearch, setRejectedSearch] = useState("");
  const [validPage, setValidPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);
  const pageSize = 20;

  const { data: batches } = useIpoBatchesByOffer(activeOffer?.id ?? "");
  const batchList = useMemo(() => batches?.content ?? [], [batches]);

  // Effective batch = explicit selection, else the most recent uploaded batch. Derived during
  // render (no effect) so it auto-selects without a cascading setState.
  const batchRef = selectedBatch || batchList[0]?.batchReference || "";

  const { data: summary } = useIpoVettingSummary(batchRef);
  const { data: validData, isLoading: validLoading } = useIpoVettingApplications({
    batchRef, bucket: "VALID", search: validSearch, page: validPage - 1, size: pageSize,
  });
  const { data: rejectedData, isLoading: rejectedLoading } = useIpoVettingApplications({
    batchRef, bucket: "REJECTED", search: rejectedSearch, page: rejectedPage - 1, size: pageSize,
  });
  const { data: duplicateGroups, isLoading: dupLoading } = useIpoDuplicateGroups(batchRef);
  const resolveDup = useResolveIpoDuplicate(batchRef);

  const handleResolve = (
    s: IPOSubscriber,
    action: "MARK_DISTINCT" | "REJECT",
  ) => {
    resolveDup.mutate(
      { subscriberId: s.id, action, resolvedBy: currentUser?.email ?? "SYSTEM" },
      {
        onSuccess: () =>
          toast.success(
            action === "REJECT"
              ? `${s.subscriberName} rejected as duplicate.`
              : `${s.subscriberName} kept as a distinct applicant.`,
          ),
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  if (!activeOffer) {
    return (
      <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
        Select an active offer above to view its vetting results.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch selector */}
      <Card className="mrpsl-card p-4">
        <div className="space-y-1.5 w-96 max-w-full">
          <label className="mrpsl-label">Uploaded Batch</label>
          <Select value={batchRef} onValueChange={(v) => { setSelectedBatch(v ?? ""); setValidPage(1); setRejectedPage(1); }}>
            <SelectTrigger className="mrpsl-input">
              <SelectValue placeholder={batchList.length ? "Select a batch" : "No batches uploaded for this offer"} />
            </SelectTrigger>
            <SelectContent>
              {batchList.map((b) => (
                <SelectItem key={b.batchReference} value={b.batchReference}>
                  {b.batchReference} — {b.batchDate} ({b.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {!batchRef ? (
        <Card className="mrpsl-card p-12 text-center text-sm text-muted-foreground">
          No uploaded batch selected. Upload subscription data first, then pick a batch here.
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Valid Applications" value={num(summary?.validCount)} icon={CheckCircle2} />
            <StatCard label="Rejected Applications" value={num(summary?.rejectedCount)} icon={XCircle} variant="destructive" />
            <StatCard label="Suspected Duplicates" value={num(summary?.duplicateCount)} icon={Copy} variant="warning" />
          </div>

          <Card className="mrpsl-card overflow-hidden flex flex-col min-h-100">
            <Tabs defaultValue="valid" className="flex-1 flex flex-col min-h-0">
              <div className="px-5 pt-0 border-b border-border shrink-0">
                <TabsList className="h-auto p-0 bg-transparent gap-6 rounded-none">
                  <TabsTrigger value="valid" className="rounded-none py-3 text-[13px] font-medium text-muted-foreground data-active:text-primary">
                    Valid Applications ({num(summary?.validCount)})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="rounded-none py-3 text-[13px] font-medium text-muted-foreground data-active:text-primary">
                    Rejected Applications ({num(summary?.rejectedCount)})
                  </TabsTrigger>
                  <TabsTrigger value="duplicates" className="rounded-none py-3 text-[13px] font-medium text-muted-foreground data-active:text-primary">
                    Duplicate Resolution Queue ({num(summary?.duplicateCount)})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Valid */}
              <TabsContent value="valid" className="flex-1 flex flex-col min-h-0 mt-0 p-4 space-y-3">
                <SearchBar value={validSearch} onChange={(v) => { setValidSearch(v); setValidPage(1); }} />
                <ApplicationsTable
                  rows={validData?.content ?? []}
                  loading={validLoading}
                  showReason={false}
                />
                {validData && (
                  <PaginationBar page={validPage} total={validData.totalElements} pageSize={pageSize} onPageChange={setValidPage} pageBase={1} />
                )}
              </TabsContent>

              {/* Rejected */}
              <TabsContent value="rejected" className="flex-1 flex flex-col min-h-0 mt-0 p-4 space-y-3">
                <SearchBar value={rejectedSearch} onChange={(v) => { setRejectedSearch(v); setRejectedPage(1); }} />
                <ApplicationsTable
                  rows={rejectedData?.content ?? []}
                  loading={rejectedLoading}
                  showReason
                />
                {rejectedData && (
                  <PaginationBar page={rejectedPage} total={rejectedData.totalElements} pageSize={pageSize} onPageChange={setRejectedPage} pageBase={1} />
                )}
              </TabsContent>

              {/* Duplicates */}
              <TabsContent value="duplicates" className="flex-1 flex flex-col min-h-0 mt-0 p-4 space-y-4">
                {dupLoading ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading duplicates…
                  </div>
                ) : (duplicateGroups ?? []).length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    No suspected duplicates in this batch.
                  </div>
                ) : (
                  (duplicateGroups ?? []).map((group, gi) => (
                    <Card key={`${group.matchType}-${group.duplicateKey}-${gi}`} className="mrpsl-card p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-[11px]">
                          Matched on {group.matchType}: {group.duplicateKey}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{group.applications.length} applications</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="mrpsl-table-header">
                              <th className="text-left px-3 py-2 font-medium">APPLICANT</th>
                              <th className="text-left px-3 py-2 font-medium">CHN</th>
                              <th className="text-left px-3 py-2 font-medium">BVN</th>
                              <th className="text-left px-3 py-2 font-medium">ACCOUNT</th>
                              <th className="text-right px-3 py-2 font-medium">UNITS</th>
                              <th className="text-right px-3 py-2 font-medium">AMOUNT (₦)</th>
                              <th className="text-center px-3 py-2 font-medium">ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.applications.map((a) => (
                              <tr key={a.id} className="mrpsl-table-row">
                                <td className="px-3 py-2 font-medium">{a.subscriberName}</td>
                                <td className="px-3 py-2 font-mono text-xs">{a.chn}</td>
                                <td className="px-3 py-2 font-mono text-xs">{a.bvn}</td>
                                <td className="px-3 py-2 font-mono text-xs">{a.accountNumber}</td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums">{num(a.units)}</td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums">{num(a.amount)}</td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs"
                                      disabled={resolveDup.isPending}
                                      onClick={() => handleResolve(a, "MARK_DISTINCT")}>
                                      Keep (distinct)
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive"
                                      disabled={resolveDup.isPending}
                                      onClick={() => handleResolve(a, "REJECT")}>
                                      Reject
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        className="mrpsl-input pl-9 h-9"
        placeholder="Search by name, CHN or account…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ApplicationsTable({
  rows,
  loading,
  showReason,
}: {
  rows: IPOSubscriber[];
  loading: boolean;
  showReason: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="mrpsl-table-header">
            <th className="text-left px-4 py-2.5 font-medium">APPLICANT</th>
            <th className="text-left px-4 py-2.5 font-medium">ACCOUNT</th>
            <th className="text-left px-4 py-2.5 font-medium">CHN</th>
            <th className="text-right px-4 py-2.5 font-medium">UNITS APPLIED</th>
            <th className="text-right px-4 py-2.5 font-medium">AMOUNT PAID (₦)</th>
            <th className="text-left px-4 py-2.5 font-medium">{showReason ? "REJECTION REASON" : "STOCKBROKER"}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No applications.</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="mrpsl-table-row">
                <td className="px-4 py-2.5 font-medium">
                  {r.subscriberName}
                  {r.suspectedDuplicate && (
                    <Badge className="ml-2 bg-amber-100 text-amber-800 border-0 text-[10px]">DUP</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.accountNumber}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.chn}</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">{num(r.units)}</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">{num(r.amount)}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {showReason ? (r.remark ?? "—") : (r.stockbrokerCode || r.broker || "—")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
