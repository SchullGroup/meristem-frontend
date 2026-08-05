"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Merge, Scissors, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TablePagination } from "@/components/custom/table-pagination";
import { CertificateQueryBuilder } from "@/components/custom/certificate-query-builder";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGetRegisters } from "@/hooks/useRegisters";
import { searchCertificatesAdvanced } from "@/actions/enquiryActions";
import type { CertificateSearchCriteria } from "@/types/enquiry";
import { Skeleton } from "@/components/ui/skeleton";

type AppliedCriteria = Omit<CertificateSearchCriteria, "page" | "size" | "sort">;

export default function CertificateEnquiryPage() {
  const router = useRouter();

  const [applied, setApplied] = useState<AppliedCriteria | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: registersData } = useGetRegisters({ size: 100 });
  const registers = useMemo(
    () =>
      (registersData?.content ?? [])
        .filter((r) => r.status === "ACTIVE")
        .map((r) => ({ symbol: r.symbol, registerName: r.registerName })),
    [registersData],
  );

  const criteria = useMemo<CertificateSearchCriteria | null>(
    () => (applied ? { ...applied, page, size: pageSize, sort: "createdAt,desc" } : null),
    [applied, page, pageSize],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["certificate-search", criteria],
    queryFn: () => searchCertificatesAdvanced(criteria!),
    enabled: !!criteria,
  });
  const certificates = data?.content ?? [];

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load certificates.");
    }
  }, [error]);

  function applySearch(next: AppliedCriteria) {
    setApplied(next);
    setPage(0);
  }
  function clearSearch() {
    setApplied(null);
    setPage(0);
  }

  const total = data?.totalElements ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Certificate Enquiry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build a query to search physical certificates, then verify, amalgamate, split or transfer them.
        </p>
      </div>

      <CertificateQueryBuilder
        registers={registers}
        onSearch={applySearch}
        onClear={clearSearch}
        loading={isLoading}
      />

      {applied && (
        <Card className="mrpsl-card animate-in fade-in">
          <TooltipProvider delay={2000}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                  <tr>
                    <th className="p-3">CERTIFICATE NO</th>
                    <th className="p-3">ACCOUNT NO</th>
                    <th className="p-3">HOLDER NAME</th>
                    <th className="p-3">DATE ISSUED</th>
                    <th className="p-3 text-right">UNITS</th>
                    <th className="p-3 text-center">ACTIVE</th>
                    <th className="p-3" colSpan={4}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[13px]">
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <tr key={i}>
                        <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-36" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                        <td className="p-3"><Skeleton className="h-7 w-7 mx-auto rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-7 w-7 mx-auto rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-7 w-7 mx-auto rounded-md" /></td>
                        <td className="p-3"><Skeleton className="h-7 w-7 mx-auto rounded-md" /></td>
                      </tr>
                    ))
                  ) : certificates.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-12 text-center text-muted-foreground font-sans">
                        No certificates match the current query.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((cert) => (
                      <tr key={cert.certificateNo} className="hover:bg-accent/5">
                        <td className="p-3 text-primary font-bold">{cert.certificateNo}</td>
                        <td className="p-3">{cert.accountNo}</td>
                        <td className="p-3 font-sans font-medium">{cert.holderName}</td>
                        <td className="p-3 font-sans text-muted-foreground text-[13px]">{cert.dateIssued}</td>
                        <td className="p-3 text-right font-bold text-sm">
                          {(cert.units ?? 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant="outline"
                            className={
                              cert.status === "ACTIVE"
                                ? "bg-green-50 text-green-700 border-green-200 text-[13px]"
                                : "bg-gray-100 text-gray-600 border-gray-200 text-[13px]"
                            }
                          >
                            {cert.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={cert.status !== "ACTIVE"}
                                  className="cursor-pointer"
                                  onClick={() => router.push(`/certificates/dematerialisation`)}
                                >
                                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              }
                            />
                            <TooltipContent>
                              Verify this certificate before issuing a replacement
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={cert.status !== "ACTIVE"}
                                  className="cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/certificates/consolidation?register=${encodeURIComponent(
                                        cert.registerSymbol,
                                      )}&accountNo=${encodeURIComponent(cert.accountNo)}`,
                                    )
                                  }
                                >
                                  <Merge className="h-4 w-4 text-blue-600" />
                                </Button>
                              }
                            />
                            <TooltipContent>
                              Amalgamate — combine multiple certificates into one
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={cert.status !== "ACTIVE"}
                                  className="cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/certificates/split?search=${encodeURIComponent(cert.holderName)}`,
                                    )
                                  }
                                >
                                  <Scissors className="h-4 w-4 text-amber-600" />
                                </Button>
                              }
                            />
                            <TooltipContent>Split this certificate into smaller holdings</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="p-3 text-center">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={cert.status !== "ACTIVE"}
                                  className="cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/certificates/transfer?register=${encodeURIComponent(
                                        cert.registerSymbol,
                                      )}&src=${encodeURIComponent(cert.holderName)}`,
                                    )
                                  }
                                >
                                  <ArrowRight className="h-4 w-4 text-purple-600" />
                                </Button>
                              }
                            />
                            <TooltipContent>Transfer this certificate to another holder</TooltipContent>
                          </Tooltip>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {data && (
              <div className="px-4 py-2 border-t">
                <TablePagination
                  page={page + 1}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  from={total === 0 ? 0 : page * pageSize + 1}
                  to={Math.min((page + 1) * pageSize, total)}
                  total={total}
                  onPageChange={(p) => setPage(p - 1)}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setPage(0);
                  }}
                />
              </div>
            )}
          </TooltipProvider>
        </Card>
      )}
    </div>
  );
}
