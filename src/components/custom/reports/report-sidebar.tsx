// ReportsSidebar.tsx
"use client"
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetReportCatalogue } from "@/hooks/useReports"; // adjust path
import type { ReportCategory } from "@/actions/reportActions";

interface ReportsSidebarProps {
    selectedReportCode: string | null;
    onSelectReport: (code: string) => void;
}

export function ReportsSidebar({ selectedReportCode, onSelectReport }: ReportsSidebarProps) {
    const [search, setSearch] = useState("");

    const { data: catalogueData, isLoading, isError, error } = useGetReportCatalogue();


    // Filter categories based on search term
    const filteredCategories = useMemo(() => {
        const categories: ReportCategory[] = catalogueData?.data?.categories ?? [];


        if (!search.trim()) return categories;

        const term = search.toLowerCase();
        return categories
            .map((cat) => ({
                ...cat,
                reports: cat.reports.filter((r) =>
                    r.name.toLowerCase().includes(term)
                ),
            }))
            .filter((cat) => cat.reports.length > 0);
    }, [catalogueData, search]);

    return (
        <div className="w-64 border-r bg-background overflow-y-auto flex flex-col shrink-0">
            {/* Sticky header */}
            <div className="px-4 py-3 border-b sticky top-0 bg-background/95 backdrop-blur z-10 space-y-2">
                <div className="font-bold tracking-tight text-sm">
                    Report Categories
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search reports…"
                        className="pl-8 h-8 text-sm"
                    />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 py-2">
                {isLoading && <SidebarSkeleton />}

                {isError && (
                    <div className="px-4 py-8 text-center text-sm text-destructive">
                        <p>Failed to load reports.</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                            {error?.message ?? "Unknown error"}
                        </p>
                    </div>
                )}

                {!isLoading && !isError && (
                    <>
                        {filteredCategories.map((group) => (
                            <div key={group.code} className="mb-3">
                                <div className="px-4 py-1.5 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {group.label}
                                </div>
                                <div className="space-y-0.5">
                                    {group.reports.map((report) => (
                                        <button
                                            key={report.code}
                                            onClick={() => {
                                                onSelectReport(report.code);
                                                setSearch(""); // optional: clear search on select
                                            }}
                                            className={`w-full text-left px-4 py-2 flex items-center text-sm transition-colors ${selectedReportCode === report.code
                                                ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                }`}
                                        >
                                            <span className="truncate pr-2">{report.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredCategories.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No reports match your search.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Skeleton loader matching the category layout
function SidebarSkeleton() {
    // Simulate ~3 categories with 3‑5 items each
    return (
        <div className="space-y-4 px-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20 ml-2" />
                    {[...Array(20)].map((_, j) => (
                        <Skeleton key={j} className="h-8 w-full rounded-md" />
                    ))}
                </div>
            ))}
        </div>
    );
}