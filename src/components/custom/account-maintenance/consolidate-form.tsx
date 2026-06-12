"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Loader2, Search, X } from "lucide-react";
import { useGetRegisters } from "@/hooks/useRegisters";
import { useGetHolders } from "@/hooks/useCscs";
import { useCreateConsolidation, useGetAccounts } from "@/hooks/useAccountMaintenance";
import { useDebounce } from "@/hooks/useDebounce";
import { Holder } from "@/types/cscs";
import BulkAccountConsolidation from "./bulk-account-consolidation";
import { ShareholderAccount } from "@/types/account-maintenance";

/** A source account added to the table */
interface SourceAccount {
    holderId: string;
    name: string;
    chn: string;
    units: number;
}

export default function Consolidate({ tab }: { tab: string }) {
    const currentUser = useStore((state) => state.currentUser);

    const { data: activeRegisters, isLoading: loadingRegisters } = useGetRegisters({
        size: 100,
        status: "ACTIVE",
    }, {
        enabled: tab === "consol"
    });

    /* ─── shared ─── */
    const [mode, setMode] = useState<"single" | "bulk">("single");
    const [register, setRegister] = useState("");

    /* ─── single flow ─── */
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounce(searchInput, 500);

    const [sourceAccounts, setSourceAccounts] = useState<SourceAccount[]>([]);
    const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
    const [destinationId, setDestinationId] = useState("");
    const [comment, setComment] = useState("");

    const searchValue = debouncedSearch.trim();


    /* search is only triggered when register is chosen and input has ≥1 char */
    const { data: holderResults, isFetching: searchingHolders } = useGetAccounts(
        {
            registerId: register !== "" ? register : undefined,
            q: searchValue,
            pageSize: 20,
        },
        {
            enabled: !!register && debouncedSearch.length > 2,
            refetchOnMount: true,

        },
    );

    const createConsolidation = useCreateConsolidation();

    function addHolderToTable(holder: ShareholderAccount) {
        if (sourceAccounts.some((a) => a.holderId === holder.id)) {
            toast.info("Holder already added.");
            return;
        }
        const account: SourceAccount = {
            holderId: holder.id,
            name: `${holder.firstName} ${holder.lastName}`,
            chn: holder.chn,
            units: holder.holdings ?? 0
        };
        setSourceAccounts((prev) => [...prev, account]);
        setSelectedSourceIds((prev) => new Set([...prev, holder.id]));
        setSearchInput("");
    }

    function removeSource(id: string) {
        setSourceAccounts((prev) => prev.filter((a) => a.holderId !== id));
        setSelectedSourceIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        if (destinationId === id) setDestinationId("");
    }

    function toggleSourceSelect(id: string) {
        setSelectedSourceIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function handleSubmitSingle() {
        if (!register) { toast.error("Please select a register."); return; }
        if (selectedSourceIds.size === 0) { toast.error("Add at least one source account."); return; }
        if (!destinationId) { toast.error("Please select a destination account."); return; }
        if (!comment.trim()) { toast.error("Please enter a comment / reason."); return; }
        if (!currentUser?.email) { toast.error("Session expired. Please log in again."); return; }

        const selectedRegisterObj = activeRegisters?.content.find((r) => r.registerId === register);
        const registerSymbol = selectedRegisterObj?.symbol || register;

        createConsolidation.mutate(
            {
                registerId: registerSymbol,
                sourceAccountIds: Array.from(selectedSourceIds),
                destinationAccountId: destinationId,
                comment,
                initiatedBy: currentUser.email,
            },
            {
                onSuccess: () => {
                    toast.success("Consolidation submitted for authoriser review.");
                    setSourceAccounts([]);
                    setSelectedSourceIds(new Set());
                    setDestinationId("");
                    setComment("");
                },
                onError: (err) => toast.error(err.message || "Failed to submit consolidation."),
            },
        );
    }



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Account Consolidation</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Merge duplicate shareholder accounts into a single surviving account
                    </p>
                </div>
            </div>

            {/* ── top bar: register + mode toggle ── */}
            <div className="flex gap-4 flex-wrap">
                <Select value={register} onValueChange={(value) => setRegister(value || "")}>
                    <SelectTrigger className="w-64 mrpsl-input">
                        <SelectValue placeholder="Select Register *" />
                    </SelectTrigger>
                    <SelectContent>
                        {loadingRegisters && (
                            <SelectItem value="__loading__" disabled>
                                Loading…
                            </SelectItem>
                        )}
                        {activeRegisters?.content.map((r) => (
                            <SelectItem key={r.registerId} value={r.symbol}>
                                {r.registerName} — {r.symbol}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="border rounded-md flex p-1 bg-muted/20">
                    <Button
                        variant={mode === "single" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setMode("single")}
                    >
                        Single
                    </Button>
                    <Button
                        variant={mode === "bulk" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setMode("bulk")}
                    >
                        Bulk Upload
                    </Button>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                SINGLE FLOW
            ═══════════════════════════════════════ */}
            {mode === "single" && (
                <div className="grid grid-cols-5 gap-6">
                    {/* left: source accounts */}
                    <div className="col-span-3 space-y-4">
                        <h3 className="font-semibold text-sm">1. Source Accounts (To be deactivated)</h3>
                        <Card className="mrpsl-card p-4 space-y-4">
                            {!register ? (
                                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
                                    ⚠️ Please select a register above first. All duplicate accounts to consolidate must belong to the same register.
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                                    ℹ️ Searching for duplicate accounts belonging to the selected register.
                                </div>
                            )}
                            {/* search row */}
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Account holder or surname…"
                                        className="pl-9 mrpsl-input"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        disabled={!register}
                                    />
                                </div>
                                {searchingHolders && (
                                    <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" />
                                )}
                            </div>

                            {/* search results */}
                            {holderResults?.data && holderResults.data?.data?.length > 0 && searchInput.length > 0 && (
                                <div className="border rounded-md divide-y text-sm shadow-sm max-h-48 overflow-y-auto">
                                    {holderResults.data?.data?.map((holder) => (
                                        <button
                                            key={holder.id}
                                            onClick={() => addHolderToTable(holder)}
                                            className="w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                                        >
                                            <span className="font-medium">{holder.firstName} {holder.lastName}</span>
                                            <span className="text-muted-foreground font-mono text-xs">{holder.chn}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {debouncedSearch.length > 0 && !searchingHolders && holderResults?.data?.data?.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">No holders found.</p>
                            )}

                            {/* source accounts table */}
                            {sourceAccounts.length > 0 && (
                                <table className="w-full text-left text-sm">
                                    <thead className="mrpsl-table-header">
                                        <tr>
                                            <th className="p-2">
                                                <Checkbox
                                                    checked={
                                                        sourceAccounts.length > 0 &&
                                                        sourceAccounts.every((a) => selectedSourceIds.has(a.holderId))
                                                    }
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedSourceIds(new Set(sourceAccounts.map((a) => a.holderId)));
                                                        } else {
                                                            setSelectedSourceIds(new Set());
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="p-2">CHN</th>
                                            <th className="p-2">NAME</th>
                                            <th className="p-2">HOLDINGS</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-mono text-[13px]">
                                        {sourceAccounts.map((acc) => (
                                            <tr key={acc.holderId} className="mrpsl-table-row">
                                                <td className="p-2">
                                                    <Checkbox
                                                        checked={selectedSourceIds.has(acc.holderId)}
                                                        onCheckedChange={() => toggleSourceSelect(acc.holderId)}
                                                    />
                                                </td>
                                                <td className="p-2 text-muted-foreground">{acc.chn}</td>
                                                <td className="p-2 font-sans font-medium">{acc.name}</td>
                                                <td className="p-2 font-sans font-medium">{acc.units}</td>
                                                <td className="p-2 text-right">
                                                    <button
                                                        onClick={() => removeSource(acc.holderId)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {sourceAccounts.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    Search and add source accounts above.
                                </p>
                            )}
                        </Card>
                    </div>

                    {/* right: destination + submission */}
                    <div className="col-span-2 space-y-4">
                        <h3 className="font-semibold text-sm">2. Destination Account (Surviving)</h3>
                        <Card className="mrpsl-card p-4 space-y-4">
                            <Select
                                value={destinationId}
                                onValueChange={(value) => setDestinationId(value || "")}
                                disabled={sourceAccounts.length === 0}
                            >
                                <SelectTrigger className="mrpsl-input">
                                    <SelectValue placeholder="Select surviving account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sourceAccounts.map((acc) => (
                                        <SelectItem key={acc.holderId} value={acc.holderId}>
                                            {acc.chn} — {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {sourceAccounts.length > 0 && (
                                <div className="bg-muted/20 p-4 rounded-md space-y-3">
                                    <div className="text-[13px] text-muted-foreground">
                                        Merging {selectedSourceIds.size} account{selectedSourceIds.size !== 1 ? "s" : ""} into destination.
                                    </div>
                                    <div className="text-[13px] text-muted-foreground">
                                        Certificates and Dividend History will be unified.
                                    </div>

                                    <Textarea
                                        placeholder="Comment / Reason *"
                                        className="mt-2 focus-visible:ring-primary resize-none"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />

                                    <Button
                                        className="w-full mt-2"
                                        disabled={createConsolidation.isPending || !destinationId || selectedSourceIds.size === 0}
                                        onClick={handleSubmitSingle}
                                    >
                                        {createConsolidation.isPending ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                                        ) : "Submit for Authorisation"}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════
                BULK FLOW
            ═══════════════════════════════════════ */}
            {mode === "bulk" && (
                <BulkAccountConsolidation mode="bulk" register={register} />
            )}
        </div>
    );
}
