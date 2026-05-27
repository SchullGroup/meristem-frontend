"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { CertificateConsolidation } from "@/types/cscs";
import { PaginationBar } from "../pagination-bar";
import { Loader2 } from "lucide-react";
import { useGetAllCertConsolidations } from "@/hooks/useCertConsolidation";
import { formatDate } from "@/lib/utils/format";

const PAGE_SIZE = 10;

export const ApprovedConsolidations = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const { data, isLoading, isError, error, refetch } =
    useGetAllCertConsolidations({
      page: page,
      pageSize: pageSize,
      status: "APPROVED",
    });

  const approvedConsolidations = data?.data?.content || [];

  if (isLoading) {
    return (
      <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-muted-foreground min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading approved consolidations...</p>
      </Card>
    );
  }

  return (
    <>
      {isError ? (
        <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-destructive min-h-[400px]">
          <p className="font-semibold text-lg mb-2">Failed to load requests</p>
          <p className="text-sm mb-4">
            {error?.message || "An unexpected error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </Card>
      ) : (
        <Card className="mrpsl-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="mrpsl-table-header">
              <tr>
                <th className="p-3">DATE</th>
                <th className="p-3">ACCOUNT</th>
                <th className="p-3">HOLDER</th>
                <th className="p-3">CERTIFICATES</th>
                <th className="p-3">TOTAL UNITS</th>
                <th className="p-3">SUBMITTED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y text-[13px]">
              {approvedConsolidations.map((row: CertificateConsolidation) => (
                <tr key={row.id} className="mrpsl-table-row">
                  <td className="p-3 text-muted-foreground">
                    {formatDate(row.submittedAt)}
                  </td>
                  <td className="p-3 font-mono">{row.accountNumber}</td>
                  <td className="p-3 font-medium">{row.holderName}</td>
                  <td className="p-3 text-left tabular-nums">
                    {row.certCount} certs
                  </td>
                  <td className="p-3 text-left tabular-nums font-semibold">
                    {row.totalUnits.toLocaleString()}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {row.submittedBy}
                  </td>
                </tr>
              ))}
              {approvedConsolidations.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-muted-foreground"
                  >
                    No approved consolidations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <PaginationBar
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        total={data?.data?.totalElements || 0}
        totalPages={data?.data?.totalPages}
        pageBase={1}
      />
    </>
  );
};
