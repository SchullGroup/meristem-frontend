"use client";

import { useState, useMemo } from "react";
import {
    CheckCircle,
    Loader2,
    Check,
    Search,
    MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { NIGERIA_STATE_NAMES } from "@/lib/mocks/nigeria-geo";
import {
    useGetHolders,
    useUpdateHolderStates,
} from "@/hooks/useCscs";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationBar } from "../pagination-bar";
import { ErrorLike, returnErrorMessage } from "@/utils/errorManager";
import { DataErrorState, PendingListSkeleton } from "../ipo/loaders";

interface PreviewHoldersProps {
    batchRef: string;
    onComplete: () => void; // triggers tab switch to "queue"
    isActive: boolean;
}

export function PreviewHolders({
    batchRef,
    isActive,
    onComplete,
}: PreviewHoldersProps) {
    // ── Local states ------──────────────
    const [registerFilter, setRegisterFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [confirmedStates, setConfirmedStates] = useState<Record<string, string>>({});

    const debouncedSearch = useDebounce(search, 500);

    // ── Queries ------──────────────────
    const { data: activeRegisters, isLoading: loadingRegisters } = useGetRegisters({
        size: 100,
        status: 'ACTIVE',
    }, {
        enabled: isActive
    });

    const { mutateAsync: updateHolderStates, isPending: isCommitting } =
        useUpdateHolderStates();

    const getSearchParams = (searchStr: string) => {
        if (!searchStr) return {};
        const trimmed = searchStr.trim();
        if (trimmed.includes('@')) return { email: trimmed };
        if (/^[cC]\d+/.test(trimmed) || (trimmed.length > 5 && !trimmed.includes(' '))) {
            return { chn: trimmed };
        }
        return { name: trimmed };
    };

    const {
        data: holdersData,
        isLoading,
        error,
        isError,
        refetch
    } = useGetHolders(
        {
            batchRef,
            registerId: registerFilter !== '' ? registerFilter : undefined,
            page: currentPage,
            size: pageSize,
            ...getSearchParams(debouncedSearch),
        },
        {
            enabled: !!batchRef && isActive,
            refetchOnWindowFocus: false,
        }
    );

    // ── Derived data ------─────────────
    const filteredHolders = useMemo(() => {
        if (!holdersData?.content) return [];
        return holdersData.content.filter((h) => {
            const isConfirmed = confirmedStates[h.id] !== undefined;
            const isUnknownState = !h.state || h.state.toUpperCase() === 'UNKNOWN';
            if (statusFilter === 'Confirmed') return isConfirmed;
            if (statusFilter === 'Unconfirmed') return !isConfirmed;
            if (statusFilter === 'Unknown') return isUnknownState;
            return true;
        });
    }, [holdersData, confirmedStates, statusFilter]);

    const totalConfirmed = useMemo(() => {
        if (!holdersData?.content) return 0;
        return holdersData.content.filter((h) => confirmedStates[h.id] !== undefined).length;
    }, [holdersData, confirmedStates]);

    const totalUnconfirmed = useMemo(() => {
        if (!holdersData?.content) return 0;
        return holdersData.content.length - totalConfirmed;
    }, [holdersData, totalConfirmed]);

    // ── Actions ------──────────────────
    const confirmState = (id: string, state: string) => {
        setConfirmedStates((prev) => ({ ...prev, [id]: state }));
    };

    const confirmAllVisible = () => {
        if (!holdersData?.content) return;
        const newConfirmed = { ...confirmedStates };
        holdersData.content.forEach((h) => {
            newConfirmed[h.id] = h.state || 'Lagos';
        });
        setConfirmedStates(newConfirmed);
        toast.success('Accepted all visible GIS suggestions.');
    };

    const handleCommit = async () => {
        if (!holdersData?.content || holdersData.content.length === 0) {
            toast.error('No records found on this page to commit.');
            return;
        }

        const updates = holdersData.content.map((h) => ({
            id: h.id,
            state: confirmedStates[h.id] || h.state || 'Lagos',
        }));

        try {
            await updateHolderStates({ updates });
            toast.success(`Successfully committed updates for Page ${currentPage + 1}.`);

            // Clear confirmed states for this page
            setConfirmedStates((prev) => {
                const remaining = { ...prev };
                holdersData.content.forEach((h) => delete remaining[h.id]);
                return remaining;
            });

            const totalPages = holdersData.totalPages || 1;
            if (currentPage < totalPages - 1) {
                setCurrentPage((prev) => prev + 1);
            } else {
                // All pages done
                onComplete();
            }
        } catch (err) {
            const errorMessage = returnErrorMessage(err as ErrorLike);
            toast.error(errorMessage || 'Failed to commit updates');
        }
    };

    const handlePageChange = (newPage: number) => setCurrentPage(newPage);
    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(0);
    };

    return (
        <div className="space-y-4">

            {/* Action bar */}
            {!isLoading && <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-blue-900">
                    <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                        <strong>
                            {totalUnconfirmed} record{totalUnconfirmed !== 1 ? "s" : ""}
                        </strong>{" "}
                        need state confirmation for tax jurisdiction. GIS has pre-filled
                        detected states — review and confirm or override each one.
                    </span>
                </div>
                <div className="flex items-center gap-2"></div>
                <Button
                    size="sm"
                    onClick={handleCommit}
                    disabled={isCommitting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isCommitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                            Saving Page {currentPage + 1}...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4 mr-1.5" />
                            Save &amp; Commit Page {currentPage + 1}
                        </>
                    )}
                </Button>
            </div>}

            {/* Filters */}
            <div className="flex gap-2 items-center flex-wrap">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search holder, CHN, account…"
                        className="pl-9 mrpsl-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    value={registerFilter}
                    onValueChange={(v) => {
                        setRegisterFilter(v || "All");
                        setCurrentPage(0);
                    }}
                >
                    <SelectTrigger className="w-44 mrpsl-input">
                        <SelectValue placeholder="All Registers" />
                    </SelectTrigger>
                    <SelectContent>
                        {loadingRegisters ? (
                            <div className="py-10 flex items-center justify-center">
                                <Loader2 className="animate-spin w-4 h-4" />
                            </div>
                        ) : (
                            <>
                                <SelectItem value="All">All Registers</SelectItem>
                                {activeRegisters?.content?.map((r) => (
                                    <SelectItem key={r.registerId} value={r.symbol}>
                                        <span className="font-bold">{r.registerName}</span>{" "}
                                        -{" "}
                                        <span className="text-xs translate-y-0.5">{r.symbol}</span>
                                    </SelectItem>
                                ))}
                            </>
                        )}
                    </SelectContent>
                </Select>
                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v || "")}
                >
                    <SelectTrigger className="w-40 mrpsl-input">
                        <SelectValue placeholder="GIS State Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">GIS State Status</SelectItem>
                        <SelectItem value="Unconfirmed">Unconfirmed</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[13px] text-muted-foreground">
                        <span className="text-primary font-semibold">
                            {totalConfirmed}
                        </span>{" "}
                        / {holdersData?.content?.length || 0} confirmed
                    </span>
                    {filteredHolders.some(
                        (h) => confirmedStates[h.id] === undefined,
                    ) && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-[13px]"
                                onClick={confirmAllVisible}
                            >
                                Accept all GIS suggestions (visible)
                            </Button>
                        )}
                </div>
            </div>

            {/* PRO-TIP WORKFLOW CALLOUT */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="font-semibold text-emerald-900 mb-1">
                    💡 Recommended Workflow for Large Batches
                </p>

                <p className="text-[13px] text-emerald-800">
                    Increase <strong>Page Size</strong>, filter by{" "}
                    <strong>Unknown State</strong>, verify the suggestions, then use{" "}
                    <strong>Accept All GIS Suggestions</strong> before committing. This
                    approach significantly reduces manual review time and allows hundreds of
                    records to be processed at once.
                </p>
            </div>

            {/* Records table */}
            <Card className="mrpsl-card overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="mrpsl-table-header">
                            <tr>
                                <th className="px-4 py-3">REGISTER</th>
                                <th className="px-4 py-3">HOLDER</th>
                                <th className="px-4 py-3">NEW ADDRESS (CSCS)</th>
                                <th className="px-4 py-3 min-w-55">GIS-DETECTED STATE</th>
                                <th className="px-4 py-3">STATUS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {
                                isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <PendingListSkeleton />
                                        </td>
                                    </tr>
                                ) : isError ? <DataErrorState message={error?.message || "Failed to fetch holders"} onRetry={refetch} /> :
                                    filteredHolders?.length > 0 ? (
                                        filteredHolders.map((h) => {
                                            const confirmedState =
                                                confirmedStates[h.id] !== undefined;
                                            return (
                                                <tr key={h.id} className="hover:bg-accent/5 align-top">
                                                    {/* Register */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {h.registers && h.registers.length > 0 ? (
                                                                h.registers.map((reg) => (
                                                                    <Badge key={reg.id} className="border-0 text-[13px] bg-gray-100 text-gray-800">{reg.symbol}</Badge>
                                                                ))
                                                            ) : (
                                                                <Badge className="border-0 text-[13px] bg-gray-100 text-gray-800">N/A</Badge>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Holder details */}
                                                    <td className="px-4 py-4 text-[13px] space-y-0.5 min-w-45">
                                                        <div className="font-semibold text-sm text-foreground">
                                                            {h.name}
                                                        </div>
                                                        <div className="text-muted-foreground font-mono">
                                                            {h.chn}
                                                        </div>
                                                        {h.phone && (
                                                            <div className="text-muted-foreground">
                                                                {h.phone}
                                                            </div>
                                                        )}
                                                        {h.email && (
                                                            <div className="text-muted-foreground truncate max-w-45">
                                                                {h.email}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* New address */}
                                                    <td className="px-4 py-4 text-[13px] text-muted-foreground leading-relaxed max-w-55">
                                                        {h.address || "No address provided"}
                                                    </td>

                                                    {/* State Jurisdiction Dropdown */}
                                                    <td className="px-4 py-4">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <Select
                                                                    value={confirmedStates[h.id] ?? h.state ?? ""}
                                                                    onValueChange={(state) => {
                                                                        if (!state) return;
                                                                        confirmState(h.id, state);
                                                                        toast.success(
                                                                            `${h.name} state set to ${state}`,
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger
                                                                        className={`h-9 text-[13px] flex-1 min-w-0 ${!confirmedState
                                                                            ? "border-amber-300 bg-amber-50 text-amber-900"
                                                                            : "border-green-300 bg-green-50 text-green-900"
                                                                            }`}
                                                                    >
                                                                        <SelectValue placeholder="Select State" />
                                                                    </SelectTrigger>
                                                                    <SelectContent
                                                                        align="start"
                                                                        alignItemWithTrigger={false}
                                                                        className="max-h-60"
                                                                    >
                                                                        {NIGERIA_STATE_NAMES.map((s) => (
                                                                            <SelectItem key={s} value={s}>
                                                                                {s}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {!confirmedState ? (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-9 px-3 shrink-0 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                                        onClick={() => {
                                                                            confirmState(h.id, h.state || "Lagos");
                                                                            toast.success(
                                                                                `${h.name} state confirmed`,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                ) : (
                                                                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                                                )}
                                                            </div>
                                                            {confirmedState &&
                                                                h.state &&
                                                                confirmedStates[h.id] !== h.state && (
                                                                    <div className="text-[13px] text-muted-foreground">
                                                                        Original:{" "}
                                                                        <span className="font-medium">
                                                                            {h.state}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-4">
                                                        {confirmedState ? (
                                                            <Badge className="bg-green-100 text-green-800 border-0 text-[13px]">
                                                                Confirmed
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-100 text-amber-800 border-0 text-[13px]">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-12 text-center text-muted-foreground text-sm"
                                            >
                                                No records match your filters.
                                            </td>
                                        </tr>
                                    )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls using PaginationBar */}
                {holdersData && (
                    <PaginationBar
                        page={currentPage}
                        pageSize={pageSize}
                        total={holdersData.totalElements || 0}
                        totalPages={holdersData.totalPages || 0}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                )}

            </Card>

        </div>
    );
}