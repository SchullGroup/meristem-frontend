// components/ReportTable.tsx
"use client"
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportColumn, ReportFilters } from "@/actions/reportActions";
import { AlertCircle, BarChart3 } from "lucide-react";
import { PaginationBar } from "../pagination-bar";
import { ExportBar } from "./report-export-bar";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

interface ReportTableProps {
    columns: ReportColumn[];
    rows: Record<string, unknown>[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    isLoading: boolean;
    error: Error | null;
    isGenerated: boolean; // true after first run

    reportCode: string;
    filters: ReportFilters;
    availableFormats: string[];
}

// Helper to format a cell based on column type
function formatCellValue(value: unknown, type: string): string {
    if (value == null) return "—";
    switch (type) {
        case "number":
            return Number(value).toLocaleString();
        case "currency":
            return `₦${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case "date":
            return new Date(value as string).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        case "datetime":
            return new Date(value as string).toLocaleString("en-GB");
        default:
            return String(value);
    }
}

function renderCell(value: unknown, type: string, align: string) {
    if (type === "badge") {
        const val = String(value).toUpperCase();
        // Simple color logic – can be extended
        const variant =
            val === "ACTIVE" || val === "PAID" || val === "COMPLETED"
                ? "success"
                : val === "DRAFT" || val === "PENDING"
                    ? "outline"
                    : "secondary";
        return (
            <Badge variant={variant as any} className="text-[13px] font-normal">
                {val}
            </Badge>
        );
    }
    // Text alignment
    const alignClass =
        align === "right"
            ? "text-right"
            : align === "center"
                ? "text-center"
                : "text-left";
    return (
        <span className={`${alignClass} ${type === "number" || type === "currency" ? "font-mono" : ""}`}>
            {formatCellValue(value, type)}
        </span>
    );
}

export function ReportTable({
    columns,
    rows,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    isLoading,
    error,
    isGenerated,
    reportCode,
    filters,
    availableFormats,
}: ReportTableProps) {

    //print logic
    const printContentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printContentRef,
        documentTitle: `${reportCode} - Report`,
        onPrintError: (error) => console.error(error),
    });


    // If the report hasn't been run yet, show the prompt
    if (!isGenerated) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground animate-in fade-in">
                <BarChart3 className="h-14 w-14 mb-4 opacity-15" />
                <h3 className="font-semibold text-base text-foreground mb-1">
                    Ready to generate
                </h3>
                <p className="text-sm">
                    Set your filters above and click{" "}
                    <span className="font-medium text-foreground">Run Report</span>.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center text-destructive animate-in fade-in">
                <AlertCircle className="h-14 w-14 mb-4 opacity-50" />
                <h3 className="font-semibold text-base">Failed to load report</h3>
                <p className="text-sm mt-1">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
            <ExportBar
                total={total}
                availableFormats={availableFormats}
                reportCode={reportCode}
                filters={filters}
                onPrint={handlePrint}
            />

            <Card className="mrpsl-card rounded-t-none overflow-hidden">
                {isLoading ? (
                    <TableSkeleton columns={columns.length} rows={pageSize} />
                )
                    : (
                        <div ref={printContentRef} className="overflow-x-auto printable-table">
                            <table className="w-full text-left text-sm">
                                <thead className="mrpsl-table-header">
                                    <tr>
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                className={`px-5 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                                                style={{ width: col.width ? `${col.width}px` : undefined }}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-[13px]">
                                    {rows && rows?.length > 0 ? rows.map((row, idx) => (
                                        <tr key={idx} className="mrpsl-table-row">
                                            {columns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={`px-5 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                                                >
                                                    {renderCell(row[col.key], col.type, col.align)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                        : <tr><td colSpan={columns.length}>
                                            <div className="px-5 py-12 text-center text-muted-foreground text-sm">
                                                No records found for the selected filters.
                                            </div></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
            </Card>

            {/* Pagination: only show if there are records and total > page size */}
            {!isLoading && (
                <div className="mt-4">
                    <PaginationBar
                        page={page}
                        total={total}
                        onPageChange={onPageChange}
                        pageSize={pageSize}
                        onPageSizeChange={onPageSizeChange}
                        pageBase={0}
                    />
                </div>
            )}
        </div>
    );
}

// Skeleton for loading state
function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
    return (
        <div className="space-y-0">
            {/* Header skeleton */}
            <div className="flex px-5 py-3 bg-muted/50 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1 mr-4 last:mr-0" />
                ))}
            </div>
            {/* Row skeletons */}
            {Array.from({ length: Math.min(rows, 10) }).map((_, r) => (
                <div key={r} className="flex px-5 py-3 border-b">
                    {Array.from({ length: columns }).map((_, c) => (
                        <Skeleton key={c} className="h-4 flex-1 mr-4 last:mr-0" />
                    ))}
                </div>
            ))}
        </div>
    );
}