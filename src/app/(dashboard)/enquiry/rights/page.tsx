"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useAllRightsIssues } from "@/hooks/useRights";
import { useGetRightsEntitlements } from "@/hooks/useEnquiry";
import { formatNaira, formatNumber, formatDate } from "@/lib/utils/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaginationBar } from "@/components/custom/pagination-bar";

export default function RightsEnquiryPage() {
  const [showResults, setShowResults] = useState(false);
  const [registerSymbol, setRegisterSymbol] = useState("");
  const [rightsIssueId, setRightsIssueId] = useState("all");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [searchParams, setSearchParams] = useState<{
    registerSymbol?: string;
    rightsIssueId?: string;
    q?: string;
  }>({});

  const { data: registersData, isLoading: isLoadingRegisters } = useGetRegisters({
    size: 100,
    status: "ACTIVE"
  });

  const { data: rightsIssuesData, isLoading: isLoadingIssues } = useAllRightsIssues({
    pageSize: 100,
    registerId: registerSymbol || undefined,
    status: "ICU_APPROVED"
  }, {
    enabled: !!registerSymbol
  });

  const { data, isLoading, isError, error } = useGetRightsEntitlements(
    {
      registerSymbol: searchParams.registerSymbol || "",
      rightsIssueId: searchParams.rightsIssueId,
      q: searchParams.q,
      page: page, // API is 0-indexed for page
      size: pageSize,
    },
    {
      enabled: showResults && !!searchParams.registerSymbol,
    }
  );

  const handleSearch = () => {
    if (!registerSymbol) return;
    setSearchParams({
      registerSymbol,
      rightsIssueId: rightsIssueId && rightsIssueId !== "all" ? rightsIssueId : undefined,
      q: q.trim() || undefined,
    });
    setPage(0);
    setShowResults(true);
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rights Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">Check shareholder rights entitlements, trades, and renunciation status</p>
        </div>
      </div>

      <Card className="mrpsl-card p-5">
        <div className="flex gap-4 items-end flex-wrap md:flex-nowrap">
          <div className="space-y-2">
            <label className="mrpsl-label">Register *</label>
            <Select
              value={registerSymbol}
              onValueChange={(val) => {
                setRegisterSymbol(val || "");
                setRightsIssueId("all");
                setSearchParams({});
                setShowResults(false);
              }}
            >
              <SelectTrigger className="w-48 mrpsl-input">
                <SelectValue placeholder="Select Register" />
              </SelectTrigger>
              <SelectContent>
                {
                  isLoadingRegisters && <SelectItem value="_loading" disabled>Loading registers</SelectItem>
                }
                {registersData?.content?.map((reg) => (
                  <SelectItem key={reg.registerId} value={reg.symbol}>
                    {reg.registerName}.{reg.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="mrpsl-label">Rights Issue</label>
            <Select
              value={rightsIssueId}
              onValueChange={(val) => {
                setRightsIssueId(val || "");
                setSearchParams({});
                setShowResults(false);
              }}
              disabled={!registerSymbol}
            >
              <SelectTrigger className="w-64 mrpsl-input">
                <SelectValue placeholder={isLoadingIssues ? "Loading..." : "Select Issue"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                {rightsIssuesData?.content?.map((issue) => (
                  <SelectItem key={issue.id} value={issue.id}>
                    {issue.offerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="mrpsl-label">Account No or Surname</label>
            <Input
              className="mrpsl-input w-48"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. 10029"
            />
          </div>

          <Button
            size="lg"
            className="h-10 px-8"
            onClick={handleSearch}
            disabled={isLoading || !registerSymbol}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Search
          </Button>
        </div>
      </Card>

      {showResults && (
        <div className="space-y-6 animate-in fade-in">
          {isLoading && (
            <div className="flex items-center justify-center p-8 bg-background rounded-lg border mrpsl-card">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground font-medium">Fetching rights entitlements...</span>
            </div>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Search Failed</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unexpected error occurred while fetching rights entitlements."}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && (!data?.content || data.content.length === 0) && (
            <div className="flex flex-col items-center justify-center p-12 bg-background rounded-lg border mrpsl-card text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-bold text-lg">No Entitlements Found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                We couldn&apos;t find any rights entitlements matching the query parameters provided. Please check your inputs and try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && data && data.content.length > 0 && (
            <div className="space-y-6">
              {data.summary && (
                <Card className="mrpsl-card p-5 bg-muted/10 border-l-4 border-l-primary">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{data.summary.rightsIssueName || "Rights Issue Summary"}</h3>
                    <div className="font-mono text-sm bg-background px-2 py-1 rounded border">
                      Qual Date: {formatDate(data.summary.qualificationDate)}
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm text-muted-foreground flex-wrap">
                    <span>Rights Size: <strong className="text-foreground">{formatNumber(data.summary.rightsSize)}</strong> units</span>
                    <span>Issue Price: <strong className="text-foreground">{formatNaira(data.summary.issuePrice)}</strong></span>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {data.content.map((entitlement) => (
                  <Card key={entitlement?.accountNo} className="mrpsl-card">
                    <div className="p-4 border-b bg-muted/5 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">{entitlement?.holderName}</div>
                        <div className="font-mono text-sm text-muted-foreground">{entitlement?.accountNo}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs mrpsl-section-title">Holdings at Qual Date</div>
                        <div className="font-mono text-xl font-bold">{formatNumber(entitlement?.holdingsAtQualDate)}</div>
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-6">
                      <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-muted-foreground">Total Rights Due</div>
                        <div className="text-2xl font-mono text-primary font-bold">{formatNumber(entitlement?.totalRightsDue)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-muted-foreground">Fraction</div>
                        <div className="text-2xl font-mono text-amber-600">{entitlement?.fraction?.toFixed(1) || 0}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-muted-foreground">Rights Taken</div>
                        <div className="text-2xl font-mono font-bold text-green-600">{formatNumber(entitlement?.rightsTaken)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-muted-foreground">Rights Traded</div>
                        <div className="text-2xl font-mono">{formatNumber(entitlement?.rightsTraded)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-muted-foreground">Rights Renounced</div>
                        <div className="text-2xl font-mono">{formatNumber(entitlement?.rightsRenounced)}</div>
                      </div>
                    </div>
                    <div className="p-4 border-t text-xs text-muted-foreground flex justify-between">
                      <span>Allotment Date: {formatDate(entitlement?.allotmentDate)}</span>
                      <span>
                        Status:{" "}
                        <span className="font-bold text-green-600">
                          {entitlement?.status || "PENDING"}
                        </span>
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              <PaginationBar
                page={page}
                pageSize={pageSize}
                totalPages={data.totalPages || 1}
                total={data.totalElements || 0}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
