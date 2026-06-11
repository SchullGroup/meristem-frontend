"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PaginationBar } from "@/components/custom/pagination-bar";
import {
    ShareholderAccount,
} from "@/types/account-maintenance";
import {

    useGetAccountKycHistory,
} from "@/hooks/useAccountMaintenance";
import { EntitlementTableSkeleton } from "@/components/custom/rights-issue/loaders";
import { DataErrorState } from "@/components/custom/ipo/loaders";
import { formatDate } from "@/lib/utils/format";
import StatusBadge from "../status-badge";


export default function KYCHistory({ tab, selectedShareholder }: { tab: string, selectedShareholder: ShareholderAccount | null }) {
    // ── Pagination state for pending & history ──
    const [pendingPage, setPendingPage] = useState(0);
    const [pendingPageSize, setPendingPageSize] = useState(10);
    const [historyPage, setHistoryPage] = useState(0);
    const [historyPageSize, setHistoryPageSize] = useState(10);


    // ── KYC history ──
    const {
        data: historyData,
        isLoading: isHistoryLoading,
        isError: isHistoryError,
        refetch: refetchHistory,
    } = useGetAccountKycHistory(
        selectedShareholder?.accountNumber ?? "",
        { page: historyPage, pageSize: historyPageSize },
        { enabled: !!selectedShareholder && tab === "history" }
    );

    const historyChanges = historyData?.data?.data || [];
    const historyTotal = historyData?.data?.total || 0;
    const historyTotalPages = historyData?.data?.totalPages || 0;

    if (isHistoryLoading) {
        return <EntitlementTableSkeleton />
    }

    return (<>
        <Card className="mrpsl-card overflow-hidden">
            {isHistoryError ? (
                <DataErrorState
                    message="Failed to load audit history."
                    onRetry={refetchHistory}
                />
            ) : (<table className="w-full text-left text-sm">
                <thead className="mrpsl-table-header">
                    <tr>
                        <th className="p-3">DATE</th>
                        <th className="p-3">FIELD CHANGED</th>
                        <th className="p-3">OLD VALUE</th>
                        <th className="p-3">NEW VALUE</th>
                        <th className="p-3">CHANGED BY</th>
                        <th className="p-3">AUTHORISED BY</th>
                        <th className="p-3">STATUS</th>
                    </tr>
                </thead>
                <tbody className="divide-y text-[13px]">
                    {historyChanges.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="p-8 text-center text-muted-foreground"
                            >
                                No history found for this account
                            </td>
                        </tr>
                    ) : (
                        historyChanges.map((row) => (
                            <tr key={row.id} className="mrpsl-table-row">
                                <td className="p-3 text-muted-foreground">
                                    {formatDate(row.createdAt)}
                                </td>
                                <td className="p-3 font-medium">{row.fieldChanged}</td>
                                <td className="p-3 text-muted-foreground font-mono">
                                    {row.oldValue || "—"}
                                </td>
                                <td className="p-3 font-mono text-primary">
                                    {row.newValue}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                    {row.initiatorName}
                                </td>
                                <td className="p-3 text-muted-foreground">
                                    {row.authorisedBy || "—"}
                                </td>
                                <td className="p-3"><StatusBadge status={row.status} /></td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            )} </Card>
        <PaginationBar
            page={historyPage}
            total={historyTotal}
            totalPages={historyTotalPages}
            pageSize={historyPageSize}
            onPageChange={setHistoryPage}
            onPageSizeChange={(s) => {
                setHistoryPageSize(s);
                setHistoryPage(0);
            }}
        />
    </>)
}
