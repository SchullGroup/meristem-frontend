"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useQuery } from "@tanstack/react-query";
import {
  GET_DECLARATIONS,
  GET_SHAREHOLDERS_BY_DECLARATION_ID,
} from "@/actions/bonusIssuesAction";
import { formatNumber, formatDate } from "@/lib/utils/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaginationBar } from "@/components/custom/pagination-bar";

interface BonusEntitlement {
  accountNumber: string;
  name?: string;
  shareholderName?: string;
  unitsAtQualDate: number;
  bonusDue: number;
  fractionalRemainder: number;
}

interface BonusDeclaration {
  id: string;
  bonusName: string;
  ratio: string;
  qualificationDate: string;
  allotmentDate: string;
  totalShareholders: number;
  totalBonusShares: number;
  registerName: string;
  status: string;
}

export default function BonusEnquiryPage() {
  const [showResults, setShowResults] = useState(false);
  const [registerId, setRegisterId] = useState("");
  const [declarationId, setDeclarationId] = useState("");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [committedParams, setCommittedParams] = useState<{
    declarationId: string;
    q: string;
  }>({ declarationId: "", q: "" });

  const { data: registersData, isLoading: isLoadingRegisters } =
    useGetRegisters({ size: 100, status: "ACTIVE" });

  const { data: declarationsData, isLoading: isLoadingDeclarations } = useQuery(
    {
      queryKey: ["bonus-declarations-enquiry", registerId],
      queryFn: () =>
        GET_DECLARATIONS({ registerId, status: "ICU_APPROVED", pageSize: 100 }),
      enabled: !!registerId,
    },
  );

  const declarations: BonusDeclaration[] =
    declarationsData?.data?.content ?? [];

  const selectedDeclaration = declarations.find(
    (d) => d.id === committedParams.declarationId,
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "bonus-entitlements-enquiry",
      committedParams.declarationId,
      page,
      pageSize,
    ],
    queryFn: () =>
      GET_SHAREHOLDERS_BY_DECLARATION_ID(committedParams.declarationId, {
        page,
        pageSize,
      }),
    enabled: showResults && !!committedParams.declarationId,
  });

  const rawContent: BonusEntitlement[] =
    data?.data?.entitlements?.content ?? [];

  const filteredContent = committedParams.q
    ? rawContent.filter((e) => {
        const name = (e.name || e.shareholderName || "").toLowerCase();
        const acc = (e.accountNumber || "").toLowerCase();
        const search = committedParams.q.toLowerCase();
        return name.includes(search) || acc.includes(search);
      })
    : rawContent;

  const totalElements = data?.data?.entitlements?.totalElements ?? 0;
  const totalPages = data?.data?.entitlements?.totalPages ?? 1;

  const handleSearch = () => {
    if (!declarationId) return;
    setCommittedParams({ declarationId, q: q.trim() });
    setPage(0);
    setShowResults(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bonus Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Check shareholder bonus share entitlements and allotment details
          </p>
        </div>
      </div>

      <Card className="mrpsl-card p-5">
        <div className="flex gap-4 items-end flex-wrap md:flex-nowrap">
          <div>
            <label className="mrpsl-label">Register *</label>
            <Select
              value={registerId}
              onValueChange={(val) => {
                setRegisterId(val || "");
                setDeclarationId("");
                setCommittedParams({ declarationId: "", q: "" });
                setShowResults(false);
              }}
            >
              <SelectTrigger className="w-48 mrpsl-input">
                <SelectValue placeholder="Select Register" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingRegisters ? (
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  registersData?.content?.map((reg) => (
                    <SelectItem key={reg.registerId} value={reg.registerId}>
                      <span className="font-bold">{reg.registerName}</span> -{" "}
                      <span className="text-sm">{reg.symbol}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mrpsl-label">Bonus Declaration</label>
            <Select
              value={declarationId}
              onValueChange={(val) => {
                setDeclarationId(val || "");
                setCommittedParams({ declarationId: "", q: "" });
                setShowResults(false);
              }}
              disabled={!registerId}
            >
              <SelectTrigger className="w-64 mrpsl-input">
                <SelectValue placeholder="Select Declaration" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingDeclarations ? (
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <>
                    <SelectItem value=""> - Select Declaration - </SelectItem>
                    {declarations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.bonusName}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
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
            disabled={isLoading || !declarationId}
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
              <span className="text-muted-foreground font-medium">
                Fetching bonus entitlements...
              </span>
            </div>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Search Failed</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "An unexpected error occurred while fetching bonus entitlements."}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && filteredContent.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-background rounded-lg border mrpsl-card text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-bold text-lg">No Entitlements Found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                We couldn&apos;t find any bonus entitlements matching the
                parameters provided. Please check your inputs and try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredContent.length > 0 && (
            <div className="space-y-6">
              {selectedDeclaration && (
                <Card className="mrpsl-card p-5 bg-muted/10 border-l-4 border-l-primary">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">
                      {selectedDeclaration.bonusName}
                    </h3>
                    <div className="font-mono text-sm bg-background px-2 py-1 rounded border">
                      Qual Date:{" "}
                      {formatDate(selectedDeclaration.qualificationDate)}
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm text-muted-foreground flex-wrap">
                    <span>
                      Register:{" "}
                      <strong className="text-foreground">
                        {selectedDeclaration.registerName}
                      </strong>
                    </span>
                    <span>
                      Bonus Ratio:{" "}
                      <strong className="text-foreground">
                        {selectedDeclaration.ratio}
                      </strong>
                    </span>
                    <span>
                      Allotment Date:{" "}
                      <strong className="text-foreground">
                        {formatDate(selectedDeclaration.allotmentDate)}
                      </strong>
                    </span>
                    <span>
                      Total Shareholders:{" "}
                      <strong className="text-foreground">
                        {formatNumber(selectedDeclaration.totalShareholders)}
                      </strong>
                    </span>
                    <span>
                      Total Bonus Shares:{" "}
                      <strong className="text-foreground">
                        {formatNumber(selectedDeclaration.totalBonusShares)}
                      </strong>
                    </span>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {filteredContent.map((entitlement, idx) => (
                  <Card key={entitlement.accountNumber ?? idx} className="mrpsl-card">
                    <div className="p-4 border-b bg-muted/5 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">
                          {entitlement.name || entitlement.shareholderName}
                        </div>
                        <div className="font-mono text-sm text-muted-foreground">
                          {entitlement.accountNumber}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs mrpsl-section-title">
                          Units at Qual Date
                        </div>
                        <div className="font-mono text-xl font-bold">
                          {formatNumber(entitlement.unitsAtQualDate)}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-muted-foreground">
                          Total Bonus Due
                        </div>
                        <div className="text-2xl font-mono text-primary font-bold">
                          {formatNumber(entitlement.bonusDue)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-muted-foreground">
                          Fractional Remainder
                        </div>
                        <div className="text-2xl font-mono text-amber-600">
                          {entitlement.fractionalRemainder?.toFixed(4) ?? "0.0000"}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <PaginationBar
                page={page}
                pageSize={pageSize}
                totalPages={totalPages}
                total={totalElements}
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
