"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { TransferRequest } from "@/types/cscs";
import { useGetAllTransferRequests } from "@/hooks/useCertTransfer";
import { PaginationBar } from "../pagination-bar";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

export const ApprovedTransfers = () => {

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(PAGE_SIZE)

    const { data, isLoading, isError, error, refetch } = useGetAllTransferRequests({
        page: page,
        pageSize: pageSize,
        status: "APPROVED"
    });

    const approvedTransfers = data?.data?.content || []


    if (isLoading) {
        return (
            <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-muted-foreground min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading pending transfer requests...</p>
            </Card>
        );
    }


    return (
        <>
            {
                isError ? (
                    <Card className="mrpsl-card p-12 flex flex-col items-center justify-center text-destructive min-h-[400px]">
                        <p className="font-semibold text-lg mb-2">Failed to load requests</p>
                        <p className="text-sm mb-4">{error?.message || "An unexpected error occurred"}</p>
                        <Button onClick={() => refetch()} variant="outline">Try Again</Button>
                    </Card>) : (
                    <Card className="mrpsl-card overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="mrpsl-table-header">
                                <tr>

                                    <th className="p-3">DATE</th>
                                    <th className="p-3">CERTIFICATE</th>
                                    <th className="p-3">FROM</th>
                                    <th className="p-3">TO</th>
                                    <th className="p-3">UNITS</th>
                                    <th className="p-3">STAMP DUTY</th>
                                    <th className="p-3">SUBMITTED BY</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-[13px]">
                                {approvedTransfers.map((row: TransferRequest) => (
                                    <tr key={row.id} className="mrpsl-table-row">
                                        <td className="p-3 text-muted-foreground">
                                            {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-3 font-mono">{row.sourceCertNumber}</td>
                                        <td className="p-3">
                                            <div className="font-medium">{row.fromHolder}</div>
                                            <div className="font-mono text-muted-foreground text-[13px]">
                                                {row.fromAccount}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium">{row.toHolder}</div>
                                            <div className="font-mono text-muted-foreground text-[13px]">
                                                {row.toAccount}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right tabular-nums font-semibold">
                                            {row.units?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-3 text-right tabular-nums">
                                            ₦{row.stampDuty?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {row.submittedBy}
                                        </td>

                                    </tr>
                                ))}
                                {approvedTransfers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="p-12 text-center text-muted-foreground"
                                        >
                                            No approved transfer requests.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                    </Card>)}
            <PaginationBar
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                total={data?.data?.totalElements || 0}
                pageBase={1}
                totalPages={data?.data?.totalPages}
            />
        </>

    );
};