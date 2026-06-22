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
import { useGetWarrants } from "@/hooks/useEnquiry";
import { WarrantPaymentType } from "@/types/enquiry";
import { useGetRegisters } from "@/hooks/useRegisters";
import { formatNaira, formatNumber } from "@/lib/utils/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaginationBar } from "@/components/custom/pagination-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function WarrantEnquiryPage() {
  const [showResults, setShowResults] = useState(false);
  const [type, setType] = useState<WarrantPaymentType | "">("");
  const [warrantNo, setWarrantNo] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [registerSymbol, setRegisterSymbol] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [searchParams, setSearchParams] = useState<{
    paymentType?: WarrantPaymentType;
    warrantNo?: string;
    accountNo?: string;
    registerSymbol?: string;
  }>({});

  const { data: registersData, isLoading: isLoadingRegisters } =
    useGetRegisters({ size: 100, status: "ACTIVE" });

  const { data, isLoading, isError, error } = useGetWarrants(
    {
      paymentType: searchParams.paymentType || "DIVIDEND_WARRANT",
      warrantNo: searchParams.warrantNo,
      accountNo: searchParams.accountNo,
      page: page,
      size: pageSize,
      registerSymbol: searchParams.registerSymbol,
    },
    {
      enabled: showResults && !!searchParams.paymentType,
    },
  );

  const handleSearch = () => {
    if (!type) {
      toast.error("Please select a payment type");
      return;
    }

    setSearchParams({
      paymentType: type,
      warrantNo: warrantNo.trim() || undefined,
      accountNo: accountNo.trim() || undefined,
      registerSymbol: registerSymbol || undefined,
    });
    setPage(0);
    setShowResults(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const hasParams =
    !!registerSymbol && (!!warrantNo.trim() || !!accountNo.trim());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warrant Enquiry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-register search for dividend, interest, and return money
            warrants
          </p>
        </div>
      </div>

      <Card className="mrpsl-card p-5 space-y-4">
        <div className="space-y-2">
          <label className="mrpsl-label">Payment Type *</label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v as WarrantPaymentType);
              setWarrantNo("");
              setAccountNo("");
              setRegisterSymbol("");
              setSearchParams({});
              setShowResults(false);
            }}
          >
            <SelectTrigger className="mrpsl-input max-w-xl">
              <SelectValue placeholder="Select payment type to search..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DIVIDEND_WARRRANT">
                Dividend Warrant
              </SelectItem>
              <SelectItem value="INTEREST_WARRRANT">
                Interest Warrant
              </SelectItem>
              <SelectItem value="APPLICATION_RETURN_MONEY">
                Application Return Money
              </SelectItem>
              <SelectItem value="RIGHTS_RETURN_MONEY">
                Rights Return Money
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type && (
          <div className="flex gap-4 items-end animate-in fade-in flex-wrap">
            <div className="">
              <label className="mrpsl-label">Register</label>
              <Select
                value={registerSymbol || "all"}
                onValueChange={(v) =>
                  setRegisterSymbol(v === "all" ? "" : (v ?? ""))
                }
              >
                <SelectTrigger className="mrpsl-input w-48">
                  <SelectValue placeholder="All Registers" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingRegisters ? (
                    <div className="py-10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <SelectItem value="all">All Registers</SelectItem>
                      {registersData?.content?.map((reg) => (
                        <SelectItem key={reg.registerId} value={reg.symbol}>
                          <span className="font-bold">{reg.registerName}</span>{" "}
                          <span className="text-sm text-muted-foreground">
                            {reg.symbol}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm font-bold text-muted-foreground mb-3">
              |
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Warrant No</label>
              <Input
                className="mrpsl-input w-48"
                value={warrantNo}
                onChange={(e) => setWarrantNo(e.target.value)}
                placeholder="e.g. WRT-00123"
              />
            </div>
            <div className="text-sm font-bold text-muted-foreground mb-3">
              OR
            </div>
            <div className="space-y-2">
              <label className="mrpsl-label">Account No</label>
              <Input
                className="mrpsl-input w-48"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="e.g. 10029"
              />
            </div>
            <Button
              size="lg"
              className="h-10 px-8"
              onClick={handleSearch}
              disabled={isLoading || !hasParams}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        )}
      </Card>

      {showResults && (
        <div className="space-y-4">
          {isLoading && (
            <Card className="mrpsl-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="mrpsl-table-header">
                    <tr>
                      <th className="p-3">REGISTER</th>
                      <th className="p-3">ACCOUNT NAME</th>
                      <th className="p-3">WARRANT NO</th>
                      <th className="p-3">PAY NUMBER</th>
                      <th className="p-3 text-right">HOLDINGS</th>
                      <th className="p-3 text-right">RATE PAID</th>
                      <th className="p-3 text-right">GROSS AMOUNT</th>
                      <th className="p-3 text-right">TAX AMOUNT</th>
                      <th className="p-3 text-right">NET AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.from({ length: pageSize }).map((_, i) => (
                      <tr key={i}>
                        <td className="p-3">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="p-3 flex justify-end">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Search Failed</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "An unexpected error occurred while fetching warrants."}
              </AlertDescription>
            </Alert>
          )}

          {!isLoading &&
            !isError &&
            (!data?.content || data.content.length === 0) && (
              <div className="flex flex-col items-center justify-center p-12 bg-background rounded-lg border mrpsl-card text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-bold text-lg">No Warrants Found</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                  We couldn&apos;t find any warrant records matching the query
                  parameters provided. Please check your inputs and try again.
                </p>
              </div>
            )}

          {!isLoading && !isError && data && data.content.length > 0 && (
            <div className="space-y-4">
              <Card className="mrpsl-card animate-in fade-in overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="mrpsl-table-header">
                      <tr>
                        <th className="p-3">REGISTER</th>
                        <th className="p-3">ACCOUNT NAME</th>
                        <th className="p-3">WARRANT NO</th>
                        <th className="p-3">PAY NUMBER</th>
                        <th className="p-3 text-right">HOLDINGS</th>
                        <th className="p-3 text-right">RATE PAID</th>
                        <th className="p-3 text-right">GROSS AMOUNT</th>
                        <th className="p-3 text-right">TAX AMOUNT</th>
                        <th className="p-3 text-right">NET AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-[13px]">
                      {data.content.map((warrant) => (
                        <tr
                          key={warrant?.warrantNo}
                          className="hover:bg-accent/5"
                        >
                          <td className="p-3 font-sans font-medium text-primary">
                            {warrant?.register}
                          </td>
                          <td className="p-3 font-sans font-medium">
                            {warrant?.accountName}
                          </td>
                          <td className="p-3 font-bold">
                            {warrant?.warrantNo}
                          </td>
                          <td className="p-3 text-muted-foreground text-[13px]">
                            {warrant?.payNumber}
                          </td>
                          <td className="p-3 text-right">
                            {formatNumber(warrant?.holdings)}
                          </td>
                          <td className="p-3 text-right">
                            ₦{warrant?.ratePaid?.toFixed(4) || 0}
                          </td>
                          <td className="p-3 text-right">
                            {formatNaira(warrant?.grossAmount)}
                          </td>
                          <td className="p-3 text-right text-amber-600">
                            {formatNaira(warrant?.taxAmount)}
                          </td>
                          <td className="p-3 text-right font-bold text-green-600 text-sm">
                            {formatNaira(warrant?.netAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <PaginationBar
                page={page}
                pageSize={pageSize}
                totalPages={data.totalPages || 1}
                total={data.totalElements || 0}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
