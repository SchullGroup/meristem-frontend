"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CloudUpload, Search, Plus, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import DateInput from "@/components/ui/date-input";

import {
  useGetRightsIssueShareholders,
  useCreateTradedRights,
  useGetTradedRights,
  useDeleteTradedRights,
} from "@/hooks/useRights";
import { RightsIssue, Shareholder } from "@/types/rights";
import { PaginationBar } from "../pagination-bar";
import { formatNumber } from "@/lib/utils/format";
import { LodgeRightsDialog } from "./approval-dialogs";

interface TradedRightsEntryProps {
  selectedIssue: RightsIssue;
  onSuccess: () => void;
}

export function TradedRightsEntry({
  selectedIssue,
  onSuccess,
}: TradedRightsEntryProps) {
  const [batchDate, setBatchDate] = useState<Date>(new Date());
  const [shSearch, setShSearch] = useState("");
  const [shSearchOpen, setShSearchOpen] = useState(false);
  const [selectedSh, setSelectedSh] = useState<Shareholder | null>(null);
  const [volume, setVolume] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [lodgeOpen, setLodgeOpen] = useState(false);

  // Shareholder search for the selected issue
  const { data: shData, isLoading: shLoading } = useGetRightsIssueShareholders({
    params: {
      id: selectedIssue.id,
      search: shSearch.length >= 2 ? shSearch : undefined,
    },
    options: {
      enabled: shSearch.length >= 2,
    },
  });

  // Pending entries for the selected issue
  const {
    data: historyData,
  } = useGetTradedRights({
    id: selectedIssue.id,
    page: historyPage,
    pageSize: historyPageSize,
  });

  const createMutation = useCreateTradedRights();
  const deleteMutation = useDeleteTradedRights();

  const handleAddEntry = () => {
    if (!selectedSh || !volume || !memberCode) return;
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
      }
    );
  };

  const handleRemoveEntry = (entryId: string) => {
    deleteMutation.mutate(
      { id: selectedIssue.id, entryId },
      {
        onSuccess: () => toast.success("Entry removed."),
        onError: (err) => toast.error(err?.message ?? "Failed to remove entry"),
      }
    );
  };

  const batchRef = `TR-${format(batchDate, "yyyyMMdd")}-001`;
  const totalVolume =
    (historyData?.content &&
      historyData?.content.reduce((a, e) => a + e.volume, 0)) ||
    0;

  return (
    <div className="space-y-6">
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
      {historyData?.content && historyData?.content?.length > 0 ? (
        <Card className="mrpsl-card overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">
              Batch Entries ({historyData?.pagination?.total})
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
                {historyData?.content?.map((e, i) => (
                  <tr key={e.id} className="mrpsl-table-row">
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      {e.registrarsAccount}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{e.chn}</td>
                    <td className="px-3 py-2.5 font-medium">
                      {e.shareholderName}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">
                      {formatNumber(e.volume)}
                    </td>
                    <td className="px-3 py-2.5 font-mono">{e.memberCode}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        disabled={deleteMutation.isPending}
                        onClick={() => handleRemoveEntry(e.id)}
                        className="cursor-pointer rounded p-1 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors disabled:opacity-40"
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
                    {formatNumber(totalVolume)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>

            {/* {historyData?.pagination && ( */}
            <PaginationBar
              page={historyPage}
              total={historyData?.pagination?.total ?? 0}
              pageSize={historyPageSize}
              onPageSizeChange={setHistoryPageSize}
              onPageChange={(p) => setHistoryPage(p)}
              pageBase={1}
            />
            {/* )} */}
          </div>

          <div className="flex gap-3 p-4 border-t">
            <Button
              className="flex-1"
              disabled={createMutation.isPending}
              onClick={() => setLodgeOpen(true)}
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

      <LodgeRightsDialog
        open={lodgeOpen}
        onOpenChange={setLodgeOpen}
        rightsIssueDetails={selectedIssue}
        onSuccess={onSuccess}
      />
    </div>
  );
}
