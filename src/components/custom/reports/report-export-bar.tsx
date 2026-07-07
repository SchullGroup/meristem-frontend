// components/ExportBar.tsx
"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    useRunReportAsync,
} from "@/hooks/useReports";
import type { ReportFilters } from "@/actions/reportActions";
import { formatCustomDate } from "@/utils/helperFunctions";
import { useStore } from "@/lib/store";

export function ExportBar({
    total,
    availableFormats,
    reportCode,
    filters,
    onPrint
}: {
    total: number;
    availableFormats: string[];
    reportCode: string;
    filters: ReportFilters;
    onPrint: () => void;
}) {
    const [exportingExcel, setExportingExcel] = useState(false);
    const addJob = useStore((s) => s.addJob);

    const runExportMutation = useRunReportAsync({
        onSuccess: (response) => {
            addJob({
                id: response.data.jobId,
                type: "reports",
                route: "",
                status: "PENDING",
                startedAt: Date.now(),
            });
            toast.info("Export queued – you’ll be notified when it’s ready.");
            setExportingExcel(false);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to start Excel export");
            setExportingExcel(false);
        },
    });

    const handleExcel = () => {
        if (exportingExcel) return;
        setExportingExcel(true);
        runExportMutation.mutate({
            reportCode,
            filters,
            format: "XLSX",
        });
    };

    return (
        <div className="flex justify-between items-center bg-muted/30 px-5 py-3 border rounded-t-xl mb-[-1px] z-10 relative">
            <span className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                    {total.toLocaleString()}
                </span>{" "}
                record{total !== 1 ? "s" : ""} &mdash; {formatCustomDate(new Date().toLocaleString())}
            </span>
            <div className="flex gap-2">
                {availableFormats.includes("XLSX") && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={exportingExcel}
                        onClick={handleExcel}
                    >
                        {exportingExcel ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                        )}
                        Excel
                    </Button>
                )}
                {availableFormats.includes("PDF") && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info("PDF generation is on its way")}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                )}
                {availableFormats.includes("PRINT") && <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrint}
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>}
            </div>
        </div>
    );
}