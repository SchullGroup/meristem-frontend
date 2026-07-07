"use client"
// pages/ReportsPage.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, ChevronRight } from "lucide-react";
import { useGetReportMetadata, useRunReport } from "@/hooks/useReports";
import { ReportsSidebar } from "@/components/custom/reports/report-sidebar";
import { ReportFilters } from "@/components/custom/reports/report-filters";
import { ReportTable } from "@/components/custom/reports/report-table";

const buildCleanedFilters = (filterValues: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(filterValues)) {
    // Skip empty strings and the special "all" value
    if (val === "" || val === "all") continue;
    // For boolean fields, you might need to keep "false", but "true"/"false" are fine
    // We'll keep anything that is not empty/undefined/null/"all"
    if (val !== undefined && val !== null) {
      cleaned[key] = val;
    }
  }
  return cleaned;
};

export default function ReportsPage() {
  // ─── state ─────────────────────────────────────────────
  const [selectedReportCode, setSelectedReportCode] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);

  // ─── data fetching 
  const { data: meta } = useGetReportMetadata(selectedReportCode ?? "", {
    enabled: !!selectedReportCode,
  });

  // ─── reset when report changes 

  useEffect(() => {
    //eslint-disable-next-line
    setFilterValues({});
    setPage(0);
    setSize(20);
    setTableData([]);
    setTotalElements(0);
    setIsGenerated(false);
  }, [selectedReportCode]);


  // ─── run report mutation (sync) ────────────────────────
  const runReportMutation = useRunReport({
    onSuccess: (response) => {
      const payload = response.data;
      setTableData(payload.rows ?? []);
      setTotalElements(payload.totalRecords ?? 0);
      setIsGenerated(true);
    },
  });

  const handleRun = () => {
    if (!selectedReportCode) return;
    const cleanedFilters = buildCleanedFilters(filterValues);

    runReportMutation.mutate({
      reportCode: selectedReportCode,
      filters: cleanedFilters,
      format: "JSON",
      page,
      size,
    });
  };

  // ─── derived data ──────────────────────────────────────
  const reportDefinition = meta?.data;
  const availableFormats = reportDefinition?.availableFormats ?? [];

  console.log(selectedReportCode)
  // ─── UI ────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-3.5rem-1px)] -m-6">
      {/* LEFT SIDEBAR */}
      <ReportsSidebar
        selectedReportCode={selectedReportCode}
        onSelectReport={(code: any) => setSelectedReportCode(code)}
      />

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
        {!selectedReportCode ? (
          <EmptyState
            icon={<BarChart3 className="h-16 w-16 opacity-15" />}
            title="Select a report from the left panel."
            subtitle="Configure filters and generate your report."
          />
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Breadcrumb + title */}
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                <span>{reportDefinition?.category ?? "..."}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {reportDefinition?.name ?? "Loading..."}
              </h2>
            </div>

            {/* Filter Card */}
            {reportDefinition?.filterSchema && (
              <Card className="mrpsl-card p-5">
                <ReportFilters
                  schema={reportDefinition.filterSchema}
                  filterValues={filterValues}
                  onFilterChange={(field, value) =>
                    setFilterValues((prev) => ({ ...prev, [field]: value }))
                  }
                  onRun={handleRun}
                  isRunning={runReportMutation.isPending}
                />
              </Card>
            )}

            {/* Report Table (includes ExportBar & Pagination) */}
            {reportDefinition?.columns && (
              <ReportTable
                columns={reportDefinition.columns}
                rows={tableData}
                total={totalElements}
                page={page}
                pageSize={size}
                onPageChange={(p) => {
                  setPage(p);
                  handleRun(); // re-run with new page
                }}
                onPageSizeChange={(s) => {
                  setSize(s);
                  setPage(0);
                  handleRun();
                }}
                isLoading={runReportMutation.isPending}
                error={runReportMutation.error as Error | null}
                isGenerated={isGenerated}
                // export props
                availableFormats={availableFormats}
                reportCode={selectedReportCode!}
                filters={filterValues}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Small helper
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      {icon}
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="text-sm mt-1">{subtitle}</p>
    </div>
  );
}