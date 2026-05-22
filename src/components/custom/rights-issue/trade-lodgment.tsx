"use client";

import { useState } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useAllRightsIssues } from "@/hooks/useRights";
import { RightsIssue } from "@/types/rights";
import { PaginationBar } from "../pagination-bar";
import { DataErrorState } from "../ipo/loaders";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TradedRightsEntry } from "./traded-rights-entry";
import { SubmittedLodgement } from "./submitted-lodgement";

/* ─── component ─── */
export default function RightsIssueTradedLodgment() {
  /* ── list-view state ── */
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);
  const [listSearch, setListSearch] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<RightsIssue | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALLOTTED");
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
    status: selectedStatus,
  });

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

            <div className="space-y-1.5">
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v ?? "all")}
              >
                <SelectTrigger className="mrpsl-input w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="ALLOTTED">ALLOTTED</SelectItem>
                  <SelectItem value="LODGED">LODGED</SelectItem>
                </SelectContent>
              </Select>
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
                          <Badge
                            className={`border-0 text-[12px] ${issue.status === "LODGED"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {issue.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIssue(issue);
                            }}
                          >
                            {issue.status === "LODGED"
                              ? "View Lodgment"
                              : "Lodge Rights"}
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

  const isLodged = selectedIssue.status === "LODGED";

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
          <Badge
            className={`border-0 self-end mb-0.5 ${isLodged
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
              }`}
          >
            {selectedIssue.status}
          </Badge>
        </div>
      </Card>

      {isLodged ? (
        <SubmittedLodgement selectedIssue={selectedIssue} />
      ) : (
        <TradedRightsEntry
          selectedIssue={selectedIssue}
          onSuccess={() => {
            setSelectedIssue(null);
            refetchList();
          }}
        />
      )}
    </div>
  );
}
