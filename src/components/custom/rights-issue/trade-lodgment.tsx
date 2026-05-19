"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CloudUpload,
  Search,
  Plus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";

import {
  useAllRightsIssues,
  useGetRightsIssueShareholders,
  useCreateTradedRights,
  useGetTradedRights,
  useDeleteTradedRights,
} from "@/hooks/useRights";
import { RightsIssue, Shareholder } from "@/types/rights";
import { PaginationBar } from "../pagination-bar";
import { DataErrorState } from "../ipo/loaders";
import DateInput from "@/components/ui/date-input";
import { useDebounce } from "@/hooks/useDebounce";

/* ─── local types ─── */
interface PendingEntry {
  /** local-only key for list rendering */
  localId: string;
  shareholderId: string;
  registrarsAccount: string;
  chn: string;
  name: string;
  volume: number;
  memberCode: string;
}

/* ─── component ─── */
export default function RightsIssueTradedLodgment() {
  /* ── list-view state ── */
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);
  const [listSearch, setListSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<RightsIssue | null>(null);

  /* ── detail-view: batch header ── */
  const [batchDate, setBatchDate] = useState<Date>(new Date());

  /* ── detail-view: entry form ── */
  const [shSearch, setShSearch] = useState("");
  const [shSearchOpen, setShSearchOpen] = useState(false);
  const [selectedSh, setSelectedSh] = useState<Shareholder | null>(null);
  const [volume, setVolume] = useState("");
  const [memberCode, setMemberCode] = useState("");

  /* ── detail-view: local pending entries ── */
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);

  /* ── detail-view: submitted history pagination ── */
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const debouncedListSearch = useDebounce(listSearch, 500);

  // Rights issue list
  const {
    data: issuesList,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useAllRightsIssues({
    page: listPage,
    pageSize: listPageSize,
    search: debouncedListSearch != "" ? debouncedListSearch : undefined,
    status: "ALLOTTED",
  });

  // Shareholder search for the selected issue
  const { data: shData, isLoading: shLoading } = useGetRightsIssueShareholders({
    params: {
      id: selectedIssue?.id ?? "",
      search: shSearch.length >= 2 ? shSearch : undefined,
    },
    options: {
      enabled: !!selectedIssue && shSearch.length >= 2,
    },
  });

  // Submitted history for the selected issue
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useGetTradedRights({
    id: selectedIssue?.id ?? "",
    page: historyPage,
    pageSize: historyPageSize,
  });

  const createMutation = useCreateTradedRights();
  const deleteMutation = useDeleteTradedRights();

  /* ═══ handlers ═══ */

  const handleAddEntry = () => {
    if (!selectedSh || !volume || !memberCode || !selectedIssue) return;
    createMutation.mutateAsync(
      {
        id: selectedIssue.id,
        data: {
          shareholderId: selectedSh.shareholderId,
          volume: Number(volume),
          memberCode: memberCode,
        },
      },
      {
        onSuccess: () => {
          setSelectedSh(null);
          setVolume("");
          setMemberCode("");
          setShSearch("");
          toast.success("Shareholder entry added.");
        },
        onError: (error) => {
          toast.error(error?.message ?? "Failed to add shareholder entry");
        },
      },
    );
  };

  const handleRemoveEntry = (entryId: string) => {
    if (!selectedIssue) return;
    deleteMutation.mutate(
      { id: selectedIssue.id, entryId },
      {
        onSuccess: () => toast.success("Entry removed."),
        onError: (err) => toast.error(err?.message ?? "Failed to remove entry"),
      },
    );
  };

  const handleProcessLodgment = () => {
    if (!selectedIssue || pendingEntries.length === 0) return;
  };

  const batchRef = `TR-${format(batchDate, "yyyyMMdd")}-001`;
  const totalVolume = pendingEntries.reduce((a, e) => a + e.volume, 0);

  /* ══════════════════════════════════════════
     LIST VIEW — no issue selected
  ══════════════════════════════════════════ */
  if (!selectedIssue) {
    return (
      <div className="space-y-4">
        {/* Search filter */}
        <Card className="mrpsl-card p-5">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or name..."
                value={listSearch}
                onChange={(e) => {
                  setListSearch(e.target.value);
                  setListPage(1);
                }}
                className="pl-9 mrpsl-input"
              />
            </div>
          </div>
        </Card>

        {/* List table */}
        <Card className="mrpsl-card overflow-hidden">
          {listLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Loading rights issues...
              </p>
            </div>
          ) : listError ? (
            <DataErrorState
              message="Failed to load rights issues"
              onRetry={refetchList}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-4 py-3">REF</th>
                      <th className="px-4 py-3">REGISTER</th>
                      <th className="px-4 py-3">OFFER NAME</th>
                      <th className="px-4 py-3">CLOSURE DATE</th>
                      <th className="px-4 py-3">STATUS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {issuesList?.content?.map((issue) => (
                      <tr key={issue.id} className="mrpsl-table-row">
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                          {issue.ref}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {issue.registerName}
                        </td>
                        <td className="px-4 py-3">{issue.offerName}</td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground">
                          {issue.closureDate}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-blue-100 text-blue-800 border-0 text-[12px]">
                            {issue.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIssue(issue);
                              setPendingEntries([]);
                              setHistoryPage(1);
                            }}
                          >
                            Lodge Rights
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!issuesList?.content ||
                      issuesList.content.length === 0) && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-sm text-muted-foreground italic"
                        >
                          No rights issues found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {issuesList?.pagination && (
                <PaginationBar
                  page={listPage}
                  total={issuesList?.pagination?.total ?? 0}
                  pageSize={listPageSize}
                  onPageSizeChange={setListPageSize}
                  onPageChange={(p) => setListPage(p)}
                />
              )}
            </>
          )}
        </Card>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DETAIL VIEW — issue selected
  ══════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -ml-2"
        onClick={() => setSelectedIssue(null)}
      >
        <ArrowLeft className="h-4 w-4" /> Back to list
      </Button>

      {/* Selected issue header */}
      <Card className="mrpsl-card p-4 bg-muted/20 border-l-4 border-l-primary">
        <p className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Rights Issue
        </p>
        <div className="flex items-center gap-8 text-sm flex-wrap">
          <div>
            <div className="mrpsl-section-title">Ref</div>
            <div className="font-mono font-semibold mt-0.5">
              {selectedIssue.ref}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Register</div>
            <div className="font-semibold mt-0.5">
              {selectedIssue.registerName}
            </div>
          </div>
          <div>
            <div className="mrpsl-section-title">Offer Name</div>
            <div className="mt-0.5">{selectedIssue.offerName}</div>
          </div>
          <div>
            <div className="mrpsl-section-title">Rights Ratio</div>
            <div className="font-mono mt-0.5">{selectedIssue.ratio}</div>
          </div>
          <div>
            <div className="mrpsl-section-title">Closure Date</div>
            <div className="font-mono mt-0.5">{selectedIssue.closureDate}</div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-0 self-end mb-0.5">
            {selectedIssue.status}
          </Badge>
        </div>
      </Card>

      {/* Batch header row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="mrpsl-label">Register</label>
          <Input
            disabled
            value={`${selectedIssue.registerName} (${selectedIssue.registerSymbol})`}
            className="mrpsl-input bg-muted/50 font-mono text-sm"
          />
        </div>
        <DateInput date={batchDate} setDate={setBatchDate} />

        <div className="space-y-2">
          <label className="mrpsl-label">Batch Reference</label>
          <Input
            disabled
            value={batchRef}
            className="mrpsl-input bg-muted/50 font-mono text-sm"
          />
        </div>
      </div>

      {/* Entry form */}
      <Card className="mrpsl-card p-5">
        <h3 className="font-semibold text-sm mb-4">Add Shareholder Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
          {/* Shareholder search */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">Shareholder</label>
            <Popover open={shSearchOpen} onOpenChange={setShSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mrpsl-input justify-start text-left font-normal gap-2"
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  {selectedSh ? (
                    <span className="flex-1 truncate">{selectedSh.name}</span>
                  ) : (
                    <span className="text-muted-foreground flex-1">
                      Search by name or account no...
                    </span>
                  )}
                  {selectedSh && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSh(null);
                        setShSearch("");
                      }}
                      className="ml-auto rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[320px]" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search shareholders..."
                    value={shSearch}
                    onValueChange={setShSearch}
                  />
                  <CommandList>
                    {shLoading ? (
                      <div className="p-4 flex justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>
                          {shSearch.length < 2
                            ? "Type at least 2 characters..."
                            : "No shareholders found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {shData?.content?.map((sh) => (
                            <CommandItem
                              key={sh.shareholderId}
                              value={sh.name}
                              onSelect={() => {
                                setSelectedSh(sh);
                                setShSearch("");
                                setShSearchOpen(false);
                              }}
                            >
                              <div>
                                <div className="font-medium text-sm">
                                  {sh.name}
                                </div>
                                <div className="text-[13px] text-muted-foreground font-mono">
                                  {sh.accountNumber} · CHN: {sh.chn}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Volume */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">Volume (units)</label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 5000"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="mrpsl-input w-36 font-mono"
            />
          </div>

          {/* Member code */}
          <div className="space-y-1.5">
            <label className="mrpsl-label">Stockbroker Code</label>
            <Input
              placeholder="e.g. MST"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
              className="mrpsl-input w-28 font-mono uppercase"
              maxLength={5}
            />
          </div>

          {/* Add button */}
          <Button
            size="lg"
            disabled={!selectedSh || !volume || !memberCode}
            onClick={handleAddEntry}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Entry
          </Button>
        </div>
      </Card>

      {/* Pending entries table */}
      {pendingEntries.length > 0 ? (
        <Card className="mrpsl-card overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">
              Batch Entries ({pendingEntries.length})
            </span>
            <span className="text-[13px] text-muted-foreground font-mono">
              Total Volume: {totalVolume.toLocaleString()} units
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="mrpsl-table-header">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">REG AC NO</th>
                  <th className="px-3 py-2.5">CHN</th>
                  <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
                  <th className="px-3 py-2.5 text-right">VOLUME</th>
                  <th className="px-3 py-2.5">MCODE</th>
                  <th className="px-3 py-2.5 text-right">REMOVE</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingEntries.map((e, i) => (
                  <tr key={e.localId} className="mrpsl-table-row">
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      {e.registrarsAccount}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{e.chn}</td>
                    <td className="px-3 py-2.5 font-medium">{e.name}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">
                      {e.volume.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{e.memberCode}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => handleRemoveEntry(e.localId)}
                        className="rounded p-1 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t-2 font-mono font-bold text-[13px]">
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-2.5 text-right text-muted-foreground"
                  >
                    BATCH TOTAL
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {totalVolume.toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex gap-3 p-4 border-t">
            <Button
              className="flex-1"
              disabled={createMutation.isPending}
              onClick={handleProcessLodgment}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Process Lodgment
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => toast.success("Pushed to CSCS API.")}
            >
              <CloudUpload className="mr-2 h-4 w-4" /> Push via CSCS API
            </Button>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No entries yet — search for a shareholder above and add their traded
          rights subscription.
        </div>
      )}

      {/* ── Submitted / history section ── */}
      <div className="space-y-3 pt-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-widest">
          Submitted Lodgments
        </h3>
        <Card className="mrpsl-card overflow-hidden">
          {historyLoading ? (
            <div className="p-10 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading lodgment history...
              </p>
            </div>
          ) : historyError ? (
            <DataErrorState
              message="Failed to load lodgment history"
              onRetry={refetchHistory}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">SHAREHOLDER NAME</th>
                      <th className="px-3 py-2.5">REG AC NO</th>
                      <th className="px-3 py-2.5">CHN</th>
                      <th className="px-3 py-2.5 text-right">VOLUME</th>
                      <th className="px-3 py-2.5">MCODE</th>
                      <th className="px-3 py-2.5 text-muted-foreground">
                        LODGED AT
                      </th>
                      <th className="px-3 py-2.5 text-right">REMOVE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyData?.content?.map((entry, i) => (
                      <tr key={entry.id} className="mrpsl-table-row">
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {historyPage * historyPageSize + i + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          {entry.shareholderName}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {entry.registrarsAccount}
                        </td>
                        <td className="px-3 py-2.5 font-mono">{entry.chn}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold">
                          {entry.volume.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {entry.memberCode}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {entry.lodgedAt}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            disabled={deleteMutation.isPending}
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="rounded p-1 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!historyData?.content ||
                      historyData.content.length === 0) && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-muted-foreground italic"
                        >
                          No lodgments submitted yet for this declaration.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {historyData?.pagination && (
                <PaginationBar
                  page={historyPage}
                  total={historyData.pagination.total}
                  pageSize={historyPageSize}
                  onPageSizeChange={setHistoryPageSize}
                  onPageChange={setHistoryPage}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
